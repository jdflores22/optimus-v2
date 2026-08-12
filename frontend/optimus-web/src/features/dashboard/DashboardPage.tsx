import { useMemo, type ReactNode } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import DirectionsBoatOutlinedIcon from '@mui/icons-material/DirectionsBoatOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import {
  useGetAccreditationsQuery,
  useGetContainersQuery,
  useGetCyAllocationsQuery,
  useGetEdoReleaseQueueQuery,
  useGetEdosQuery,
  useGetManifestsQuery,
  useGetNotificationsQuery,
  useGetPendingEdoPaymentsQuery,
  useGetPendingPaymentsQuery,
  useGetPreForecastsQuery,
  useGetRepositioningQuery,
  useGetShippingAdminBrokersQuery,
  useGetShippingAdminConsigneesQuery,
  useGetTerminalsQuery,
  useGetTruckerIntakeSubmissionsQuery,
  useGetUtilizationQuery,
} from '../../app/api';
import { getQuickActions } from '../layout/navConfig';
import { ContractTeuLocationCard } from './ContractTeuLocationCard';
import { CyStaffDashboardSection } from './CyStaffDashboardSection';
import { cyIntakeCountsByTerminal } from '../yard/cyIntakeCounts';
import { preForecastActionQueueCount } from '../yard/preForecastIntakeFilters';
import { isContainerYardTerminal, isPortTerminal } from '../../shared/terminalTaxonomy';
import { formatTerminalAddressSummary } from '../../shared/terminalAddressHelpers';
import { computeContractTeu } from '../../shared/teuUtils';
import { useDefaultShippingLine } from '../../shared/useDefaultShippingLine';
import { WorkflowPage, WorkflowSection, type WorkflowStat } from '../shared/WorkflowPage';

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

type QueueItem = {
  label: string;
  value: string | number;
  hint: string;
  to: string;
};

