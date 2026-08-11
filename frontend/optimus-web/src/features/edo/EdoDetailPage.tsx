import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import { Link as RouterLink, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetEdoAuditQuery, useGetEdoQuery, useGetActivePaymentFeeQuery, useRegenerateEdoPdfMutation } from '../../app/api';
import { openEdoFile } from '../../shared/edoDownload';
import { edoPayToOpenNotice, shouldShowEdoPayToOpenNotice, canSubmitEdoPayToOpen, isPreForecastRenewalEdo } from '../../shared/edoPayToOpen';
import { resolveEdoFeeAmount } from '../../shared/paymentFees';
import {
  edoCanDownload,
  edoDownloadBlockedMessage,
  edoNeedsPayment,
  edoPaymentRejected,
  edoPaymentSubmitted,
  formatEdoStatus,
} from '../../shared/formatEdoStatus';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { DetailRow } from '../shared/DetailRow';
import { EdoActivityTimeline } from './EdoActivityTimeline';
import { edoPayToOpenPath } from './edoPayToOpenPaths';
import { RenewedEdoBadge } from './RenewedEdoBadge';

type TabKey = 'overview' | 'payment' | 'files' | 'activity';

const TAB_KEYS: TabKey[] = ['overview', 'payment', 'files', 'activity'];

