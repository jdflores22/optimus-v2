import { useMemo } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { Link as RouterLink } from 'react-router-dom';
import {
  useGetContainersQuery,
  useGetCyAllocationsQuery,
  useGetShippingLinesQuery,
  useGetTerminalsQuery,
  useGetTruckerIntakeSubmissionsQuery,
  useGetUtilizationQuery,
} from '../../app/api';
import { ContractTeuLocationCard } from './ContractTeuLocationCard';
import { CyDailyBookingSummary } from './CyDailyBookingSummary';
import { buildContractAvailabilityCards } from '../yard/contractAvailabilityCards';
import { cyIntakeCountsByTerminal } from '../yard/cyIntakeCounts';
import { preForecastDetailPath } from '../yard/preForecastPaths';
import { preForecastStatusColor, preForecastStatusLabel } from '../yard/preForecastStatus';
import { WorkflowSection } from '../shared/WorkflowPage';

type Props = {
  userId: string;
}

export function CyStaffDashboardSection({ userId }: Props) {
  const { data: intake = [] } = useGetTruckerIntakeSubmissionsQuery(undefined, { pollingInterval: 30_000 });
  const { data: allocations = [] } = useGetCyAllocationsQuery({
    containerYardsOnly: true,
    activeTerminalsOnly: true,
  });
  const { data: shippingLines = [] } = useGetShippingLinesQuery();
  const { data: terminals = [] } = useGetTerminalsQuery({ activeOnly: true });
  const { data: containers = [] } = useGetContainersQuery(undefined);
  const { data: utilization = [] } = useGetUtilizationQuery({ terminalIdentity: 'ContainerYard' });

  const myAllocations = useMemo(
    () => allocations.filter((a) => a.staffUserId === userId),
    [allocations, userId],
  );

  const assignedTerminalIds = useMemo(
    () => new Set(myAllocations.map((a) => a.terminalId)),
    [myAllocations],
  );

  const scopedIntake = useMemo(
    () =>
      intake.filter(
        (s) => !s.assignedTerminalId || assignedTerminalIds.has(s.assignedTerminalId),
      ),
    [intake, assignedTerminalIds],
  );

  const allocationCards = useMemo(
    () =>
      buildContractAvailabilityCards(myAllocations, terminals, containers, utilization, 'cy', {
        focus: 'shippingLine',
        shippingLines,
      }),
    [myAllocations, terminals, containers, utilization, shippingLines],
  );

  const intakeByTerminal = useMemo(() => cyIntakeCountsByTerminal(scopedIntake), [scopedIntake]);

  const pendingConfirm = useMemo(
    () =>
      scopedIntake.filter(
        (s) =>
          s.status === 'PendingCySchedule' &&
          s.assignedTerminalId &&
          assignedTerminalIds.has(s.assignedTerminalId),
      ),
    [scopedIntake, assignedTerminalIds],
  );

  const inProgress = useMemo(
    () => scopedIntake.filter((s) => !['Completed', 'Cancelled'].includes(s.status)),
    [scopedIntake],
  );

  return (
    <>
      <WorkflowSection
        title="Terminal-assigned pre-forecasts"
        subtitle="Empty returns assigned to your depot by the shipping line terminal team — confirm your free day for each trucker request."
        actions={
          pendingConfirm.length > 0 ? (
            <Button component={RouterLink} to="/pre-forecast" variant="contained" size="small">
              Open pre-forecast queue
            </Button>
          ) : undefined
        }
      >
        {pendingConfirm.length === 0 ? (
          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
            <Typography fontWeight={700} gutterBottom>
              No schedules awaiting confirmation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              When terminal assigns a trucker empty return to your yard, it will appear here for date confirmation.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {pendingConfirm.map((row) => (
              <Paper
                key={row.id}
                component={RouterLink}
                to={preForecastDetailPath(row.id)}
                elevation={0}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  transition: 'border-color 120ms ease, box-shadow 120ms ease',
                  '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                  <Box minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mb={0.5}>
                      <Typography fontWeight={800}>{row.containerNumber}</Typography>
                      <Chip
                        size="small"
                        label={preForecastStatusLabel(row.status)}
                        color={preForecastStatusColor(row.status)}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {row.expiredEdoNumber} · Assigned to {row.assignedTerminalName ?? 'your depot'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                      Trucker preferred return: <strong>{row.returnDate.slice(0, 10)}</strong>
                      {row.preferredTerminalName ? ` · pref. ${row.preferredTerminalName}` : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      Confirm date
                    </Typography>
                    <ChevronRightOutlinedIcon color="primary" />
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </WorkflowSection>

      <CyDailyBookingSummary
        intake={scopedIntake}
        shippingLines={shippingLines}
        containers={containers}
      />

      {allocationCards.length > 0 && (
        <WorkflowSection
          title="Shipping line allocation"
          subtitle="Contract TEU the shipping line has allocated to your depot and current intake pressure."
        >
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' } }}>
            {allocationCards.map((card) => {
              const counts = intakeByTerminal.get(card.terminalId) ?? {
                preForecast: 0,
                confirmed: 0,
                preForecast20: 0,
                preForecast40: 0,
                confirmed20: 0,
                confirmed40: 0,
              };
              return (
                <ContractTeuLocationCard
                  key={card.allocationId}
                  {...card}
                  intakePreForecast20={counts.preForecast20}
                  intakePreForecast40={counts.preForecast40}
                  intakeConfirmed20={counts.confirmed20}
                  intakeConfirmed40={counts.confirmed40}
                  footerAction={
                    counts.preForecast > 0
                      ? { label: `${counts.preForecast} pre-forecast to confirm`, to: '/pre-forecast' }
                      : counts.confirmed > 0
                        ? { label: `${counts.confirmed} confirmed · view intake`, to: '/pre-forecast?tab=submissions' }
                        : { label: 'View pre-forecast', to: '/pre-forecast' }
                  }
                />
              );
            })}
          </Box>
        </WorkflowSection>
      )}

      {allocationCards.length === 0 && inProgress.length > 0 && (
        <WorkflowSection title="Activity summary" subtitle="Pre-forecast intake linked to your yard.">
          <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <WarehouseOutlinedIcon color="primary" />
              <Box>
                <Typography fontWeight={700}>{inProgress.length} submission(s) in progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  {pendingConfirm.length} awaiting your return-date confirmation
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </WorkflowSection>
      )}
    </>
  );
}