export function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';
  const quickActions = getQuickActions(role);

  const isStaff = ['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff'].includes(role);
  const isShippingAdmin = role === 'ShippingLinesAdmin';
  const isLocationDashboard = role === 'SlStaff' || isShippingAdmin;
  const isAccounting = role === 'Accounting' || role === 'SystemAdmin';
  const isRelease = ['SlStaff', 'ShippingLinesAdmin', 'TerminalTeam'].includes(role);
  const isEdoPaymentAdmin = role === 'SystemAdmin' || role === 'Accounting';
  const isCargo = role === 'SystemAdmin' || isStaff || isAccounting;
  const isCyStaff = role === 'CyStaff';
  const isTerminal = role === 'TerminalTeam' || role === 'SystemAdmin';
  const isTrucker = role === 'Trucker' || role === 'SystemAdmin';
  const isEvaluator = role === 'Evaluator' || role === 'SystemAdmin' || isShippingAdmin;

  const { data: notifications = [] } = useGetNotificationsQuery();
  const unread = useMemo(() => notifications.filter((n) => !n.isRead), [notifications]);

  const { data: manifests = [], refetch: refetchManifests } = useGetManifestsQuery(undefined, {
    skip: !isCargo,
  });
  const { data: edos = [], refetch: refetchEdos } = useGetEdosQuery(undefined, {
    skip: !isStaff && !isCargo,
  });
  const { data: releaseQueue, refetch: refetchReleaseQueue } = useGetEdoReleaseQueueQuery(undefined, {
    skip: !isRelease,
  });
  const { data: pendingPayments = [] } = useGetPendingPaymentsQuery(undefined, { skip: !isAccounting });
  const { data: pendingEdoPayments = [] } = useGetPendingEdoPaymentsQuery(undefined, {
    skip: !isEdoPaymentAdmin,
  });
  const { data: preForecasts = [], refetch: refetchPreForecasts } = useGetPreForecastsQuery(undefined, {
    skip: role !== 'ShippingLinesAdmin',
  });
  const { data: accreditations = [] } = useGetAccreditationsQuery(undefined, {
    skip: !isEvaluator,
  });
  const { data: shippingAdminConsignees = [] } = useGetShippingAdminConsigneesQuery(undefined, {
    skip: !isShippingAdmin,
  });
  const { data: shippingAdminBrokers = [] } = useGetShippingAdminBrokersQuery(undefined, {
    skip: !isShippingAdmin,
  });
  const { shippingLineId } = useDefaultShippingLine();
  const { data: terminals = [], refetch: refetchTerminals } = useGetTerminalsQuery(undefined, {
    skip: !isLocationDashboard,
  });
  const { data: contractAllocations = [], refetch: refetchAllocations } = useGetCyAllocationsQuery(
    shippingLineId
      ? { shippingLineId, containerYardsOnly: false, activeTerminalsOnly: true }
      : undefined,
    { skip: !isLocationDashboard || !shippingLineId },
  );
  const { data: containers = [], refetch: refetchContainers } = useGetContainersQuery(undefined, {
    skip: !isLocationDashboard,
  });
  const { data: utilization = [], refetch: refetchUtilization } = useGetUtilizationQuery(
    shippingLineId ? { shippingLineId } : undefined,
    { skip: !isLocationDashboard || !shippingLineId },
  );
  const { data: repositioning = [], refetch: refetchRepositioning } = useGetRepositioningQuery(undefined, {
    skip: !isLocationDashboard,
  });
  const { data: truckerIntake = [], refetch: refetchTruckerIntake } = useGetTruckerIntakeSubmissionsQuery(undefined, {
    skip: !(isLocationDashboard || isTerminal || isTrucker || isAccounting),
    pollingInterval: isLocationDashboard || isTerminal ? 60_000 : 0,
  });

  const { data: cyIntake = [] } = useGetTruckerIntakeSubmissionsQuery(undefined, {
    skip: !isCyStaff,
    pollingInterval: isCyStaff ? 30_000 : 0,
  });
  const cyPendingSchedule = useMemo(
    () => cyIntake.filter((s) => s.status === 'PendingCySchedule').length,
    [cyIntake],
  );

  const stats: WorkflowStat[] = [];
  if (isCargo) {
    stats.push({ label: 'Manifests', value: manifests.length, hint: 'Cargo workflow load', tone: 'primary' });
  }
  if (isStaff || isCargo) {
    stats.push({ label: 'eDO / CRO', value: edos.length, hint: 'Document issuance queue', tone: 'info' });
  }
  if (isRelease) {
    stats.push({
      label: 'Ready to release',
      value: releaseQueue?.readyToRelease ?? 0,
      hint: 'Verified eDOs',
      tone: 'success',
    });
  }
  if (isEdoPaymentAdmin) {
    stats.push({
      label: 'eDO payments',
      value: pendingEdoPayments.length,
      hint: 'Awaiting validation',
      tone: 'warning',
    });
  }
  if (isAccounting) {
    stats.push({ label: 'Pending payments', value: pendingPayments.length, hint: 'Awaiting validation', tone: 'warning' });
  }
  if (isTerminal || isTrucker || isStaff || isAccounting) {
    stats.push({
      label: 'Pre-forecast',
      value: preForecastActionQueueCount(truckerIntake, role),
      hint: 'Terminal handoff queue',
      tone: 'info',
    });
  }
  if (isEvaluator) {
    const pendingSas = accreditations.filter((a) =>
      /pending|submitted|evaluator/i.test(a.status ?? ''),
    );
    stats.push({
      label: 'SAS in review',
      value: pendingSas.length || accreditations.length,
      hint: 'Applications needing review',
      tone: 'warning',
    });
  }
  if (isCyStaff) {
    stats.push({
      label: 'Confirm return date',
      value: cyPendingSchedule,
      hint: 'Terminal assigned pre-forecasts',
      tone: cyPendingSchedule ? 'warning' : 'success',
    });
    stats.push({
      label: 'Intake in progress',
      value: cyIntake.filter((s) => !['Completed', 'Cancelled'].includes(s.status)).length,
      hint: 'At your depot',
      tone: 'info',
    });
  }
  stats.push({ label: 'Unread alerts', value: unread.length, hint: 'Operational notifications', tone: unread.length ? 'error' : 'success' });

  const uniqueStats: WorkflowStat[] = stats.filter(
    (s, i, arr) => arr.findIndex((x) => x.label === s.label) === i,
  );

  const roleSummary = {
    ShippingLinesAdmin: {
      eyebrow: 'Shipping oversight',
      subtitle: 'Track cargo flow, approvals, brand operations, and release pressure across your shipping line.',
      focus: [
        { label: 'Accreditations', value: accreditations.length, hint: 'Evaluator + final approval pipeline', to: '/sas' },
        { label: 'Release queue', value: releaseQueue?.readyToRelease ?? 0, hint: 'eDOs ready after admin validation', to: '/edo/release' },
        { label: 'Inventory', value: preForecasts.length, hint: 'Terminal requests and yard pressure', to: '/container-inventory' },
      ],
    },
    SlStaff: {
      eyebrow: 'Execution desk',
      subtitle: 'Monitor manifest intake, document generation, and terminal-ready activity for today’s operations.',
      focus: [
        { label: 'Manifest actions', value: manifests.length, hint: 'NOA, BL, billing, and consignee declarations', to: '/manifests' },
        { label: 'Ready to release', value: releaseQueue?.readyToRelease ?? 0, hint: 'Payment verified eDOs', to: '/edo/release' },
        { label: 'Document generation', value: edos.length, hint: 'eDO and renewal work now in queue', to: '/edo' },
      ],
    },
    SystemAdmin: {
      eyebrow: 'Platform provider',
      subtitle: 'Validate broker eDO payments and oversee cargo workflow across shipping lines.',
      focus: [
        { label: 'eDO payments', value: pendingEdoPayments.length, hint: 'Awaiting validation', to: '/edo/payment-validation' },
        { label: 'Manifests', value: manifests.length, hint: 'Cargo workflow load', to: '/manifests' },
        { label: 'Unread alerts', value: unread.length, hint: 'Operational notifications', to: '/notifications' },
      ],
    },
    Accounting: {
      eyebrow: 'Finance control',
      subtitle: 'Keep manifest payment validations and billing moving without handoff delays.',
      focus: [
        { label: 'Manifest payments', value: pendingPayments.length, hint: 'Billing receipts to validate', to: '/payments' },
        { label: 'eDO payments', value: pendingEdoPayments.length, hint: 'Broker/consignee pay-to-open receipts', to: '/edo/payment-validation' },
        { label: 'Unread alerts', value: unread.length, hint: 'Exceptions and failed submissions', to: '/notifications' },
      ],
    },
    Evaluator: {
      eyebrow: 'Compliance review',
      subtitle: 'Work the accreditation queue with a clean view of pending submissions, review health, and follow-ups.',
      focus: [
        { label: 'Applications', value: accreditations.length, hint: 'Submitted or pending evaluator work', to: '/sas' },
        { label: 'Hierarchy', value: 'Review', hint: 'User and role access governance', to: '/admin/hierarchy' },
        { label: 'Alerts', value: unread.length, hint: 'Escalations and operator notices', to: '/notifications' },
      ],
    },
    TerminalTeam: {
      eyebrow: 'Terminal operations',
      subtitle: 'Handle pre-forecast verification, release readiness, and dwell pressure from one terminal-focused hub.',
      focus: [
        {
          label: 'Pending pre-forecast',
          value: preForecastActionQueueCount(truckerIntake, 'TerminalTeam'),
          hint: 'Requests awaiting terminal action',
          to: '/pre-forecast',
        },
        { label: 'Release queue', value: releaseQueue?.readyToRelease ?? 0, hint: 'Packages ready for gate release', to: '/edo/release' },
        {
          label: 'Dwell watch',
          value: truckerIntake.filter((s) => s.status === 'PendingTerminalAssignment').length,
          hint: 'Containers needing attention',
          to: '/dwell',
        },
      ],
    },
    CyStaff: {
      eyebrow: 'Container yard',
      subtitle: 'Review terminal-assigned empty return pre-forecasts and confirm which day your depot is free.',
      focus: [
        {
          label: 'Confirm return date',
          value: cyPendingSchedule,
          hint: 'Terminal assigned — awaiting your schedule',
          to: '/pre-forecast',
        },
        {
          label: 'In progress',
          value: cyIntake.filter((s) => !['Completed', 'Cancelled'].includes(s.status)).length,
          hint: 'All intake at your yard',
          to: '/pre-forecast?tab=submissions',
        },
        {
          label: 'Yard inventory',
          value: 'Open',
          hint: 'Containers at your assigned yard',
          to: '/container-inventory',
        },
      ],
    },
  } as const;

  const summary =
    roleSummary[role as keyof typeof roleSummary] ?? {
      eyebrow: 'Operations overview',
      subtitle: 'Keep the shipping portal moving across documents, payments, yard activity, and role-specific alerts.',
      focus: [
        { label: 'Cargo workflow', value: manifests.length, hint: 'Manifest and billing queue', to: '/manifests' },
        { label: 'Notifications', value: unread.length, hint: 'Unread alerts and updates', to: '/notifications' },
      ],
    };

  const queueCards: QueueItem[] = [...summary.focus];
  const roleChip = user?.businessName ? `${role} · ${user.businessName}` : role || 'Operations';
  const refreshDashboard = async () => {
    await Promise.all([
      refetchManifests(),
      refetchEdos(),
      refetchPreForecasts(),
      refetchTerminals(),
      refetchAllocations(),
      refetchContainers(),
      refetchUtilization(),
      refetchRepositioning(),
      refetchReleaseQueue(),
      refetchTruckerIntake(),
    ]);
  };

  const slStaffDashboard = useMemo(() => {
    if (!isLocationDashboard) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const manifestsToday = manifests.filter((m) => new Date(m.createdAt) >= startOfToday);
    const manifestsWeek = manifests.filter((m) => new Date(m.createdAt) >= startOfWeek);
    const manifestsMonth = manifests.filter((m) => new Date(m.createdAt) >= startOfMonth);

    const terminalById = new Map(terminals.map((t) => [t.id, t]));
    const outboundRequests = repositioning.filter((r) => !/completed|rejected/i.test(r.status));
    const pendingOutbound = repositioning.filter((r) => /pending/i.test(r.status)).length;
    const inTransitOutbound = repositioning.filter((r) => /transit/i.test(r.status)).length;
    const readyEdos = edos.filter((e) => /generated|ready|active/i.test(e.status)).length;

    type ContractLocationCard = {
      id: string;
      terminalId: string;
      name: string;
      code: string;
      logoPath?: string | null;
      location?: string;
      usedTeu: number;
      capacityTeu: number;
      capacity20: number;
      capacity40: number;
      allocated20: number;
      allocated40: number;
      pending20: number;
      pending40: number;
      intakePreForecast20: number;
      intakePreForecast40: number;
      intakeConfirmed20: number;
      intakeConfirmed40: number;
      utilizationPct: number;
      inbound: number;
      atPort: number;
      outbound: number;
    };

    const contractPortCards: ContractLocationCard[] = [];
    const contractCyCards: ContractLocationCard[] = [];
    const contractTerminalIds = new Set(contractAllocations.map((a) => a.terminalId));
    const scopedTruckerIntake = truckerIntake.filter(
      (s) =>
        s.status !== 'Cancelled' &&
        s.assignedTerminalId &&
        contractTerminalIds.has(s.assignedTerminalId),
    );
    const intakeByTerminal = cyIntakeCountsByTerminal(scopedTruckerIntake);

    for (const allocation of contractAllocations) {
      const terminal = terminalById.get(allocation.terminalId);
      if (!terminal?.isActive) continue;

      const utilRow = utilization.find((row) => row.terminalId === allocation.terminalId);
      const capacityTeu = computeContractTeu(allocation.capacity20Ft, allocation.capacity40Ft);
      const usedTeu = utilRow?.usedTeu ?? allocation.usedTeu;
      const localContainers = containers.filter(
        (c) =>
          c.cyAllocationId === allocation.id ||
          c.cyTerminalName === allocation.terminalName ||
          (c.currentLocation ?? '').toLowerCase().includes(terminal.name.toLowerCase()) ||
          (c.currentLocation ?? '').toLowerCase().includes(terminal.code.toLowerCase()),
      );
      const allocated20 = localContainers.filter((c) => c.sizeCode?.includes('20')).length;
      const allocated40 = localContainers.filter((c) => c.sizeCode?.includes('40')).length;
      const pendingPreForecast = utilRow?.pendingPreForecast ?? 0;
      const pending20 = Math.round(pendingPreForecast / 2);
      const pending40 = Math.max(pendingPreForecast - pending20, 0);
      const intakeCounts = intakeByTerminal.get(allocation.terminalId) ?? {
        preForecast20: 0,
        preForecast40: 0,
        confirmed20: 0,
        confirmed40: 0,
        preForecast: 0,
        confirmed: 0,
      };
      const inboundTotal = manifests.filter((m) => !m.billingId).length;
      const outboundTotal = outboundRequests
        .filter((r) => r.destinationTerminalName === terminal.name)
        .reduce((sum, r) => sum + r.containerCount, 0);

      const card: ContractLocationCard = {
        id: allocation.id,
        terminalId: terminal.id,
        name: terminal.name,
        code: terminal.code,
        logoPath: terminal.logoPath,
        location: formatTerminalAddressSummary(terminal.location) || terminal.city || undefined,
        usedTeu,
        capacityTeu,
        capacity20: allocation.capacity20Ft,
        capacity40: allocation.capacity40Ft,
        allocated20,
        allocated40,
        pending20: isContainerYardTerminal(terminal.identity) ? pending20 : 0,
        pending40: isContainerYardTerminal(terminal.identity) ? pending40 : 0,
        intakePreForecast20: isContainerYardTerminal(terminal.identity) ? intakeCounts.preForecast20 : 0,
        intakePreForecast40: isContainerYardTerminal(terminal.identity) ? intakeCounts.preForecast40 : 0,
        intakeConfirmed20: isContainerYardTerminal(terminal.identity) ? intakeCounts.confirmed20 : 0,
        intakeConfirmed40: isContainerYardTerminal(terminal.identity) ? intakeCounts.confirmed40 : 0,
        utilizationPct: capacityTeu ? Math.round((usedTeu / capacityTeu) * 1000) / 10 : 0,
        inbound: inboundTotal,
        atPort: utilRow?.atTerminal ?? allocated20 + allocated40,
        outbound: outboundTotal,
      };

      if (isPortTerminal(terminal.identity)) {
        contractPortCards.push(card);
      } else if (isContainerYardTerminal(terminal.identity)) {
        contractCyCards.push(card);
      }
    }

    const scopedUtilization = utilization.filter((row) => contractTerminalIds.has(row.terminalId));
    const totalAtPort = scopedUtilization.reduce((sum, row) => sum + row.atTerminal, 0);
    const totalIntakePreForecast = contractCyCards.reduce(
      (sum, card) => sum + card.intakePreForecast20 + card.intakePreForecast40,
      0,
    );
    const totalIntakeConfirmed = contractCyCards.reduce(
      (sum, card) => sum + card.intakeConfirmed20 + card.intakeConfirmed40,
      0,
    );
    const totalPreForecast = totalIntakePreForecast;
    const totalUsedTeu = scopedUtilization.reduce((sum, row) => sum + row.usedTeu, 0);
    const totalAllocatedTeu = [...contractPortCards, ...contractCyCards].reduce(
      (sum, card) => sum + card.capacityTeu,
      0,
    );
    const containersAtCy = containers.filter(
      (c) =>
        Boolean(c.cyAllocationId || c.cyTerminalName) &&
        contractCyCards.some(
          (yard) => yard.id === c.cyAllocationId || yard.name === c.cyTerminalName,
        ),
    );

    return {
      manifestsToday,
      manifestsWeek,
      manifestsMonth,
      totalAtPort,
      totalPreForecast,
      totalIntakePreForecast,
      totalIntakeConfirmed,
      totalUsedTeu,
      totalAllocatedTeu,
      containersAtCy,
      outboundRequests,
      pendingOutbound,
      inTransitOutbound,
      readyEdos,
      contractPortCards,
      contractCyCards,
    };
  }, [
    isLocationDashboard,
    manifests,
    terminals,
    utilization,
    containers,
    contractAllocations,
    repositioning,
    edos,
    truckerIntake,
  ]);

  if (isCyStaff && user?.id) {
    return (
      <WorkflowPage
        eyebrow="Container yard"
        title={`${greetingForNow()}, ${user.firstName || 'team'}`}
        subtitle="Terminal-assigned empty returns appear here — open each pre-forecast to confirm your depot free day."
        chips={
          <>
            <Chip
              label={`${cyPendingSchedule} to confirm`}
              size="small"
              color={cyPendingSchedule ? 'warning' : 'success'}
              component={RouterLink}
              to="/pre-forecast"
              clickable
            />
            <Chip label={`${unread.length} alerts`} size="small" color={unread.length ? 'error' : 'default'} component={RouterLink} to="/notifications" clickable />
          </>
        }
        actions={
          <Button component={RouterLink} to="/pre-forecast" variant="contained">
            Pre-forecast queue
          </Button>
        }
        stats={uniqueStats}
      >
        <CyStaffDashboardSection userId={user.id} />
      </WorkflowPage>
    );
  }

  if (isLocationDashboard && slStaffDashboard) {
    const awaitingFinal = accreditations.filter((a) => a.status === 'AwaitingFinalApproval').length;
    return (
      <WorkflowPage
        eyebrow={isShippingAdmin ? 'Shipping Lines Admin' : 'SL Staff operations'}
        title={isShippingAdmin ? 'Shipping Line Dashboard' : 'SL Staff Dashboard'}
        subtitle={
          isShippingAdmin
            ? 'Complete overview of your shipping line operations, container yards, and terminal management.'
            : 'Manage daily shipping-line operations from one place: NOA activity, terminal and CY visibility, and outbound container movement.'
        }
        chips={
          <>
            {isShippingAdmin && (
              <Chip label={`${awaitingFinal} awaiting final`} size="small" color="warning" component={RouterLink} to="/approvals" clickable />
            )}
            <Chip label={`${slStaffDashboard.readyEdos} ready`} size="small" color="primary" />
            <Chip label={`${slStaffDashboard.manifestsToday.length} created today`} size="small" color="success" />
          </>
        }
        actions={
          <>
            <Button component={RouterLink} to="/manifests" variant="contained">
              New NOA
            </Button>
            <Button component={RouterLink} to="/manifests" variant="outlined">
              NOA List
            </Button>
            {isShippingAdmin && (
              <>
                <Button component={RouterLink} to="/approvals" variant="outlined">
                  Accreditations
                </Button>
                <Button component={RouterLink} to="/shipping-admin/consignees" variant="outlined">
                  Consignees
                </Button>
                <Button component={RouterLink} to="/shipping-admin/brokers" variant="outlined">
                  Brokers
                </Button>
              </>
            )}
            <Button variant="outlined" onClick={refreshDashboard}>
              Refresh
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
          <StatCard label="Total NOAs" value={manifests.length} hint="All time" icon={<LocalShippingOutlinedIcon fontSize="small" />} />
          <StatCard label="Created today" value={slStaffDashboard.manifestsToday.length} hint="Today" icon={<ScheduleOutlinedIcon fontSize="small" />} accentColor="success.main" />
          <StatCard label="This week" value={slStaffDashboard.manifestsWeek.length} hint="Last 7 days" icon={<CalendarMonthOutlinedIcon fontSize="small" />} accentColor="info.main" />
          <StatCard label="This month" value={slStaffDashboard.manifestsMonth.length} hint="Last 30 days" icon={<QueryStatsOutlinedIcon fontSize="small" />} accentColor="warning.main" />
        </Box>

        <WorkflowSection title="Port / terminal" subtitle="Live shipping-line visibility across discharge terminals and outbound repositioning.">
          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' } }}>
            <SummaryCard
              label="Port terminals"
              value={slStaffDashboard.contractPortCards.length}
              hint="Discharge locations"
              icon={<DirectionsBoatOutlinedIcon fontSize="small" />}
              tone="primary"
            />
            <SummaryCard
              label="Inbound"
              value={manifests.filter((m) => !m.billingId).length}
              hint="Laden expected - ETA today onward"
              detail={`${manifests.filter((m) => !m.billingId && m.blNumber).length}x with BL · ${manifests.filter((m) => !m.billingId && !m.blNumber).length}x awaiting BL`}
              badges={slStaffDashboard.contractPortCards.slice(0, 2).map((terminal) => `${terminal.code} ${terminal.inbound}`)}
              icon={<DirectionsBoatOutlinedIcon fontSize="small" />}
              tone="info"
            />
            <SummaryCard
              label="At port"
              value={slStaffDashboard.totalAtPort}
              hint="Import + export/repo at terminal"
              detail={`${containers.filter((c) => c.currentDwellDays > 0).length} with dwell tracking`}
              badges={slStaffDashboard.contractPortCards.slice(0, 2).map((terminal) => `${terminal.code} ${terminal.atPort} used`)}
              icon={<PlaceOutlinedIcon fontSize="small" />}
              tone="success"
            />
            <SummaryCard
              label="Outbound"
              value={slStaffDashboard.outboundRequests.reduce((sum, item) => sum + item.containerCount, 0)}
              hint={`${slStaffDashboard.inTransitOutbound} in transit · ${slStaffDashboard.pendingOutbound} pending approval`}
              detail="CY to port repositioning"
              badges={slStaffDashboard.contractPortCards.slice(0, 2).map((terminal) => `${terminal.code} ${terminal.utilizationPct}%`)}
              icon={<LocalShippingOutlinedIcon fontSize="small" />}
              tone="warning"
            />
          </Box>
        </WorkflowSection>

        <WorkflowSection title="Container yards (CY)" subtitle="Return-location capacity, current occupancy, and trucker pre-forecast intake at your contract yards.">
          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(5, 1fr)' } }}>
            <SummaryCard
              label="Container yards"
              value={slStaffDashboard.contractCyCards.length}
              hint="Empty return locations"
              icon={<WarehouseOutlinedIcon fontSize="small" />}
              tone="primary"
            />
            <SummaryCard
              label="At CY"
              value={slStaffDashboard.containersAtCy.length}
              hint="Physically allocated at yard"
              detail={`${slStaffDashboard.containersAtCy.filter((c) => c.sizeCode?.includes('20')).length}x20ft · ${slStaffDashboard.containersAtCy.filter((c) => c.sizeCode?.includes('40')).length}x40ft`}
              badges={slStaffDashboard.contractCyCards.slice(0, 2).map((yard) => `${yard.code} ${yard.usedTeu} TEU`)}
              icon={<Inventory2OutlinedIcon fontSize="small" />}
              tone="success"
            />
            <SummaryCard
              label="Pre-forecast"
              value={slStaffDashboard.totalIntakePreForecast}
              hint="Terminal assigned — awaiting CY date"
              detail={`${slStaffDashboard.totalIntakeConfirmed} CY-confirmed return slot${slStaffDashboard.totalIntakeConfirmed === 1 ? '' : 's'}`}
              badges={slStaffDashboard.contractCyCards.slice(0, 2).map(
                (yard) => `${yard.code} ${yard.intakePreForecast20 + yard.intakePreForecast40} pf`,
              )}
              icon={<ScheduleOutlinedIcon fontSize="small" />}
              tone="warning"
            />
            <SummaryCard
              label="CY confirmed"
              value={slStaffDashboard.totalIntakeConfirmed}
              hint="Return dates confirmed by depot"
              detail={`${slStaffDashboard.totalIntakePreForecast} still awaiting CY confirmation`}
              badges={slStaffDashboard.contractCyCards.slice(0, 2).map(
                (yard) => `${yard.code} +${yard.intakeConfirmed20 + yard.intakeConfirmed40}`,
              )}
              icon={<Inventory2OutlinedIcon fontSize="small" />}
              tone="success"
            />
            <SummaryCard
              label="CY capacity"
              value={`${slStaffDashboard.totalUsedTeu} / ${slStaffDashboard.totalAllocatedTeu || 0} TEUs`}
              hint={`${slStaffDashboard.totalAllocatedTeu ? Math.round((slStaffDashboard.totalUsedTeu / slStaffDashboard.totalAllocatedTeu) * 1000) / 10 : 0}% full`}
              detail={`${slStaffDashboard.containersAtCy.length} at yard · ${slStaffDashboard.totalIntakePreForecast} pre-forecast · ${slStaffDashboard.totalIntakeConfirmed} confirmed`}
              badges={slStaffDashboard.contractCyCards.slice(0, 2).map((yard) => `${yard.code} ${yard.utilizationPct}%`)}
              icon={<QueryStatsOutlinedIcon fontSize="small" />}
              tone="info"
            />
          </Box>
        </WorkflowSection>

        <WorkflowSection
          title="Port terminals"
          subtitle="Contract TEU per discharge terminal — capacity, utilization, and unit limits."
          actions={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={`${slStaffDashboard.contractPortCards.length} Ports`} color="primary" />
              <Button component={RouterLink} to="/repositioning" size="small" variant="outlined">
                Outbound Requests
              </Button>
            </Stack>
          }
        >
          {slStaffDashboard.contractPortCards.length === 0 ? (
            <Alert severity="info" variant="outlined">
              No active port terminal contracts for your shipping line.
            </Alert>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
              {slStaffDashboard.contractPortCards.map((terminal) => (
                <ContractTeuLocationCard
                  key={terminal.id}
                  name={terminal.name}
                  subtitle={terminal.name}
                  code={terminal.code}
                  logoPath={terminal.logoPath}
                  kind="port"
                  typeLabel="PORT TERMINAL"
                  usedTeu={terminal.usedTeu}
                  capacityTeu={terminal.capacityTeu}
                  capacity20={terminal.capacity20}
                  capacity40={terminal.capacity40}
                  allocated20={terminal.allocated20}
                  allocated40={terminal.allocated40}
                  unitLimit20Label="20ft Units"
                  unitLimit40Label="40ft Units"
                />
              ))}
            </Box>
          )}
        </WorkflowSection>

        <WorkflowSection
          title="Depot allocation"
          subtitle="Contract TEU allocated to each depot — empty return capacity and unit limits."
          actions={
            <Chip size="small" label={`${slStaffDashboard.contractCyCards.length} CY`} color="primary" />
          }
        >
          {slStaffDashboard.contractCyCards.length === 0 ? (
            <Alert severity="info" variant="outlined">
              No active container yard contracts for your shipping line.
            </Alert>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
              {slStaffDashboard.contractCyCards.map((yard) => {
                const intakePf = yard.intakePreForecast20 + yard.intakePreForecast40;
                const intakeOk = yard.intakeConfirmed20 + yard.intakeConfirmed40;
                return (
                <ContractTeuLocationCard
                  key={yard.id}
                  name={yard.name}
                  subtitle={yard.location || yard.name}
                  code={yard.code}
                  logoPath={yard.logoPath}
                  kind="cy"
                  typeLabel="CONTAINER YARD"
                  usedTeu={yard.usedTeu}
                  capacityTeu={yard.capacityTeu}
                  capacity20={yard.capacity20}
                  capacity40={yard.capacity40}
                  allocated20={yard.allocated20}
                  allocated40={yard.allocated40}
                  intakePreForecast20={yard.intakePreForecast20}
                  intakePreForecast40={yard.intakePreForecast40}
                  intakeConfirmed20={yard.intakeConfirmed20}
                  intakeConfirmed40={yard.intakeConfirmed40}
                  footerAction={
                    intakePf > 0
                      ? { label: `${intakePf} pre-forecast at CY`, to: '/pre-forecast' }
                      : intakeOk > 0
                        ? { label: `${intakeOk} confirmed · view intake`, to: '/pre-forecast?tab=submissions' }
                        : { label: 'View pre-forecast intake', to: '/pre-forecast' }
                  }
                />
                );
              })}
            </Box>
          )}
        </WorkflowSection>

        {isShippingAdmin && (
          <WorkflowSection
            title="Partners"
            subtitle="Review new registrations and browse accredited consignee and broker profiles on your shipping line."
          >
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
              <PartnerLinkCard
                to="/approvals"
                icon={<AssignmentOutlinedIcon fontSize="small" />}
                title="Accreditations"
                hint="New registrations awaiting review"
                detail={`${accreditations.filter((a) => a.status === 'AwaitingFinalApproval').length} awaiting final approval`}
                tone="warning.main"
              />
              <PartnerLinkCard
                to="/shipping-admin/consignees"
                icon={<PeopleOutlineOutlinedIcon fontSize="small" />}
                title="Consignees"
                hint="Approved consignees on your line"
                detail={`${shippingAdminConsignees.length} accredited · use View for profile`}
                tone="primary.main"
              />
              <PartnerLinkCard
                to="/shipping-admin/brokers"
                icon={<BusinessOutlinedIcon fontSize="small" />}
                title="Brokers"
                hint="Approved brokers on your line"
                detail={`${shippingAdminBrokers.length} accredited · use View for profile`}
                tone="info.main"
              />
            </Box>
          </WorkflowSection>
        )}

        <WorkflowSection title="Operational follow-up" subtitle="Fast links back into the core workflow queues used by SL Staff.">
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' } }}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  component={RouterLink}
                  to={action.path}
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start', gap: 1.25, py: 1.5, textTransform: 'none', borderRadius: 2 }}
                >
                  <Icon fontSize="small" />
                  {action.label}
                </Button>
              );
            })}
          </Box>
        </WorkflowSection>
      </WorkflowPage>
    );
  }

  return (
    <WorkflowPage
      eyebrow={summary.eyebrow}
      title={`${greetingForNow()}, ${user?.fullName?.split(' ')[0] ?? 'there'}`}
      subtitle={summary.subtitle}
      chips={
        <>
          <Chip label={roleChip} color="primary" size="small" />
          <Chip label={`${unread.length} unread alerts`} size="small" color={unread.length ? 'warning' : 'success'} />
        </>
      }
      stats={uniqueStats}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2fr) minmax(280px, 360px)' },
        }}
      >
        <Stack spacing={3}>
          <WorkflowSection
            title="Priority work"
            subtitle="The main queues and responsibilities for your role today."
          >
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              }}
            >
              {queueCards.map((item) => (
                <Paper
                  key={item.label}
                  component={RouterLink}
                  to={item.to}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main" mt={0.5}>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.75}>
                    {item.hint}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </WorkflowSection>
        </Stack>

        <Stack spacing={3}>
          <WorkflowSection title="Quick actions" subtitle="Common links for this role.">
            <Stack spacing={1.25}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    component={RouterLink}
                    to={action.path}
                    variant="outlined"
                    color="primary"
                    sx={{ justifyContent: 'flex-start', gap: 1.25, py: 1.25, textTransform: 'none', borderRadius: 2 }}
                  >
                    <Icon fontSize="small" />
                    {action.label}
                  </Button>
                );
              })}
            </Stack>
          </WorkflowSection>

          <WorkflowSection title="Today’s operating posture" subtitle="Use this page as the starting point before moving into a queue.">
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Shipping-side work in V2 is organized around the same operational lanes as V1: cargo workflow, release workflow, terminal operations, review queues, and governance.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Focus first on overdue alerts, then clear the primary queue for your role, then finish secondary maintenance work such as hierarchy, platform settings, or reporting.
              </Typography>
            </Stack>
          </WorkflowSection>
        </Stack>
      </Box>
    </WorkflowPage>
  );
}