function formatWhen(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function money(amount: number, currency = 'PHP') {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusTone(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (/released|active/i.test(status)) return 'success';
  if (/pending/i.test(status)) return 'warning';
  if (/reject|expired|locked/i.test(status)) return 'error';
  return 'info';
}

function parseTab(value: string | null): TabKey {
  if (value && TAB_KEYS.includes(value as TabKey)) {
    return value as TabKey;
  }
  return 'overview';
}

export function EdoDetailPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get('from');
  const tab = parseTab(searchParams.get('tab'));
  const { user, accessToken } = useSelector((state: RootState) => state.auth);

  const { data: edo, isLoading, error } = useGetEdoQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const { data: audit = [], isLoading: auditLoading } = useGetEdoAuditQuery(id, { skip: !id });
  const { data: edoFee } = useGetActivePaymentFeeQuery('edo');
  const [regeneratePdf, { isLoading: regenerating }] = useRegenerateEdoPdfMutation();
  const [regenerateMessage, setRegenerateMessage] = useState<string | null>(null);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const backPath =
    from === 'release'
      ? '/edo/release'
      : from === 'validation'
        ? '/edo/payment-validation'
        : from === 'pre-forecast'
          ? edo?.preForecastSubmissionId
            ? `/pre-forecast/${edo.preForecastSubmissionId}`
            : '/pre-forecast?tab=submissions'
          : user?.role === 'Trucker'
            ? '/pre-forecast?tab=submissions'
            : '/edo';

  const role = user?.role ?? '';
  const canRegeneratePdf = ['SlStaff', 'ShippingLinesAdmin', 'SystemAdmin'].includes(role);
  const canDownload = edo ? edoCanDownload(edo.status, role) : false;
  const needsPayment = edo ? edoNeedsPayment(edo.status, edo.currentPaymentStatus) : false;
  const showPayNotice = shouldShowEdoPayToOpenNotice(role);
  const canSubmitPayment = edo ? canSubmitEdoPayToOpen(role, edo) : false;

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const openDocument = async (kind: 'download' | 'qr') => {
    if (!accessToken || !edo) return;
    await openEdoFile(edo.id, kind, accessToken);
  };

  const handleRegeneratePdf = async (openAfter = false) => {
    if (!edo || !accessToken) return;
    setRegenerateMessage(null);
    setRegenerateError(null);
    try {
      const updated = await regeneratePdf(edo.id).unwrap();
      setRegenerateMessage('PDF regenerated with the ICS CRO/eDO template.');
      if (openAfter) {
        await openEdoFile(edo.id, 'download', accessToken, updated.pdfPath);
      }
    } catch (e: unknown) {
      setRegenerateError(e instanceof Error ? e.message : 'Could not regenerate PDF.');
    }
  };

  const statusLabel = useMemo(
    () => (edo ? formatEdoStatus(edo.status, edo.currentPaymentStatus) : ''),
    [edo],
  );

  if (isLoading) {
    return <Typography py={4}>Loading eDO details…</Typography>;
  }

  if (error || !edo) {
    return (
      <Alert severity="error">
        Could not load this eDO/CRO. It may have been removed or you may not have access.
      </Alert>
    );
  }

  const feeAmount = resolveEdoFeeAmount(edoFee, edo.feeAmount, {
    lockSnapshot:
      edoPaymentSubmitted(edo.currentPaymentStatus) && !edoPaymentRejected(edo.currentPaymentStatus),
  });
  const payNotice = edoPayToOpenNotice(role, edo, money(feeAmount));
  const isRenewedPreForecast = isPreForecastRenewalEdo(edo);
  const paymentPageFrom = from === 'pre-forecast' ? 'pre-forecast' : undefined;

  if (
    isRenewedPreForecast &&
    canSubmitPayment &&
    (needsPayment || tab === 'payment')
  ) {
    return <Navigate to={edoPayToOpenPath(edo.id, paymentPageFrom)} replace />;
  }

  return (
    <WorkflowPage
      eyebrow="eDO / CRO details"
      title={edo.edoNumber}
      subtitle="Document record with payment validation, release status, files, and activity."
      chips={
        <>
          <Chip size="small" label={statusLabel} color={statusTone(edo.status)} />
          {edo.isRenewed && <RenewedEdoBadge variant="outlined" />}
          <Chip size="small" label={edo.manifestNumber} variant="outlined" sx={{ fontFamily: 'monospace' }} />
        </>
      }
      actions={
        <Button
          component={RouterLink}
          to={backPath}
          startIcon={<ArrowBackOutlinedIcon />}
          sx={{ textTransform: 'none' }}
        >
          Back
        </Button>
      }
      stats={[
        { label: 'Container', value: edo.containerNumber ?? '—', hint: 'Linked container', tone: 'info' },
        {
          label: 'Generated',
          value: new Date(edo.generatedAt).toLocaleDateString(),
          hint: formatWhen(edo.generatedAt),
          tone: 'primary',
        },
        {
          label: 'Released',
          value: edo.releasedAt ? new Date(edo.releasedAt).toLocaleDateString() : '—',
          hint: edo.releasedByName ?? 'Not released yet',
          tone: edo.releasedAt ? 'success' : 'warning',
        },
      ]}
    >
      {payNotice && (
        <Alert severity={payNotice.severity} sx={{ mb: 2 }}>
          <Typography fontWeight={800} gutterBottom>
            {payNotice.title}
          </Typography>
          <Typography variant="body2">{payNotice.body}</Typography>
          {canSubmitPayment && isRenewedPreForecast && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              component={RouterLink}
              to={edoPayToOpenPath(edo.id, paymentPageFrom)}
              sx={{ mt: 1.5 }}
            >
              Go to payment page
            </Button>
          )}
          {canSubmitPayment && !isRenewedPreForecast && tab !== 'payment' && (
            <Button size="small" variant="outlined" color="warning" sx={{ mt: 1.5 }} onClick={() => setTab('payment')}>
              Go to payment
            </Button>
          )}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, value: TabKey) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 44,
            '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab value="overview" label="Overview" />
          <Tab value="payment" label="Payment" />
          <Tab
            value="files"
            label={
              canDownload ? (
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <span>Files</span>
                  <Chip size="small" label="Ready" color="success" sx={{ height: 20, fontWeight: 700 }} />
                </Stack>
              ) : (
                'Files'
              )
            }
          />
          <Tab
            value="activity"
            label={
              audit.length > 0 ? (
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <span>Activity</span>
                  <Chip size="small" label={audit.length} color="primary" sx={{ height: 20, fontWeight: 700 }} />
                </Stack>
              ) : (
                'Activity'
              )
            }
          />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {tab === 'overview' && (
            <WorkflowSection title="Document" subtitle="Core eDO/CRO identifiers and lifecycle dates.">
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <DetailRow label="eDO / CRO number" value={edo.edoNumber} />
                <DetailRow
                  label="Manifest"
                  value={
                    <Button
                      component={RouterLink}
                      to={`/manifests/${edo.manifestId}?tab=documents`}
                      size="small"
                      endIcon={<OpenInNewOutlinedIcon />}
                      sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                    >
                      {edo.manifestNumber}
                    </Button>
                  }
                />
                <DetailRow label="Container" value={edo.containerNumber ?? '—'} />
                <DetailRow label="CY location" value={edo.cyLocation ?? '—'} />
                <DetailRow label="Status" value={statusLabel} />
                <DetailRow label="Generated" value={formatWhen(edo.generatedAt)} />
                <DetailRow label="Expires" value={formatWhen(edo.expiresAt)} />
                <DetailRow label="Released" value={formatWhen(edo.releasedAt)} />
                <DetailRow label="Released by" value={edo.releasedByName ?? '—'} />
                {edo.rejectionReason && (
                  <DetailRow label="Rejection reason" value={edo.rejectionReason} />
                )}
              </Paper>
            </WorkflowSection>
          )}

          {tab === 'payment' && (
            <WorkflowSection
              title="Payment"
              subtitle={
                edo.isRenewed
                  ? 'Pre-forecast renewed CRO/eDO — trucker pays the access fee to open the document.'
                  : 'Broker eDO access fee and provider validation.'
              }
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <DetailRow
                  label="Fee amount"
                  value={money(feeAmount)}
                />
                <DetailRow label="Payment status" value={edo.currentPaymentStatus ?? '—'} />
                <DetailRow label="Submitted" value={formatWhen(edo.paymentSubmittedAt)} />
                <DetailRow label="Validated" value={formatWhen(edo.paymentValidatedAt)} />
                <DetailRow label="Validated by" value={edo.paymentValidatedByName ?? '—'} />
                {edo.isRenewed && edo.renewedFromEdoNumber && (
                  <DetailRow label="Replaces expired" value={edo.renewedFromEdoNumber} />
                )}
              </Paper>
              {needsPayment && showPayNotice && isRenewedPreForecast && canSubmitPayment && (
                <Box mt={2}>
                  <Button
                    component={RouterLink}
                    to={edoPayToOpenPath(edo.id, paymentPageFrom)}
                    variant="contained"
                    color="warning"
                    sx={{ textTransform: 'none' }}
                  >
                    Open payment page
                  </Button>
                </Box>
              )}
              {needsPayment && showPayNotice && !canSubmitPayment && (
                <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
                  {edo.renewalPayorRole === 'Trucker' || edo.isRenewed
                    ? 'Only the trucker who submitted the pre-forecast can upload payment for this renewed document.'
                    : 'Only the manifest broker or consignee can submit payment for this document.'}
                </Alert>
              )}
              {needsPayment && canSubmitPayment && role !== 'Trucker' && !edo.isRenewed && (
                <Box mt={2}>
                  <Button
                    component={RouterLink}
                    to={`/manifests/${edo.manifestId}/edo-payment/${edo.id}`}
                    variant="contained"
                    color="warning"
                    sx={{ textTransform: 'none' }}
                  >
                    Open full payment form
                  </Button>
                </Box>
              )}
            </WorkflowSection>
          )}

          {tab === 'files' && (
            <WorkflowSection title="Files" subtitle="PDF and QR are available after release (or for platform admin).">
              {canRegeneratePdf && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Use <strong>Regenerate PDF</strong> to rebuild this document with the ICS CRO/eDO layout (navy
                  header, container table, embedded verification QR).
                </Alert>
              )}
              {regenerateMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRegenerateMessage(null)}>
                  {regenerateMessage}
                </Alert>
              )}
              {regenerateError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRegenerateError(null)}>
                  {regenerateError}
                </Alert>
              )}
              {edoDownloadBlockedMessage(edo.status, user?.role, edo.currentPaymentStatus) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {edoDownloadBlockedMessage(edo.status, user?.role, edo.currentPaymentStatus)}
                </Alert>
              )}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {canRegeneratePdf && (
                  <>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<AutorenewOutlinedIcon />}
                      disabled={regenerating}
                      onClick={() => void handleRegeneratePdf(false)}
                      sx={{ textTransform: 'none' }}
                    >
                      {regenerating ? 'Regenerating…' : 'Regenerate PDF'}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<PictureAsPdfOutlinedIcon />}
                      disabled={regenerating}
                      onClick={() => void handleRegeneratePdf(true)}
                      sx={{ textTransform: 'none' }}
                    >
                      Regenerate &amp; open
                    </Button>
                  </>
                )}
                {canDownload && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdfOutlinedIcon />}
                      onClick={() => void openDocument('download')}
                      sx={{ textTransform: 'none' }}
                    >
                      Download PDF
                    </Button>
                    {edo.qrImagePath && (
                      <Button
                        variant="outlined"
                        startIcon={<QrCode2OutlinedIcon />}
                        onClick={() => void openDocument('qr')}
                        sx={{ textTransform: 'none' }}
                      >
                        Download QR
                      </Button>
                    )}
                  </>
                )}
                {!canDownload && !needsPayment && (
                  <Typography variant="body2" color="text.secondary">
                    No files available for this document yet.
                  </Typography>
                )}
              </Stack>
            </WorkflowSection>
          )}

          {tab === 'activity' && (
            <WorkflowSection
              title="Activity trail"
              subtitle="Chronological log of generation, payments, document access, and release decisions."
            >
              <EdoActivityTimeline audit={audit} isLoading={auditLoading} />
            </WorkflowSection>
          )}
        </Box>
      </Paper>
    </WorkflowPage>
  );
}
