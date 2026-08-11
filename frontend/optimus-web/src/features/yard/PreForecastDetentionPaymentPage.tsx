import { FormEvent, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetEdoRenewalsQuery,
  useGetTruckerIntakeSubmissionQuery,
  useSubmitEdoRenewalPaymentMutation,
} from '../../app/api';
import type { RootState } from '../../app/store';
import { API_BASE_URL } from '../../shared/types';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { preForecastStatusColor, preForecastStatusLabel } from './preForecastStatus';

function moneyPhp(amount: number) {
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fileUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function isImagePath(path: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}

function DocumentPreview({
  url,
  title,
  emptyMessage,
}: {
  url: string | null;
  title: string;
  emptyMessage: string;
}) {
  if (!url) {
    return (
      <Alert severity="info" variant="outlined">
        {emptyMessage}
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          minHeight: { xs: 360, md: 520 },
        }}
      >
        {isImagePath(url) ? (
          <Box
            component="img"
            src={url}
            alt={title}
            sx={{
              display: 'block',
              width: '100%',
              height: { xs: 360, md: 520 },
              objectFit: 'contain',
              bgcolor: 'grey.50',
            }}
          />
        ) : (
          <Box
            component="iframe"
            title={title}
            src={url}
            sx={{ width: '100%', height: { xs: 360, md: 520 }, border: 0, display: 'block' }}
          />
        )}
      </Box>
      <Button
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        size="small"
        startIcon={<OpenInNewOutlinedIcon />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Open in new tab
      </Button>
    </Stack>
  );
}

export function PreForecastDetentionPaymentPage() {
  const { id = '' } = useParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const canPay = user?.role === 'Broker' || user?.role === 'Consignee';

  const { data: submission, isLoading, isError } = useGetTruckerIntakeSubmissionQuery(id, { skip: !id });
  const { data: renewals = [] } = useGetEdoRenewalsQuery(undefined, { skip: !canPay });
  const [submitRenewalPayment, { isLoading: submitting }] = useSubmitEdoRenewalPaymentMutation();

  const [receipt, setReceipt] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const renewal = useMemo(
    () => renewals.find((r) => r.id === submission?.renewalRequestId) ?? null,
    [renewals, submission?.renewalRequestId],
  );

  const billingUrl = submission?.detentionBillingPdfPath
    ? fileUrl(submission.detentionBillingPdfPath)
    : null;

  const receiptPath =
    submission?.detentionPaymentReceiptPath ?? renewal?.paymentReceiptPath ?? null;
  const receiptUrl = receiptPath ? fileUrl(receiptPath) : null;

  const amountDue =
    submission?.detentionAmount ??
    renewal?.detentionChargeAmount ??
    (submission?.detentionBillingBaseAmount ?? 0) + (submission?.detentionBillingExtraAmount ?? 0);

  const awaitingPayment = submission?.status === 'AwaitingDetentionPayment';
  const paymentVerified = renewal?.paymentVerified ?? false;
  const paymentReceiptSubmitted =
    submission?.detentionPaymentReceiptSubmitted || renewal?.paymentReceiptSubmitted || false;
  const paymentPending = awaitingPayment && !paymentVerified && paymentReceiptSubmitted;

  if (!canPay) {
    return <Navigate to="/" replace />;
  }

  if (!id) {
    return <Alert severity="error">Missing submission id.</Alert>;
  }

  if (isLoading) {
    return (
      <Stack spacing={3} alignItems="center" py={6}>
        <CircularProgress size={44} />
        <Typography color="text.secondary" fontWeight={600}>
          Loading detention billing…
        </Typography>
      </Stack>
    );
  }

  if (isError || !submission) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Detention billing not found or you do not have access.</Alert>
        <Button component={RouterLink} to="/notifications" startIcon={<ArrowBackOutlinedIcon />}>
          Back to alerts
        </Button>
      </Stack>
    );
  }

  if (!awaitingPayment && submission.status !== 'PendingReview') {
    return (
      <Stack spacing={2}>
        <Alert severity="info">
          This pre-forecast is no longer awaiting detention payment ({preForecastStatusLabel(submission.status)}).
        </Alert>
        <Button component={RouterLink} to="/edo/renewals" variant="outlined">
          Open eDO renewals
        </Button>
      </Stack>
    );
  }

  if (paymentVerified) {
    return (
      <WorkflowPage
        eyebrow="Pre-forecast · Detention"
        title="Detention payment verified"
        subtitle="Accounting validated your payment. Shipping line staff will generate the renewed CRO/eDO next."
        chips={
          <>
            <Chip size="small" label={submission.containerNumber} />
            <Chip size="small" color="success" label="Payment verified" />
          </>
        }
        actions={
          <Button component={RouterLink} to="/edo/renewals" startIcon={<ArrowBackOutlinedIcon />}>
            eDO renewals
          </Button>
        }
      >
        <Alert severity="success">No further payment is required for this container.</Alert>
      </WorkflowPage>
    );
  }

  if (paymentPending) {
    return (
      <WorkflowPage
        eyebrow="Pre-forecast · Detention"
        title="Receipt submitted"
        subtitle="Accounting is reviewing your detention payment receipt. You will be notified when it is validated."
        chips={
          <>
            <Chip size="small" label={submission.containerNumber} variant="outlined" sx={{ fontWeight: 700 }} />
            {submission.manifestNumber && (
              <Chip size="small" label={submission.manifestNumber} color="primary" variant="outlined" />
            )}
            <Chip size="small" color="info" label="Pending validation" />
            <Chip size="small" label={moneyPhp(amountDue)} color="warning" />
          </>
        }
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component={RouterLink} to="/payments" startIcon={<ArrowBackOutlinedIcon />}>
              Detention billings
            </Button>
            <Button component={RouterLink} to="/notifications" variant="outlined">
              Alerts
            </Button>
          </Stack>
        }
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Your payment receipt has been submitted. Upload is locked until accounting completes validation or rejects
          the payment.
        </Alert>
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            alignItems: 'start',
          }}
        >
          <WorkflowSection
            title="Payment receipt"
            subtitle="Proof of payment submitted for accounting validation."
          >
            <DocumentPreview
              url={receiptUrl}
              title={`Payment receipt · ${submission.containerNumber}`}
              emptyMessage="Receipt file is not available yet."
            />
          </WorkflowSection>

          <WorkflowSection
            title="Detention billing statement"
            subtitle="Billing PDF this payment was submitted against."
          >
            <DocumentPreview
              url={billingUrl}
              title={`Detention billing · ${submission.containerNumber}`}
              emptyMessage="Billing PDF is not available."
            />
          </WorkflowSection>
        </Box>
      </WorkflowPage>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!renewal) {
      setFormError('Renewal request is not linked yet. Try again shortly or contact support.');
      return;
    }
    if (!receipt) {
      setFormError('Please upload a payment receipt before submitting.');
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!renewal || !receipt) return;
    setFormError(null);
    try {
      await submitRenewalPayment({
        id: renewal.id,
        amount: amountDue,
        receipt,
      }).unwrap();
      setSuccessMessage('Detention receipt submitted for accounting validation.');
      setConfirmOpen(false);
      setReceipt(null);
    } catch (err: unknown) {
      setFormError(
        (err as { data?: { message?: string } })?.data?.message ?? 'Payment submission failed.',
      );
      setConfirmOpen(false);
    }
  };

  return (
    <WorkflowPage
      eyebrow="Pre-forecast · Detention"
      title="Detention payment"
      subtitle="Review the billing statement and upload your payment receipt. Accounting must validate payment before a new CRO/eDO is issued."
      chips={
        <>
          <Chip size="small" label={submission.containerNumber} variant="outlined" sx={{ fontWeight: 700 }} />
          {submission.manifestNumber && (
            <Chip size="small" label={submission.manifestNumber} color="primary" variant="outlined" />
          )}
          <Chip
            size="small"
            label={preForecastStatusLabel(submission.status)}
            color={preForecastStatusColor(submission.status)}
          />
          <Chip size="small" label={moneyPhp(amountDue)} color="warning" />
        </>
      }
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button component={RouterLink} to="/notifications" startIcon={<ArrowBackOutlinedIcon />}>
            Back to alerts
          </Button>
          <Button component={RouterLink} to="/edo/renewals" variant="outlined">
            eDO renewals
          </Button>
        </Stack>
      }
      stats={[
        { label: 'Amount due', value: moneyPhp(amountDue), hint: 'Philippine pesos', tone: 'warning' },
        {
          label: 'Overdue days',
          value: String(submission.overdueDaysAtCyConfirmed ?? submission.overdueDays),
          hint: 'At CY-confirmed return',
          tone: 'info',
        },
        {
          label: 'Expired eDO',
          value: submission.expiredEdoNumber,
          hint: submission.shippingLineBrandName ?? 'Shipping line',
          tone: 'primary',
        },
      ]}
    >
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage} You will be notified when accounting validates your payment.
        </Alert>
      )}
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
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
        <WorkflowSection
          title="Submit payment receipt"
          subtitle="Pay the exact amount shown, then upload proof of payment."
        >
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2.25}>
              <Typography variant="body2" color="text.secondary">
                Broker / consignee: {submission.brokerName ?? submission.consigneeName ?? '—'}
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileOutlinedIcon />}
                disabled={submitting || !renewal}
                sx={{ alignSelf: 'flex-start' }}
              >
                {receipt ? receipt.name : 'Upload receipt (PDF or image)'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    setReceipt(e.target.files?.[0] ?? null);
                    setFormError(null);
                  }}
                />
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="success"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendOutlinedIcon />}
                disabled={submitting || !renewal}
              >
                Submit for validation
              </Button>
              {!renewal && (
                <Alert severity="warning" variant="outlined">
                  Renewal record is still syncing. Refresh the page in a moment if payment stays disabled.
                </Alert>
              )}
            </Stack>
          </Box>
        </WorkflowSection>

        <WorkflowSection
          title="Detention billing statement"
          subtitle="Generated by accounting after container yard confirmed the return schedule."
        >
          {billingUrl ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  minHeight: { xs: 360, md: 520 },
                }}
              >
                <Box
                  component="iframe"
                  title={`Detention billing · ${submission.containerNumber}`}
                  src={billingUrl}
                  sx={{ width: '100%', height: { xs: 360, md: 520 }, border: 0, display: 'block' }}
                />
              </Box>
              <Button
                component="a"
                href={billingUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                startIcon={<OpenInNewOutlinedIcon />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Open PDF in new tab
              </Button>
            </Stack>
          ) : (
            <Alert severity="info">
              Billing PDF is not available yet. Amount due: <strong>{moneyPhp(amountDue)}</strong>.
            </Alert>
          )}
        </WorkflowSection>
      </Box>

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm detention payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Submit {moneyPhp(amountDue)} detention payment for container {submission.containerNumber}? Accounting
            will review your receipt before the renewed CRO/eDO workflow continues.
          </Typography>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PaymentsOutlinedIcon />}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
