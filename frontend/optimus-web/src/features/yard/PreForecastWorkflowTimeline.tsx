import type { ReactNode } from 'react';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useTheme } from '@mui/material/styles';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import {
  getWorkflowStepState,
  preForecastRenewalPaymentSubmitted,
  WORKFLOW_STEPS,
  workflowProgressPercent,
  workflowStepIndex,
  type WorkflowStepState,
} from './preForecastStatus';

const STEP_ICONS: Record<string, ReactNode> = {
  PendingTerminalAssignment: <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />,
  PendingCySchedule: <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />,
  PendingAccountingReview: <AccountBalanceOutlinedIcon sx={{ fontSize: 18 }} />,
  AwaitingDetentionPayment: <PaymentsOutlinedIcon sx={{ fontSize: 18 }} />,
  PendingReview: <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />,
  AwaitingRenewalPayment: <PaymentsOutlinedIcon sx={{ fontSize: 18 }} />,
  Completed: <TaskAltOutlinedIcon sx={{ fontSize: 18 }} />,
};

function circleStyles(state: WorkflowStepState, primary: string) {
  switch (state) {
    case 'complete':
      return { bgcolor: 'success.main', color: 'success.contrastText', border: '2px solid', borderColor: 'success.main' };
    case 'current':
      return {
        bgcolor: primary,
        color: '#fff',
        border: '2px solid',
        borderColor: primary,
        boxShadow: `0 0 0 4px rgba(11,61,92,0.14)`,
      };
    case 'cancelled':
      return { bgcolor: 'error.main', color: 'error.contrastText', border: '2px solid', borderColor: 'error.main' };
    default:
      return { bgcolor: 'background.paper', color: 'text.disabled', border: '2px solid', borderColor: 'divider' };
  }
}

function connectorColor(state: WorkflowStepState) {
  if (state === 'complete') return 'success.main';
  if (state === 'current') return 'primary.main';
  return 'divider';
}

function stepMeta(submission: TruckerPreForecastSubmissionDto, stepKey: string, hideDetention: boolean): string | null {
  switch (stepKey) {
    case 'PendingTerminalAssignment':
      return submission.preferredTerminalName ? `Preference: ${submission.preferredTerminalName}` : null;
    case 'PendingCySchedule':
      if (submission.assignedTerminalName) {
        const slot = submission.assignedSlotDate ? ` · slot ${submission.assignedSlotDate.slice(0, 10)}` : '';
        const preferred = submission.truckerPreferredReturnDate?.slice(0, 10) ?? submission.returnDate.slice(0, 10);
        return `${submission.assignedTerminalName}${slot} · trucker wants ${preferred}`;
      }
      return null;
    case 'PendingAccountingReview':
    case 'AwaitingDetentionPayment':
      if (hideDetention) {
        if ((submission.scheduleDeltaDays ?? 0) > 0) {
          const preferred = submission.truckerPreferredReturnDate?.slice(0, 10) ?? '—';
          const confirmed = submission.cyConfirmedReturnDate?.slice(0, 10) ?? submission.returnDate.slice(0, 10);
          return `CY +${submission.scheduleDeltaDays}d (${preferred} → ${confirmed})`;
        }
        return null;
      }
      if ((submission.scheduleDeltaDays ?? 0) > 0) {
        const preferred = submission.truckerPreferredReturnDate?.slice(0, 10) ?? '—';
        const confirmed = submission.cyConfirmedReturnDate?.slice(0, 10) ?? submission.returnDate.slice(0, 10);
        return `CY +${submission.scheduleDeltaDays}d (${preferred} → ${confirmed}) · extra ₱${(submission.extraDaysDetentionAmount ?? 0).toLocaleString()}`;
      }
      if (submission.detentionAmount > 0) return `₱${submission.detentionAmount.toLocaleString()} · ${submission.overdueDays} overdue days`;
      if (submission.overdueDays > 0) return `${submission.overdueDays} overdue days`;
      return submission.awaitingDetentionPayment ? 'Payment required' : null;
    case 'PendingReview':
      return submission.renewalRequestId ? 'Renewal queued' : null;
    case 'AwaitingRenewalPayment':
      if (preForecastRenewalPaymentSubmitted(submission)) {
        return submission.newEdoNumber ? `${submission.newEdoNumber} · receipt submitted` : 'Receipt submitted';
      }
      return submission.newEdoNumber ?? null;
    case 'Completed':
      return submission.newEdoNumber ?? null;
    default:
      return null;
  }
}

