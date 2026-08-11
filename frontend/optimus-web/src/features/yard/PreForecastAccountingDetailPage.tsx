import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom';
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
  FormControlLabel,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useSelector } from 'react-redux';
import { useFinalizeTruckerIntakeAccountingMutation, useGetActivePaymentFeeQuery, useGetTruckerIntakeSubmissionQuery, useVerifyEdoRenewalPaymentMutation } from '../../app/api';
import type { RootState } from '../../app/store';
import { DEFAULT_DETENTION_RATE } from '../../shared/paymentFees';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import {
  buildDefaultDetentionChargeRows,
  isDetentionRateStale,
  mergeDetentionChargeRows,
  resolveDetentionMeta,
  resolveStoredCalculationRate,
  parseChargeRows,
  sumChargeRows,
  type DetentionChargeRow,
} from './preForecastDetentionCharges';
import { preForecastStatusColor, preForecastQueueStatusLabel } from './preForecastStatus';
import { PreForecastBillingSuccessDialog } from './PreForecastBillingSuccessDialog';
import { PreForecastDocumentPreview, preForecastFileUrl } from './preForecastDocumentPreview';

type BillingDialogPhase = 'closed' | 'confirm' | 'generating' | 'success';

function moneyPhp(amount: number) {
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PreviewRow({ label, amount, muted }: { label: string; amount: string; muted?: boolean }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      gap={2}
      py={0.5}
      sx={muted ? { opacity: 0.55, textDecoration: 'line-through' } : undefined}
    >
      <Typography color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
        {label}
      </Typography>
      <Typography fontWeight={700} sx={{ flexShrink: 0 }}>
        {amount}
      </Typography>
    </Stack>
  );
}

