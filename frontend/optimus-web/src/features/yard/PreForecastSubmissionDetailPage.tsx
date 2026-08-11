import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { useSelector } from 'react-redux';
import {
  useGetTruckerIntakeSubmissionQuery,
} from '../../app/api';
import type { RootState } from '../../app/store';
import { API_BASE_URL } from '../../shared/types';
import { WorkflowPage, WorkflowSection, type WorkflowStat } from '../shared/WorkflowPage';
import { PreForecastWorkflowTimeline } from './PreForecastWorkflowTimeline';
import { CyScheduleConfirmPanel } from './CyScheduleConfirmPanel';
import { PreForecastSlStaffRenewalPanel } from './PreForecastSlStaffRenewalPanel';
import { preForecastBillingPath } from './preForecastPaths';
import {
  preForecastDisplayStatus,
  preForecastDisplayStatusColor,
  preForecastRenewalPaymentSubmitted,
  preForecastStatusColor,
  isScheduleDeltaPendingAccountingDecision,
  workflowProgressPercent,
} from './preForecastStatus';
import {
  truckerNeedsRenewalEdoPayment,
  truckerRenewalEdoPaymentRejected,
} from './truckerEdoPayments';
import { canViewPreForecastDetention, canViewPreForecastTruckerWorkflow, cyDepotStatusHint, cyDepotStatusLabel } from './preForecastRoleAccess';
import { RenewedEdoBadge } from '../edo/RenewedEdoBadge';

function assetUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="baseline">
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