type Props = {
  submission: TruckerPreForecastSubmissionDto;
  hideDetention?: boolean;
};

export function PreForecastWorkflowTimeline({ submission, hideDetention = false }: Props) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const renewalPaymentSubmitted = preForecastRenewalPaymentSubmitted(submission);
  const progress = workflowProgressPercent(submission.status, { renewalPaymentSubmitted });
  const currentIdx = WORKFLOW_STEPS.findIndex((_, idx) => getWorkflowStepState(submission.status, idx) === 'current');
  const activeStep = currentIdx >= 0 ? currentIdx : workflowStepIndex(submission.status);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
          <Typography variant="body2" fontWeight={700}>
            Overall progress
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {submission.status === 'Completed' ? 'Complete' : `Step ${activeStep + 1} of ${WORKFLOW_STEPS.length}`}
            {' · '}
            {progress}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 99,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { borderRadius: 99 },
          }}
        />
      </Box>

      <Stack spacing={0}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const state = getWorkflowStepState(submission.status, idx);
          const meta = stepMeta(submission, step.key, hideDetention);
          const isLast = idx === WORKFLOW_STEPS.length - 1;
          const renewalPaymentStep =
            step.key === 'AwaitingRenewalPayment' && state === 'current' && renewalPaymentSubmitted;
          const stepDetail =
            renewalPaymentStep
              ? 'Your eDO access fee receipt was submitted. Accounting validates before the renewed CRO/eDO can be opened.'
              : step.detail;

          return (
            <Stack key={step.key} direction="row" spacing={2} alignItems="stretch">
              <Stack alignItems="center" sx={{ width: 40, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    transition: 'all 180ms ease',
                    ...circleStyles(state, primary),
                  }}
                >
                  {state === 'complete' ? (
                    <CheckCircleIcon sx={{ fontSize: 20 }} />
                  ) : state === 'cancelled' ? (
                    <CancelOutlinedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    STEP_ICONS[step.key]
                  )}
                </Box>
                {!isLast && (
                  <Box
                    sx={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      my: 0.5,
                      bgcolor: connectorColor(state === 'complete' ? 'complete' : state === 'current' ? 'current' : 'upcoming'),
                      opacity: state === 'upcoming' ? 0.45 : 1,
                      borderRadius: 1,
                    }}
                  />
                )}
              </Stack>

              <Box
                pb={isLast ? 0 : 2.5}
                flex={1}
                minWidth={0}
                sx={
                  state === 'current'
                    ? {
                        px: 2,
                        py: 1.5,
                        mb: 0.5,
                        borderRadius: 2,
                        bgcolor: (t) => `${t.palette.primary.main}0A`,
                        border: 1,
                        borderColor: (t) => `${t.palette.primary.main}33`,
                      }
                    : undefined
                }
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mb={0.35}>
                  <Typography
                    variant="body2"
                    fontWeight={state === 'current' || state === 'complete' ? 700 : 600}
                    color={state === 'upcoming' ? 'text.secondary' : 'text.primary'}
                  >
                    {step.label}
                  </Typography>
                  {state === 'current' && renewalPaymentStep && (
                    <Chip size="small" label="Awaiting validation" color="info" sx={{ height: 22, fontWeight: 700 }} />
                  )}
                  {state === 'current' && !renewalPaymentStep && (
                    <Chip size="small" label="In progress" color="primary" sx={{ height: 22, fontWeight: 700 }} />
                  )}
                  {state === 'complete' && idx < WORKFLOW_STEPS.length - 1 && (
                    <Chip size="small" label="Done" color="success" variant="outlined" sx={{ height: 22 }} />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.45} mb={meta ? 0.75 : 0}>
                  {stepDetail}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" variant="outlined" label={step.actor} sx={{ height: 22, fontSize: '0.7rem' }} />
                  {meta && (
                    <Chip
                      size="small"
                      label={meta}
                      color={renewalPaymentStep || state === 'current' ? 'primary' : 'default'}
                      variant={renewalPaymentStep ? 'outlined' : state === 'current' ? 'filled' : 'outlined'}
                      sx={{ height: 22, maxWidth: '100%' }}
                    />
                  )}
                </Stack>
                {step.key === 'PendingTerminalAssignment' && submission.terminalNotes && state !== 'upcoming' && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                    Note: {submission.terminalNotes}
                  </Typography>
                )}
                {step.key === 'PendingCySchedule' && submission.cyNotes && state !== 'upcoming' && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                    Note: {submission.cyNotes}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