export function PreForecastAccountingDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAccounting = user?.role === 'Accounting' || user?.role === 'SystemAdmin';

  const { data: submission, isLoading, isError } = useGetTruckerIntakeSubmissionQuery(id, { skip: !id });
  const { data: activeDetentionFee, refetch: refetchDetentionRate } = useGetActivePaymentFeeQuery('detention');
  const [finalizeAccounting, { isLoading: submitting }] = useFinalizeTruckerIntakeAccountingMutation();
  const [verifyPayment, { isLoading: verifying }] = useVerifyEdoRenewalPaymentMutation();

  const [waiveExtraDays, setWaiveExtraDays] = useState(false);
  const [chargeRows, setChargeRows] = useState<DetentionChargeRow[]>([]);
  const [nextChargeId, setNextChargeId] = useState(1);
  const [acctNotes, setAcctNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [billingDialog, setBillingDialog] = useState<BillingDialogPhase>('closed');
  const [generatedPdfPath, setGeneratedPdfPath] = useState<string | null>(null);
  const [generatedTotal, setGeneratedTotal] = useState(0);

  const hasScheduleDelta = (submission?.scheduleDeltaDays ?? 0) > 0;
  const canGenerate = submission?.status === 'PendingAccountingReview';
  const awaitingPaymentValidation =
    submission?.status === 'AwaitingDetentionPayment' && Boolean(submission?.detentionPaymentReceiptSubmitted);
  const detentionRate =
    activeDetentionFee?.amount ?? submission?.detentionRatePerDay ?? DEFAULT_DETENTION_RATE;
  const storedCalculationRate = submission ? resolveStoredCalculationRate(submission) : null;
  const rateChangedSinceCyConfirm =
    submission != null && isDetentionRateStale(submission, detentionRate);
  const detentionMeta = submission ? resolveDetentionMeta(submission, detentionRate) : null;

  const previewLines = useMemo(() => parseChargeRows(chargeRows), [chargeRows]);
  const previewTotal = useMemo(() => sumChargeRows(chargeRows), [chargeRows]);

  useEffect(() => {
    if (!submission) return;
    setWaiveExtraDays(false);
    setAcctNotes('');
    setFormError(null);
    const defaults = buildDefaultDetentionChargeRows(submission, false, detentionRate);
    setChargeRows(defaults);
    setNextChargeId(defaults.length + 1);
  }, [submission?.id, detentionRate]);

  useEffect(() => {
    if (!submission || !canGenerate) return;
    const defaults = buildDefaultDetentionChargeRows(submission, waiveExtraDays, detentionRate);
    setChargeRows((prev) => {
      const custom = prev.filter((row) => row.kind === 'custom');
      const merged = [...defaults, ...custom.map((row, i) => ({ ...row, id: defaults.length + i + 1 }))];
      return merged;
    });
    setNextChargeId((n) => Math.max(n, defaults.length + 1));
  }, [waiveExtraDays, submission, canGenerate, detentionRate]);

  if (!id) {
    return <Alert severity="error">Missing submission id.</Alert>;
  }

  if (!isAccounting) {
    return <Navigate to={`/pre-forecast/${id}`} replace />;
  }

  if (isLoading) {
    return (
      <Stack spacing={3} alignItems="center" py={6}>
        <CircularProgress size={44} />
        <Typography color="text.secondary" fontWeight={600}>
          Loading detention billing…
        </Typography>
        <Box width="100%" maxWidth={960}>
          <Skeleton variant="rounded" height={200} />
        </Box>
      </Stack>
    );
  }

  if (isError || !submission) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Could not load this pre-forecast submission.</Alert>
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate('/pre-forecast')}>
          Back to pre-forecast queue
        </Button>
      </Stack>
    );
  }

  const billingPdfUrl = submission.detentionBillingPdfPath
    ? preForecastFileUrl(submission.detentionBillingPdfPath)
    : null;
  const receiptUrl = submission.detentionPaymentReceiptPath
    ? preForecastFileUrl(submission.detentionPaymentReceiptPath)
    : null;

  const onVerifyPayment = async () => {
    if (!submission.renewalRequestId) {
      setFormError('Renewal request is not linked to this submission.');
      return;
    }
    setFormError(null);
    try {
      await verifyPayment(submission.renewalRequestId).unwrap();
      navigate('/pre-forecast', {
        replace: true,
        state: { flash: 'Detention payment verified. Shipping line staff can generate the renewed CRO/eDO.' },
      });
    } catch (err: unknown) {
      setFormError(
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to verify detention payment.',
      );
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const { data: latestFee } = await refetchDetentionRate();
    const latestRate = latestFee?.amount ?? detentionRate;
    const syncedRows = mergeDetentionChargeRows(submission, chargeRows, waiveExtraDays, latestRate);
    setChargeRows(syncedRows);

    const lines = parseChargeRows(syncedRows);
    if (lines.length === 0) {
      setFormError('Add at least one charge line with a title and amount.');
      return;
    }
    if (lines.some((line) => line.amount < 0)) {
      setFormError('Charge amounts cannot be negative.');
      return;
    }
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    if (total <= 0 && (submission.overdueDaysAtPreferred ?? 0) > 0) {
      setFormError('Enter at least one charge amount greater than zero.');
      return;
    }
    setBillingDialog('confirm');
  };

  const closeBillingDialog = () => {
    if (billingDialog === 'generating') return;
    setBillingDialog('closed');
  };

  const onConfirm = async () => {
    setFormError(null);
    setBillingDialog('generating');

    const { data: latestFee } = await refetchDetentionRate();
    const latestRate = latestFee?.amount ?? detentionRate;
    const syncedRows = mergeDetentionChargeRows(submission, chargeRows, waiveExtraDays, latestRate);
    setChargeRows(syncedRows);
    const lines = parseChargeRows(syncedRows);

    try {
      const updated = await finalizeAccounting({
        id: submission.id,
        chargeLines: lines,
        waiveExtraDays: waiveExtraDays && hasScheduleDelta ? true : undefined,
        notes: acctNotes || undefined,
      }).unwrap();

      const total = lines.reduce((sum, line) => sum + line.amount, 0);
      setGeneratedTotal(total);
      setGeneratedPdfPath(updated.detentionBillingPdfPath ?? null);
      setBillingDialog('success');
    } catch (err: unknown) {
      setBillingDialog('closed');
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String(
              (err as { data?: { message?: string; error?: string } }).data?.message ??
                (err as { data?: { error?: string } }).data?.error ??
                'Failed to generate detention billing.',
            )
          : 'Failed to generate detention billing.';
      setFormError(msg);
    }
  };

  const onBackToQueue = () => {
    setBillingDialog('closed');
    navigate('/pre-forecast', {
      replace: true,
      state: { flash: 'Detention billing statement generated successfully.' },
    });
  };

  const onOpenGeneratedPdf = () => {
    if (!generatedPdfPath) return;
    window.open(preForecastFileUrl(generatedPdfPath), '_blank', 'noopener,noreferrer');
  };

  return (
    <WorkflowPage
      eyebrow="Pre-forecast · Accounting"
      title={awaitingPaymentValidation ? 'Validate Detention Payment' : 'Generate Detention Billing'}
      subtitle={
        awaitingPaymentValidation
          ? 'Compare the broker payment receipt against the detention billing statement, then verify payment.'
          : 'Add detention charge lines (title + amount) — same pattern as manifest billing after BL upload.'
      }
      chips={
        <>
          <Chip size="small" label={submission.containerNumber} variant="outlined" sx={{ fontWeight: 700 }} />
          <Chip
            size="small"
            label={preForecastQueueStatusLabel(submission.status, submission.detentionPaymentReceiptSubmitted)}
            color={awaitingPaymentValidation ? 'info' : preForecastStatusColor(submission.status)}
          />
          <Chip size="small" label={submission.expiredEdoNumber} variant="outlined" />
          {submission.manifestNumber && (
            <Chip size="small" label={submission.manifestNumber} variant="outlined" />
          )}
        </>
      }
      actions={
        <Button component={RouterLink} to="/pre-forecast" startIcon={<ArrowBackOutlinedIcon />} variant="outlined" size="small">
          Pre-forecast queue
        </Button>
      }
      stats={[
        {
          label: 'Rate / day',
          value: moneyPhp(detentionMeta?.rate ?? detentionRate),
          hint: detentionMeta?.freeUntil !== '—' ? `Free through ${detentionMeta?.freeUntil}` : 'Detention rate',
          tone: 'info',
        },
        {
          label: 'Preferred return',
          value: detentionMeta?.preferredDate ?? '—',
          hint: detentionMeta ? `${detentionMeta.overduePreferred} overdue day(s)` : 'Trucker date',
          tone: 'primary',
        },
        {
          label: 'CY confirmed',
          value: detentionMeta?.cyDate ?? '—',
          hint: detentionMeta ? `${detentionMeta.overdueCy} overdue day(s)` : 'Return date',
          tone: hasScheduleDelta ? 'warning' : 'default',
        },
      ]}
    >
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {awaitingPaymentValidation && (
        <Stack spacing={2.5} sx={{ mb: 2.5 }}>
          <Alert severity="info">
            Broker/consignee submitted a payment receipt for <strong>{moneyPhp(submission.detentionAmount)}</strong>.
            Verify the receipt matches the billing statement before releasing the workflow to shipping line staff.
          </Alert>
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              alignItems: 'start',
            }}
          >
            <WorkflowSection title="Payment receipt" subtitle="Uploaded proof of payment from broker/consignee.">
              <PreForecastDocumentPreview
                url={receiptUrl}
                title={`Payment receipt · ${submission.containerNumber}`}
                emptyMessage="Receipt file is not available."
              />
            </WorkflowSection>
            <WorkflowSection title="Detention billing statement" subtitle="Generated detention invoice for this container.">
              <PreForecastDocumentPreview
                url={billingPdfUrl}
                title={`Detention billing · ${submission.containerNumber}`}
                emptyMessage="Billing PDF is not available."
              />
            </WorkflowSection>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              disabled={verifying || !submission.renewalRequestId}
              onClick={onVerifyPayment}
              startIcon={verifying ? <CircularProgress size={18} color="inherit" /> : <ReceiptLongOutlinedIcon />}
            >
              {verifying ? 'Verifying…' : 'Verify detention payment'}
            </Button>
            <Button component={RouterLink} to="/pre-forecast" variant="outlined">
              Back to queue
            </Button>
          </Stack>
        </Stack>
      )}

      {!awaitingPaymentValidation && rateChangedSinceCyConfirm && canGenerate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Shipping line admin updated the detention rate from{' '}
          <strong>{moneyPhp(storedCalculationRate ?? 0)}/day</strong> to{' '}
          <strong>{moneyPhp(detentionRate)}/day</strong>. Charge lines use the current rate — review the amounts,
          then generate billing.
        </Alert>
      )}

      {!canGenerate && billingPdfUrl && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Detention billing was already generated. Broker/consignee can submit payment against this statement.
        </Alert>
      )}

      {!awaitingPaymentValidation && (
      <Box
        component={canGenerate ? 'form' : 'div'}
        onSubmit={canGenerate ? onSubmit : undefined}
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          alignItems: 'start',
        }}
      >
        <WorkflowSection
          title="Billing details"
          subtitle={
            canGenerate
              ? 'Charge lines appear on the detention billing statement PDF.'
              : 'Finalized detention billing for this pre-forecast submission.'
          }
        >
          <Stack spacing={2.25}>
            {detentionMeta && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                  Detention calculation
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Free time through <strong>{detentionMeta.freeUntil}</strong> (eDO expiry). Detention accrues from{' '}
                  <strong>{detentionMeta.firstDetentionDay}</strong> at <strong>{moneyPhp(detentionMeta.rate)}/day</strong>.
                </Typography>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      To preferred return ({detentionMeta.preferredDate})
                    </Typography>
                    <Typography fontWeight={700}>
                      {detentionMeta.overduePreferred} day(s) × {moneyPhp(detentionMeta.rate)} ={' '}
                      {moneyPhp(detentionMeta.preferredCharge)}
                    </Typography>
                  </Box>
                  {detentionMeta.extraCyDays > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        CY extra days (+{detentionMeta.extraCyDays}d to {detentionMeta.cyDate})
                      </Typography>
                      <Typography fontWeight={700} color={waiveExtraDays ? 'text.secondary' : 'warning.dark'}>
                        {detentionMeta.extraCyDays} day(s) × {moneyPhp(detentionMeta.rate)} ={' '}
                        {waiveExtraDays ? 'Waived' : moneyPhp(detentionMeta.extraCyCharge)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}

            {hasScheduleDelta && canGenerate && (
              <Alert severity="warning" icon={<WarningAmberOutlinedIcon />}>
                CY confirmed {detentionMeta?.cyDate} — trucker preferred {detentionMeta?.preferredDate} (+
                {submission.scheduleDeltaDays} day{submission.scheduleDeltaDays === 1 ? '' : 's'}). You may waive extra
                detention caused by CY availability.
              </Alert>
            )}

            {hasScheduleDelta && canGenerate && (
              <FormControlLabel
                control={
                  <Switch
                    checked={waiveExtraDays}
                    onChange={(e) => setWaiveExtraDays(e.target.checked)}
                    color="warning"
                    disabled={submitting}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Waive extra days (CY schedule change)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Removes the CY extra-day charge line from the statement.
                    </Typography>
                  </Box>
                }
              />
            )}

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
                <Typography fontWeight={700} variant="body2">
                  Detention charges
                </Typography>
                {canGenerate && (
                  <Button
                    size="small"
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => {
                      setChargeRows((rows) => [
                        ...rows,
                        { id: nextChargeId, kind: 'custom', description: '', amount: '' },
                      ]);
                      setNextChargeId((n) => n + 1);
                    }}
                    sx={{ textTransform: 'none' }}
                    disabled={submitting}
                  >
                    Add charge
                  </Button>
                )}
              </Stack>

              {chargeRows.length === 0 && canGenerate ? (
                <Typography variant="body2" color="text.secondary">
                  No charge lines yet — add detention or other fees.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {chargeRows.map((row) => (
                    <Stack key={row.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                      <TextField
                        size="small"
                        label="Charge title"
                        value={row.description}
                        onChange={(e) =>
                          setChargeRows((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, description: e.target.value } : r)),
                          )
                        }
                        fullWidth
                        disabled={!canGenerate || submitting}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Amount (PHP)"
                        value={row.amount}
                        onChange={(e) =>
                          setChargeRows((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, amount: e.target.value } : r)),
                          )
                        }
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{ width: { sm: 150 }, flexShrink: 0 }}
                        disabled={!canGenerate || submitting}
                      />
                      {canGenerate && (
                        <IconButton
                          aria-label="Remove charge"
                          color="error"
                          onClick={() => setChargeRows((rows) => rows.filter((r) => r.id !== row.id))}
                          sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
                          disabled={submitting}
                        >
                          <CloseOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>

            <TextField
              label="Billing notes"
              multiline
              minRows={3}
              value={canGenerate ? acctNotes : submission.terminalNotes ?? ''}
              onChange={(e) => setAcctNotes(e.target.value)}
              fullWidth
              disabled={!canGenerate || submitting}
              placeholder="Optional notes on the billing statement (waiver reason, adjustments, etc.)"
            />

            {canGenerate && (
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.25} pt={0.5}>
                <Button component={RouterLink} to="/pre-forecast" disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<ReceiptLongOutlinedIcon />}
                  disabled={submitting}
                >
                  Generate billing
                </Button>
              </Stack>
            )}
          </Stack>
        </WorkflowSection>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            position: { lg: 'sticky' },
            top: { lg: 88 },
          }}
        >
          <Typography variant="h6" fontWeight={700} mb={2}>
            Billing preview
          </Typography>

          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              display: 'grid',
              gap: 1,
            }}
          >
            {[
              ['Container', submission.containerNumber],
              ['Expired CRO/eDO', submission.expiredEdoNumber],
              ['Manifest #', submission.manifestNumber ?? '—'],
              ['Broker', submission.brokerName ?? '—'],
              ['Consignee', submission.consigneeName ?? '—'],
              ['Free time through', detentionMeta?.freeUntil ?? '—'],
              ['First detention day', detentionMeta?.firstDetentionDay ?? '—'],
            ].map(([label, value]) => (
              <Stack
                key={label}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                gap={2}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  {value}
                </Typography>
              </Stack>
            ))}
          </Box>

          <Stack spacing={1.5} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            {(canGenerate ? previewLines : [
              ...(submission.detentionBillingBaseAmount
                ? [{ description: 'Base detention', amount: submission.detentionBillingBaseAmount }]
                : []),
              ...(submission.detentionBillingExtraAmount
                ? [{ description: 'Extra detention (CY)', amount: submission.detentionBillingExtraAmount }]
                : []),
            ]).map((line) => (
              <PreviewRow
                key={`${line.description}-${line.amount}`}
                label={line.description}
                amount={moneyPhp(line.amount)}
                muted={
                  line.description.toLowerCase().includes('extra') &&
                  (waiveExtraDays || submission.extraDaysWaived)
                }
              />
            ))}
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            mt={2.5}
            pt={2}
            sx={{ borderTop: 2, borderColor: 'divider' }}
          >
            <Typography fontWeight={700} fontSize={18}>
              Total amount
            </Typography>
            <Typography fontWeight={800} fontSize={26} color="primary.main" lineHeight={1.1}>
              {moneyPhp(canGenerate ? previewTotal : submission.detentionAmount)}
            </Typography>
          </Stack>

          <Alert severity="info" icon={<InfoOutlinedIcon fontSize="inherit" />} sx={{ mt: 2.5, alignItems: 'flex-start' }}>
            <Typography variant="body2" fontWeight={700} mb={0.5}>
              Rate reference
            </Typography>
            <Typography variant="body2">
              {detentionMeta
                ? `${detentionMeta.overduePreferred} overdue day(s) to preferred return · ${detentionMeta.overdueCy} to CY date @ ${moneyPhp(detentionMeta.rate)}/day`
                : 'Detention is calculated from expired free time to the return date.'}
            </Typography>
          </Alert>

          {billingPdfUrl && (
            <Stack spacing={1.25} mt={2.5}>
              <Button
                href={billingPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                startIcon={<OpenInNewOutlinedIcon />}
              >
                Open billing PDF
              </Button>
              <Box
                component="iframe"
                src={billingPdfUrl}
                title="Detention billing PDF"
                sx={{
                  width: '100%',
                  height: 360,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                }}
              />
            </Stack>
          )}
        </Paper>
      </Box>
      )}

      <Dialog
        open={billingDialog === 'confirm' || billingDialog === 'generating'}
        onClose={closeBillingDialog}
        fullWidth
        maxWidth="sm"
      >
        {billingDialog === 'generating' ? (
          <>
            <DialogTitle>Generating detention billing</DialogTitle>
            <DialogContent dividers>
              <Stack alignItems="center" spacing={2} py={4}>
                <CircularProgress size={48} />
                <Typography fontWeight={700}>Creating billing statement…</Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Building the PDF and notifying{' '}
                  <strong>
                    {submission.brokerName?.trim() || submission.consigneeName?.trim()
                      ? [submission.brokerName, submission.consigneeName].filter(Boolean).join(' and ')
                      : 'broker and consignee'}
                  </strong>
                  . Please wait.
                </Typography>
              </Stack>
            </DialogContent>
          </>
        ) : (
          <>
            <DialogTitle>Confirm detention billing</DialogTitle>
            <DialogContent dividers>
              <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
                This creates the detention billing statement PDF and sends an in-app notification to the broker and
                consignee to submit payment.
              </Alert>
              {(submission.brokerName || submission.consigneeName) && (
                <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                  Will notify:{' '}
                  <strong>
                    {[submission.brokerName, submission.consigneeName].filter(Boolean).join(' · ')}
                  </strong>
                </Alert>
              )}
              <Stack spacing={1}>
                <Typography fontWeight={700}>Total {moneyPhp(previewTotal)}</Typography>
                {previewLines.map((line) => (
                  <Typography key={`${line.description}-${line.amount}`} variant="body2" color="text.secondary">
                    {line.description}: {moneyPhp(line.amount)}
                  </Typography>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions sx={dialogActionsSx}>
              <Button onClick={closeBillingDialog}>Back</Button>
              <Button
                variant="contained"
                onClick={() => void onConfirm()}
                startIcon={<ReceiptLongOutlinedIcon />}
              >
                Confirm generate
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <PreForecastBillingSuccessDialog
        open={billingDialog === 'success'}
        containerNumber={submission.containerNumber}
        totalLabel={moneyPhp(generatedTotal || previewTotal)}
        brokerName={submission.brokerName}
        consigneeName={submission.consigneeName}
        onBackToQueue={onBackToQueue}
        onOpenPdf={generatedPdfPath ? onOpenGeneratedPdf : undefined}
      />
    </WorkflowPage>
  );
}