export function PreForecastSubmissionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';

  const shouldPoll =
    role === 'Trucker' &&
    Boolean(id);

  const { data: submission, isLoading, isError, refetch } = useGetTruckerIntakeSubmissionQuery(id, {
    skip: !id,
    pollingInterval: shouldPoll ? 30_000 : 0,
  });

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const isTerminalOps = ['TerminalTeam', 'ShippingLinesAdmin'].includes(role);
  const isSlStaff = role === 'SlStaff';
  const isCy = role === 'CyStaff';
  const isAccounting = role === 'Accounting';
  const isTrucker = role === 'Trucker';
  const showDetention = canViewPreForecastDetention(role);

  const showTruckerWorkflow = canViewPreForecastTruckerWorkflow(role);

  const showAssign = isTerminalOps && submission?.status === 'PendingTerminalAssignment';
  const showSlStaffRenewal =
    isSlStaff && (submission?.status === 'PendingReview' || submission?.status === 'AwaitingRenewalPayment');
  const showCyConfirm = isCy && submission?.status === 'PendingCySchedule';
  const showAcct = isAccounting && submission?.status === 'PendingAccountingReview';

  const truckerPreferred = submission?.truckerPreferredReturnDate?.slice(0, 10) ?? submission?.returnDate.slice(0, 10);
  const cyConfirmed = submission?.cyConfirmedReturnDate?.slice(0, 10);
  const hasScheduleDelta = (submission?.scheduleDeltaDays ?? 0) > 0;

  if (!id) {
    return <Alert severity="error">Missing submission id.</Alert>;
  }

  if (isLoading) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" minHeight={320} py={6}>
        <CircularProgress size={44} />
        <Typography color="text.secondary" fontWeight={600}>
          Loading pre-forecast submission…
        </Typography>
        <Box width="100%" maxWidth={960}>
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', xl: '1fr 1fr' }} gap={2.5}>
            <Skeleton variant="rounded" height={360} />
            <Skeleton variant="rounded" height={280} />
          </Box>
        </Box>
      </Stack>
    );
  }

  if (isError || !submission) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Could not load this submission.</Alert>
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(isCy ? '/pre-forecast' : '/pre-forecast?tab=submissions')}>
          {isCy ? 'Back to pre-forecast' : 'All submissions'}
        </Button>
      </Stack>
    );
  }

  const progress = showTruckerWorkflow
    ? workflowProgressPercent(submission.status, {
        renewalPaymentSubmitted: preForecastRenewalPaymentSubmitted(submission),
      })
    : 0;
  const renewalPaymentSubmitted = preForecastRenewalPaymentSubmitted(submission);
  const renewalPaymentDue = truckerNeedsRenewalEdoPayment(submission);
  const renewalPaymentRejected = truckerRenewalEdoPaymentRejected(submission);
  const flashMessage =
    location.state && typeof location.state === 'object' && 'flash' in location.state
      ? String((location.state as { flash?: string }).flash ?? '')
      : '';
  const cyDepotConfirmed = Boolean(submission.cyConfirmedReturnDate);
  const cyLabel =
    submission.assignedTerminalName ??
    submission.preferredTerminalName ??
    (isTrucker ? 'Awaiting assignment' : '—');

  const stats: WorkflowStat[] = [
    {
      label: 'Return date',
      value: cyConfirmed ?? truckerPreferred ?? submission.returnDate.slice(0, 10),
      hint: hasScheduleDelta
        ? isCy
          ? `Trucker wanted ${truckerPreferred}`
          : `Trucker preferred ${truckerPreferred} · CY +${submission.scheduleDeltaDays}d`
        : submission.cyConfirmedReturnDate
          ? `CY confirmed ${cyConfirmed}`
          : 'Requested empty return',
      tone: hasScheduleDelta ? 'warning' : 'primary',
    },
    {
      label: 'Container yard',
      value: cyLabel,
      hint: submission.preferredTerminalName && !submission.assignedTerminalName ? 'Trucker preference' : 'Assignment',
      tone: submission.assignedTerminalName ? 'success' : 'warning',
    },
    ...(showDetention
      ? [
          {
            label: 'Detention',
            value:
              submission.detentionAmount > 0
                ? `₱${submission.detentionAmount.toLocaleString()}`
                : submission.awaitingDetentionPayment
                  ? 'Pending'
                  : 'None',
            hint: submission.overdueDays > 0 ? `${submission.overdueDays} overdue days` : 'Billing status',
            tone: (submission.detentionAmount > 0 ? 'warning' : 'default') as WorkflowStat['tone'],
          },
        ]
      : []),
    ...(isCy
      ? [
          {
            label: 'Depot status',
            value: cyDepotStatusLabel(submission.status, showCyConfirm, cyDepotConfirmed),
            hint: cyDepotStatusHint(submission.status, cyDepotConfirmed),
            tone: (showCyConfirm ? 'warning' : cyDepotConfirmed ? 'success' : 'info') as WorkflowStat['tone'],
          },
        ]
      : [
          {
            label: 'Progress',
            value: `${progress}%`,
            hint: preForecastDisplayStatus(submission),
            tone: (submission.status === 'Completed' ? 'success' : 'info') as WorkflowStat['tone'],
          },
        ]),
  ];

  return (
    <WorkflowPage
      eyebrow="Pre-forecast intake"
      title={submission.containerNumber}
      subtitle={submission.expiredEdoNumber}
      chips={
        <>
          <Chip
            size="small"
            label={
              isCy
                ? cyDepotStatusLabel(submission.status, showCyConfirm, cyDepotConfirmed)
                : preForecastDisplayStatus(submission)
            }
            color={
              isCy
                ? preForecastStatusColor(submission.status)
                : preForecastDisplayStatusColor(submission)
            }
            variant="filled"
            sx={{ fontWeight: 700 }}
          />
          {submission.newEdoId && <RenewedEdoBadge variant="outlined" />}
        </>
      }
      actions={
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate(isCy ? '/pre-forecast' : '/pre-forecast?tab=submissions')}
          size="small"
          variant="outlined"
        >
          {isCy ? 'Pre-forecast queue' : 'All submissions'}
        </Button>
      }
      stats={stats}
    >
      {actionMessage && (
        <Alert severity="success" onClose={() => setActionMessage(null)}>
          {actionMessage}
        </Alert>
      )}

      {flashMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {flashMessage}
        </Alert>
      )}

      {renewalPaymentSubmitted && (
        <Alert severity="info" sx={{ mb: 2 }}>
          eDO payment receipt submitted. Accounting is validating your pay-to-open fee — the renewed CRO/eDO unlocks
          after verification.
        </Alert>
      )}

      {showCyConfirm && (
        <CyScheduleConfirmPanel
          submission={submission}
          onConfirmed={() => {
            refetch();
          }}
          onBackToQueue={() => navigate('/pre-forecast')}
        />
      )}

      {showSlStaffRenewal && (
        <PreForecastSlStaffRenewalPanel
          submission={submission}
          onUpdated={() => {
            void refetch();
          }}
        />
      )}

      {hasScheduleDelta &&
        !showCyConfirm &&
        showDetention &&
        isScheduleDeltaPendingAccountingDecision(submission.status) && (
        <Alert severity="warning" variant="outlined">
          CY confirmed <strong>{cyConfirmed}</strong> — {submission.scheduleDeltaDays} day
          {submission.scheduleDeltaDays === 1 ? '' : 's'} after trucker preferred <strong>{truckerPreferred}</strong>.
          Extra detention ₱{submission.extraDaysDetentionAmount?.toLocaleString() ?? '0'}
          {submission.extraDaysWaived ? ' (waived by accounting)' : ' — pending accounting waiver decision.'}
        </Alert>
      )}

      {hasScheduleDelta && !showCyConfirm && isCy && (
        <Alert severity="success" variant="outlined">
          You confirmed <strong>{cyConfirmed}</strong> — {submission.scheduleDeltaDays} day
          {submission.scheduleDeltaDays === 1 ? '' : 's'} after the trucker&apos;s preferred{' '}
          <strong>{truckerPreferred}</strong>. The trucker and shipping line have been notified.
        </Alert>
      )}

      {submission.message && !showCyConfirm && showTruckerWorkflow && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            bgcolor: (theme) =>
              submission.status === 'Completed'
                ? `${theme.palette.success.main}12`
                : `${theme.palette.primary.main}08`,
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            {submission.message}
          </Typography>
        </Paper>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 3fr) minmax(300px, 2fr)' },
          alignItems: 'start',
        }}
      >
        <Stack spacing={2.5}>
          {showTruckerWorkflow && (
            <WorkflowSection
              title="Workflow progress"
              subtitle="Track each handoff from terminal CY assignment through renewed CRO/eDO."
            >
              <PreForecastWorkflowTimeline submission={submission} hideDetention={!showDetention} />
            </WorkflowSection>
          )}

          {isCy && cyDepotConfirmed && !showCyConfirm && (
            <WorkflowSection
              title="Your depot"
              subtitle="Empty return schedule for your container yard — renewal continues with the shipping line."
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={700} gutterBottom>
                  Confirmed return: {cyConfirmed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trucker preferred {truckerPreferred}
                  {hasScheduleDelta ? ` · you moved the date +${submission.scheduleDeltaDays} day${submission.scheduleDeltaDays === 1 ? '' : 's'}` : ''}.
                  {submission.shippingLineBrandName ? ` ${submission.shippingLineBrandName} handles billing and renewed CRO/eDO from here.` : ' The shipping line handles billing and renewed CRO/eDO from here.'}
                </Typography>
              </Paper>
            </WorkflowSection>
          )}

          {submission.photos.length > 0 && (
            <WorkflowSection
              title="Container identity photos"
              subtitle={`${submission.photos.length} verified views attached to this intake.`}
            >
              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }}
                gap={1.5}
              >
                {submission.photos.map((photo) => (
                  <Box
                    key={photo.id}
                    component="a"
                    href={assetUrl(photo.filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={assetUrl(photo.filePath)}
                      alt={photo.label}
                      sx={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', bgcolor: '#0a1628' }}
                    />
                    <Stack direction="row" alignItems="center" justifyContent="space-between" px={1.25} py={1}>
                      <Typography variant="caption" fontWeight={700}>
                        {photo.label}
                      </Typography>
                      <OpenInNewOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    </Stack>
                  </Box>
                ))}
              </Box>
            </WorkflowSection>
          )}
        </Stack>

        <Stack spacing={2}>
          {(showAssign || showCyConfirm || showAcct || showSlStaffRenewal) && (
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                borderRadius: 2,
                border: 1,
                borderColor: 'primary.main',
                bgcolor: (theme) => `${theme.palette.primary.main}08`,
              }}
            >
              <Typography fontWeight={800} mb={0.5}>
                Your action required
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {showSlStaffRenewal
                  ? 'Accounting cleared detention — generate the renewed CRO/eDO for this expired release.'
                  : 'This submission is waiting on your role to move to the next step.'}
              </Typography>
              {showAssign && (
                <Button
                  component={RouterLink}
                  to={`/pre-forecast/submissions/${submission.id}/review`}
                  variant="contained"
                  fullWidth
                >
                  Review & assign CY
                </Button>
              )}
              {showCyConfirm && (
                <Button variant="outlined" fullWidth onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Confirm return date above
                </Button>
              )}
              {showAcct && (
                <Button
                  component={RouterLink}
                  to={preForecastBillingPath(submission.id)}
                  variant="contained"
                  fullWidth
                >
                  Review detention billing
                </Button>
              )}
              {showSlStaffRenewal && submission.status === 'PendingReview' && (
                <Typography variant="body2" color="text.secondary">
                  Use the generate panel above to approve (if needed) and issue the new CRO/eDO.
                </Typography>
              )}
            </Paper>
          )}

          <Paper elevation={0} sx={{ p: 2.25, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Typography fontWeight={800} mb={1.5}>
              At a glance
            </Typography>
            <Stack spacing={1.25}>
              <SidebarRow label="Container" value={submission.containerNumber} />
              <SidebarRow label="Expired CRO/eDO" value={submission.expiredEdoNumber} />
              <SidebarRow label="Return date" value={cyConfirmed ?? truckerPreferred ?? submission.returnDate.slice(0, 10)} />
              {truckerPreferred && cyConfirmed && hasScheduleDelta && (
                <SidebarRow label="Trucker preferred" value={truckerPreferred} />
              )}
              <SidebarRow label="Preferred CY" value={submission.preferredTerminalName ?? (isTrucker ? 'No preference' : '—')} />
              <SidebarRow label="Assigned CY" value={submission.assignedTerminalName ?? '—'} />
              {submission.assignedSlotDate && (
                <SidebarRow label="Slot date" value={submission.assignedSlotDate.slice(0, 10)} />
              )}
              {submission.cyConfirmedReturnDate && (
                <SidebarRow label="CY confirmed" value={submission.cyConfirmedReturnDate.slice(0, 10)} />
              )}
              {submission.truckerName && <SidebarRow label="Trucker" value={submission.truckerName} />}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.25, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Typography fontWeight={800} mb={1.5}>
              {showDetention ? 'Documents & billing' : 'Documents'}
            </Typography>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptLongOutlinedIcon fontSize="small" color="action" />
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Original CRO/eDO
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {submission.expiredEdoNumber}
                  </Typography>
                </Box>
              </Stack>
              {showDetention && (
                <>
                  <Divider />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarTodayOutlinedIcon fontSize="small" color="action" />
                    <Box minWidth={0}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Detention
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {submission.detentionAmount > 0
                          ? `₱${submission.detentionAmount.toLocaleString()}`
                          : submission.awaitingDetentionPayment
                            ? 'Awaiting payment'
                            : 'Not applicable'}
                      </Typography>
                    </Box>
                  </Stack>
                </>
              )}
              {submission.newEdoId && (
                <>
                  <Divider />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Inventory2OutlinedIcon fontSize="small" color="action" />
                    <Box minWidth={0} flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Renewed CRO/eDO
                        </Typography>
                        <RenewedEdoBadge variant="outlined" />
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {submission.newEdoNumber ?? 'Available'}
                      </Typography>
                      {submission.expiredEdoNumber && (
                        <Typography variant="caption" color="text.secondary">
                          Replaces {submission.expiredEdoNumber}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  {renewalPaymentDue && (
                    <Button
                      component={RouterLink}
                      to={`/edo/${submission.newEdoId}/payment?from=pre-forecast`}
                      variant="contained"
                      color={renewalPaymentRejected ? 'error' : 'warning'}
                      fullWidth
                      endIcon={<OpenInNewOutlinedIcon />}
                    >
                      {renewalPaymentRejected ? 'Resubmit eDO payment' : 'Pay to open renewed CRO/eDO'}
                    </Button>
                  )}
                  {!renewalPaymentDue && (
                    <Button
                      component={RouterLink}
                      to={
                        submission.status === 'Completed'
                          ? `/edo/${submission.newEdoId}?from=pre-forecast&tab=files`
                          : `/edo/${submission.newEdoId}?from=pre-forecast`
                      }
                      variant={renewalPaymentSubmitted || submission.status === 'Completed' ? 'contained' : 'outlined'}
                      color={submission.status === 'Completed' ? 'success' : 'primary'}
                      fullWidth
                      endIcon={<OpenInNewOutlinedIcon />}
                    >
                      {submission.status === 'Completed'
                        ? 'Download renewed CRO/eDO'
                        : renewalPaymentSubmitted
                          ? 'View renewed release'
                          : 'Open renewed release'}
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Paper>

          {(submission.preferredTerminalName || submission.assignedTerminalName) && (
            <Paper elevation={0} sx={{ p: 2.25, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <StorefrontOutlinedIcon fontSize="small" color="primary" />
                <Typography fontWeight={800}>Container yard</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={600} mb={0.5}>
                {submission.assignedTerminalName ?? submission.preferredTerminalName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {submission.assignedTerminalName
                  ? 'Terminal-assigned yard for this empty return.'
                  : 'Trucker preference — terminal will confirm or override.'}
              </Typography>
            </Paper>
          )}

          {isTrucker && (
            <Button component={RouterLink} to="/pre-forecast" variant="outlined" fullWidth>
              Submit another pre-forecast
            </Button>
          )}
        </Stack>
      </Box>

    </WorkflowPage>
  );
}