function PartnerLinkCard({
  to,
  icon,
  title,
  hint,
  detail,
  tone,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  hint: string;
  detail: string;
  tone: string;
}) {
  return (
    <Paper
      component={RouterLink}
      to={to}
      elevation={0}
      sx={{
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': { borderColor: tone, boxShadow: 1 },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box sx={{ color: tone, mt: 0.25 }}>{icon}</Box>
        <Box minWidth={0}>
          <Typography fontWeight={800}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.35}>
            {hint}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
            {detail}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accentColor = 'text.primary',
}: {
  label: string;
  value: string | number;
  hint: string;
  icon?: ReactNode;
  accentColor?: string;
}) {
  return (
    <Paper elevation={0} sx={{ px: 1.75, py: 1.35, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box minWidth={0}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.35, fontSize: 11 }}
          >
            {label}
          </Typography>
          <Typography fontWeight={800} mt={0.25} sx={{ fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: accentColor, fontSize: 11 }}>
            {hint}
          </Typography>
        </Box>
        {icon && (
          <Box sx={{ color: 'text.secondary', mt: 0.25, opacity: 0.75 }}>
            {icon}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  detail,
  badges,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  hint: string;
  detail?: string;
  badges?: string[];
  icon?: ReactNode;
  tone?: 'primary' | 'info' | 'success' | 'warning';
}) {
  const colorMap = {
    primary: 'primary.main',
    info: 'info.main',
    success: 'success.main',
    warning: 'warning.main',
  } as const;
  const bgMap = {
    primary: 'rgba(11, 61, 92, 0.10)',
    info: 'rgba(2, 136, 209, 0.10)',
    success: 'rgba(46, 125, 50, 0.10)',
    warning: 'rgba(237, 108, 2, 0.10)',
  } as const;

  return (
    <Paper elevation={0} sx={{ px: 1.75, py: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        {icon && (
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1.25,
              bgcolor: bgMap[tone],
              color: colorMap[tone],
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              mt: 0.15,
            }}
          >
            {icon}
          </Box>
        )}
        <Box minWidth={0}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.3, fontSize: 11 }}
          >
            {label}
          </Typography>
          <Typography
            fontWeight={800}
            color={colorMap[tone]}
            mt={0.15}
            sx={{
              fontSize: String(value).length > 8 ? 18 : 22,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              wordBreak: 'break-word',
            }}
          >
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: colorMap[tone], display: 'block', mt: 0.35, fontSize: 11 }}>
            {hint}
          </Typography>
          {detail && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.25} sx={{ fontSize: 11 }}>
              {detail}
            </Typography>
          )}
          {badges && badges.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.75}>
              {badges.map((badge) => (
                <Chip
                  key={badge}
                  size="small"
                  label={badge}
                  sx={{
                    height: 20,
                    borderRadius: 1,
                    bgcolor: `${tone}.light`,
                    color: `${tone}.contrastText`,
                    '& .MuiChip-label': { px: 0.75, fontWeight: 700, fontSize: 10 },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
