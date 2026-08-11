import { FormEvent, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { Link as RouterLink, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetActivePaymentFeeQuery,
  useGetEdoQuery,
  useSubmitEdoPaymentMutation,
} from '../../app/api';
import type { RootState } from '../../app/store';
import {
  canSubmitEdoPayToOpen,
  edoPayToOpenNotice,
  isPreForecastRenewalEdo,
  shouldShowEdoPayToOpenNotice,
} from '../../shared/edoPayToOpen';
import {
  edoNeedsPayment,
  edoPaymentRejected,
  edoPaymentSubmitted,
  formatEdoStatus,
} from '../../shared/formatEdoStatus';
import {
  EDO_PAYMENT_RECEIPT_ACCEPT,
  isEdoPaymentReceiptFile,
} from '../../shared/edoPaymentReceipt';
import { paymentFeeDocUrl, resolveEdoFeeAmount } from '../../shared/paymentFees';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { RenewedEdoBadge } from './RenewedEdoBadge';

function money(amount: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function EdoPayToOpenPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';

  const { data: edo, isLoading, isError, refetch } = useGetEdoQuery(id, { skip: !id });
  const { data: edoFee } = useGetActivePaymentFeeQuery('edo');
  const [submitPayment] = useSubmitEdoPaymentMutation();

  const [receipt, setReceipt] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const returnTo = useMemo(() => {
    if (!edo) return '/pre-forecast?tab=submissions';
    if (from === 'pre-forecast' || role === 'Trucker') {
      return edo.preForecastSubmissionId
        ? `/pre-forecast/${edo.preForecastSubmissionId}`
        : '/pre-forecast?tab=submissions';
    }
    return `/edo/${edo.id}`;
  }, [edo, from, role]);

  if (!shouldShowEdoPayToOpenNotice(role)) {
    return <Navigate to={id ? `/edo/${id}` : '/'} replace />;
  }

  if (isLoading) {
    return <Typography py={4}>Loading payment details…</Typography>;
  }

  if (isError || !edo) {
    return <Alert severity="error">Could not load this eDO payment request.</Alert>;
  }

  const paymentSubmitted = edoPaymentSubmitted(edo.currentPaymentStatus);
  const paymentRejected = edoPaymentRejected(edo.currentPaymentStatus);
  const needsPayment = edoNeedsPayment(edo.status, edo.currentPaymentStatus);
  const canSubmit = canSubmitEdoPayToOpen(role, edo);
  const isRenewed = isPreForecastRenewalEdo(edo);
  const displayStatus = formatEdoStatus(edo.status, edo.currentPaymentStatus);

  if (!isRenewed && role === 'Trucker') {
    return <Navigate to={`/edo/${edo.id}`} replace />;
  }

  if (!needsPayment && !paymentSubmitted) {
    return <Navigate to={returnTo} replace />;
  }

  const amount = resolveEdoFeeAmount(edoFee, edo.feeAmount, { lockSnapshot: paymentSubmitted });
  const paymentQrUrl = paymentFeeDocUrl(edoFee?.qrCodePath);
  const currency = 'PHP';
  const payNotice = edoPayToOpenNotice(role, edo, money(amount, currency));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!receipt) {
      setFormError('Please upload a payment receipt before submitting.');
      return;
    }
    if (!isEdoPaymentReceiptFile(receipt)) {
      setFormError('Receipt must be a PDF or image file (PNG, JPG).');
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!receipt) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await submitPayment({
        edoId: edo.id,
        amount,
        currency,
        receipt,
      }).unwrap();
      setConfirmOpen(false);
      await refetch();
      navigate(returnTo, {
        replace: true,
        state: { flash: 'eDO payment submitted. Waiting for accounting validation.' },
      });
    } catch (err: unknown) {
      setConfirmOpen(false);
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String(
              (err as { data?: { message?: string; error?: string } }).data?.message ??
                (err as { data?: { error?: string } }).data?.error ??
                'Failed to submit payment.',
            )
          : 'Failed to submit payment.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (paymentSubmitted) {
    return (
      <WorkflowPage
        eyebrow="Renewed eDO payment"
        title="Payment submitted"
        subtitle="Your receipt is with accounting. The renewed CRO/eDO unlocks after validation and release."
        chips={
          <>
            <RenewedEdoBadge variant="outlined" />
            <Chip size="small" label={edo.edoNumber} variant="outlined" sx={{ fontFamily: 'monospace' }} />
            <Chip size="small" label={displayStatus} color="info" />
          </>
        }
        actions={
          <Button component={RouterLink} to={returnTo} startIcon={<ArrowBackOutlinedIcon />} sx={{ textTransform: 'none' }}>
            Back to pre-forecast
          </Button>
        }
        stats={[
          { label: 'Container', value: edo.containerNumber ?? '—', hint: 'Linked container', tone: 'primary' },
          { label: 'Fee paid', value: money(amount, currency), hint: 'eDO access fee', tone: 'info' },
          {
            label: 'Submitted',
            value: edo.paymentSubmittedAt ? new Date(edo.paymentSubmittedAt).toLocaleDateString() : '—',
            hint: 'Awaiting validation',
            tone: 'warning',
          },
        ]}
      >
        <Alert severity="info" icon={<HourglassTopOutlinedIcon />}>
          Payment submitted successfully. Accounting will verify your receipt before the renewed CRO/eDO can be
          opened or downloaded.
        </Alert>
      </WorkflowPage>
    );
  }

  if (!canSubmit) {
    return (
      <WorkflowPage
        eyebrow="Renewed eDO payment"
        title="Trucker payment required"
        subtitle="This renewed CRO/eDO cannot be opened until the assigned trucker pays the access fee."
        chips={
          <>
            <RenewedEdoBadge variant="outlined" />
            <Chip size="small" label={edo.edoNumber} variant="outlined" sx={{ fontFamily: 'monospace' }} />
          </>
        }
        actions={
          <Button component={RouterLink} to={returnTo} startIcon={<ArrowBackOutlinedIcon />} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        }
        stats={[
          { label: 'Container', value: edo.containerNumber ?? '—', hint: 'Empty return', tone: 'primary' },
          { label: 'Fee due', value: money(amount, currency), hint: 'Trucker pays', tone: 'warning' },
          { label: 'Status', value: displayStatus, hint: 'Pay to open', tone: 'warning' },
        ]}
      >
        {payNotice && (
          <Alert severity={payNotice.severity}>
            <Typography fontWeight={800} gutterBottom>
              {payNotice.title}
            </Typography>
            <Typography variant="body2">{payNotice.body}</Typography>
          </Alert>
        )}
      </WorkflowPage>
    );
  }

  return (
    <WorkflowPage
      eyebrow="Renewed eDO payment"
      title={paymentRejected ? 'Resubmit eDO payment' : 'Pay to open renewed eDO'}
      subtitle="Upload proof of the eDO access fee. Accounting validates before the renewed CRO/eDO can be opened."
      chips={
        <>
          <RenewedEdoBadge variant="outlined" />
          <Chip size="small" icon={<LocalShippingOutlinedIcon />} label="Trucker payment" color="primary" variant="outlined" />
          <Chip size="small" label={edo.edoNumber} variant="outlined" sx={{ fontFamily: 'monospace' }} />
          <Chip size="small" label={money(amount, currency)} color="warning" />
        </>
      }
      actions={
        <Button component={RouterLink} to={returnTo} startIcon={<ArrowBackOutlinedIcon />} sx={{ textTransform: 'none' }}>
          Back to pre-forecast
        </Button>
      }
      stats={[
        {
          label: 'Container',
          value: edo.containerNumber ?? '—',
          hint: edo.renewedFromEdoNumber ? 'Replaces expired release' : 'Linked container',
          tone: 'primary',
        },
        { label: 'Fee due', value: money(amount, currency), hint: 'eDO access fee', tone: 'warning' },
        { label: 'Status', value: displayStatus, hint: 'Awaiting your payment', tone: 'warning' },
      ]}
    >
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {paymentRejected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your previous payment was rejected. Upload a new receipt to resubmit.
        </Alert>
      )}

      {edo.renewedFromEdoNumber && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          This <strong>renewed eDO</strong> replaces expired <strong>{edo.renewedFromEdoNumber}</strong>. Pay the
          access fee below to complete your pre-forecast empty return.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2fr) minmax(0, 3fr)' },
          alignItems: 'start',
        }}
      >
        <WorkflowSection title="Payment instructions" subtitle="Pay the exact fee, then upload your receipt.">
          <Stack spacing={2}>
            <TextField
              label="Payment amount"
              value={money(amount, currency)}
              InputProps={{ readOnly: true }}
              helperText="Pay in Philippine Pesos."
              fullWidth
            />
            {paymentQrUrl && (
              <Box>
                <Typography variant="body2" fontWeight={700} mb={1}>
                  Scan to pay
                </Typography>
                <Box
                  component="img"
                  src={paymentQrUrl}
                  alt="Payment QR"
                  sx={{ maxWidth: 220, borderRadius: 1, border: 1, borderColor: 'divider' }}
                />
              </Box>
            )}
          </Stack>
        </WorkflowSection>

        <WorkflowSection title="Submit payment receipt" subtitle="Required before the renewed document can open.">
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2.25}>
              <Box>
                <Typography variant="body2" fontWeight={700} mb={1}>
                  Payment receipt (PDF or image) *
                </Typography>
                <Box
                  component="label"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.75,
                    px: 2,
                    py: 2.25,
                    border: 1,
                    borderStyle: 'dashed',
                    borderColor: receipt ? 'success.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: receipt ? 'action.hover' : 'background.default',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      bgcolor: receipt ? 'success.main' : 'action.selected',
                      color: receipt ? 'success.contrastText' : 'text.secondary',
                    }}
                  >
                    {receipt ? <InsertDriveFileOutlinedIcon /> : <UploadFileOutlinedIcon />}
                  </Box>
                  <Box minWidth={0} flex={1}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {receipt ? receipt.name : 'Choose receipt file'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {EDO_PAYMENT_RECEIPT_ACCEPT}
                    </Typography>
                  </Box>
                  <input
                    type="file"
                    hidden
                    accept={EDO_PAYMENT_RECEIPT_ACCEPT}
                    onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  />
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="warning"
                size="large"
                startIcon={<SendOutlinedIcon />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Submit payment receipt
              </Button>
            </Stack>
          </Box>
        </WorkflowSection>
      </Box>

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Submit eDO payment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Submit <strong>{money(amount, currency)}</strong> receipt for renewed eDO{' '}
            <strong>{edo.edoNumber}</strong>? Accounting will validate before the document opens.
          </Typography>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button disabled={submitting} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={submitting} onClick={() => void onConfirm()}>
            {submitting ? 'Submitting…' : 'Confirm submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
