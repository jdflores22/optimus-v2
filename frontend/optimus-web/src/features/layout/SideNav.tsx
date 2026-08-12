import {
  Badge,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useMemo } from 'react';
import {
  useGetAccreditationsQuery,
  useGetAppealsQuery,
  useGetEdoReleaseQueueQuery,
  useGetFinalPaymentsQuery,
  useGetPendingEdoPaymentsQuery,
  useGetTransfersQuery,
  useGetTruckerIntakeSubmissionsQuery,
} from '../../app/api';
import { getNavGroups, navLinkEnd } from './navConfig';
import { useBrokerAccreditation } from '../../shared/useBrokerAccreditation';
import { useCyStaffAssignment } from '../../shared/useCyStaffAssignment';
import { preForecastActionQueueCount } from '../yard/preForecastIntakeFilters';
import { countTruckerPendingEdoPayments } from '../yard/truckerEdoPayments';

type SideNavProps = {
  role?: string | null;
  onNavigate?: () => void;
  dense?: boolean;
};

export function SideNav({ role, onNavigate, dense }: SideNavProps) {
  const { isBroker, brokerAccredited } = useBrokerAccreditation();
  const { isCyStaff, cyAssigned } = useCyStaffAssignment();
  const navOptions =
    isBroker ? { brokerAccredited } : isCyStaff ? { cyAssigned } : undefined;
  const groups = getNavGroups(role, navOptions);
  const allNavItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const needsApprovalBadge = role === 'ShippingLinesAdmin';
  const needsAppealBadges = role === 'ShippingLinesAdmin';
  const needsTransferBadges = role === 'ShippingLinesAdmin' || role === 'SlStaff';
  const needsPendingPaymentsBadge = role === 'Accounting';
  const needsEdoPaymentValidationBadge = role === 'SystemAdmin' || role === 'Accounting';
  const needsSystemAdminBadges = role === 'SystemAdmin';
  const needsPreForecastIntakeBadge =
    role === 'TerminalTeam' || role === 'ShippingLinesAdmin' || role === 'SlStaff' || role === 'Accounting';
  const needsCyScheduleBadge = role === 'CyStaff';
  const needsDetentionBillingsBadge = role === 'Broker' || role === 'Consignee';
  const needsTruckerSubmissionsBadge = role === 'Trucker';
  const needsTruckerEdoPaymentsBadge = role === 'Trucker';
  const needsPreForecastQueueData = needsPreForecastIntakeBadge || needsCyScheduleBadge;
  const { data: truckerIntake = [] } = useGetTruckerIntakeSubmissionsQuery(undefined, {
    skip: !needsPreForecastQueueData,
    pollingInterval: needsPreForecastQueueData ? 30_000 : 0,
  });
  const { data: detentionBillings = [] } = useGetTruckerIntakeSubmissionsQuery('AwaitingDetentionPayment', {
    skip: !needsDetentionBillingsBadge,
    pollingInterval: needsDetentionBillingsBadge ? 30_000 : 0,
  });
  const { data: truckerSubmissions = [] } = useGetTruckerIntakeSubmissionsQuery(undefined, {
    skip: !needsTruckerSubmissionsBadge,
    pollingInterval: needsTruckerSubmissionsBadge ? 30_000 : 0,
  });
  const { data: accreditations = [] } = useGetAccreditationsQuery(undefined, {
    skip: !needsApprovalBadge,
    pollingInterval: needsApprovalBadge ? 30_000 : 0,
  });
  const { data: finalPayments } = useGetFinalPaymentsQuery(
    { status: 'pending_validation', page: 1, limit: 1 },
    {
      skip: !needsPendingPaymentsBadge,
      pollingInterval: needsPendingPaymentsBadge ? 30_000 : 0,
    },
  );
  const { data: releaseQueue } = useGetEdoReleaseQueueQuery(undefined, {
    skip: !needsSystemAdminBadges,
    pollingInterval: needsSystemAdminBadges ? 30_000 : 0,
  });
  const { data: pendingEdoPayments = [] } = useGetPendingEdoPaymentsQuery(undefined, {
    skip: !needsEdoPaymentValidationBadge,
    pollingInterval: needsEdoPaymentValidationBadge ? 30_000 : 0,
  });
  const { data: appeals = [] } = useGetAppealsQuery(undefined, {
    skip: !needsAppealBadges,
    pollingInterval: needsAppealBadges ? 30_000 : 0,
  });
  const { data: transfers = [] } = useGetTransfersQuery(undefined, {
    skip: !needsTransferBadges,
    pollingInterval: needsTransferBadges ? 30_000 : 0,
  });
  const awaitingFinalCount = useMemo(
    () => accreditations.filter((a) => a.status === 'AwaitingFinalApproval').length,
    [accreditations],
  );
  const pendingPaymentsCount = finalPayments?.stats.pending ?? 0;

  const pendingEdoReleaseCount = useMemo(() => {
    const items = releaseQueue?.items ?? [];
    return items.filter((x) => !x.paymentId || /pendingvalidation/i.test(x.paymentStatus ?? '')).length;
  }, [releaseQueue]);
  const pendingAppealsCount = useMemo(
    () => appeals.filter((a) => a.status === 'Pending').length,
    [appeals],
  );
  const pendingTransfersCount = useMemo(
    () => transfers.filter((t) => t.status === 'Pending').length,
    [transfers],
  );
  const preForecastQueueCount = useMemo(
    () => preForecastActionQueueCount(truckerIntake, role ?? ''),
    [truckerIntake, role],
  );

  const truckerInProgressCount = useMemo(
    () => truckerSubmissions.filter((x) => !['Completed', 'Cancelled'].includes(x.status)).length,
    [truckerSubmissions],
  );

  const truckerEdoPaymentsCount = useMemo(
    () => countTruckerPendingEdoPayments(truckerSubmissions),
    [truckerSubmissions],
  );

  const badgeFor = (
    badgeKey?:
      | 'awaitingFinalApprovals'
      | 'pendingPayments'
      | 'pendingEdoPayments'
      | 'pendingEdoRelease'
      | 'pendingAppeals'
      | 'pendingTransfers'
      | 'pendingPreForecastIntake'
      | 'pendingCyScheduleConfirm'
      | 'pendingDetentionBillings'
      | 'truckerPreForecastInProgress'
      | 'truckerEdoPayments',
  ) => {
    if (badgeKey === 'awaitingFinalApprovals') return awaitingFinalCount;
    if (badgeKey === 'pendingPayments') return needsPendingPaymentsBadge ? pendingPaymentsCount : 0;
    if (badgeKey === 'pendingEdoPayments') return needsEdoPaymentValidationBadge ? pendingEdoPayments.length : 0;
    if (badgeKey === 'pendingEdoRelease') return needsSystemAdminBadges ? pendingEdoReleaseCount : 0;
    if (badgeKey === 'pendingAppeals') return needsAppealBadges ? pendingAppealsCount : 0;
    if (badgeKey === 'pendingTransfers') return needsTransferBadges ? pendingTransfersCount : 0;
    if (badgeKey === 'pendingPreForecastIntake') {
      return needsPreForecastIntakeBadge ? preForecastQueueCount : 0;
    }
    if (badgeKey === 'pendingCyScheduleConfirm') {
      return needsCyScheduleBadge ? preForecastQueueCount : 0;
    }
    if (badgeKey === 'pendingDetentionBillings') {
      return needsDetentionBillingsBadge ? detentionBillings.length : 0;
    }
    if (badgeKey === 'truckerPreForecastInProgress') {
      return needsTruckerSubmissionsBadge ? truckerInProgressCount : 0;
    }
    if (badgeKey === 'truckerEdoPayments') {
      return needsTruckerEdoPaymentsBadge ? truckerEdoPaymentsCount : 0;
    }
    return 0;
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 1,
        scrollbarWidth: 'thin',
        scrollbarColor: (t) =>
          `${t.palette.mode === 'dark' ? 'rgba(154,173,184,0.35)' : 'rgba(11,61,92,0.28)'} transparent`,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(154,173,184,0.35)' : 'rgba(11,61,92,0.28)',
          borderRadius: 8,
        },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
      }}
    >
      {groups.map((group) => (
        <Box key={group.id} sx={{ mb: 1.5 }}>
          {group.label ? (
            <Typography
              variant="overline"
              sx={{
                px: 2.5,
                pt: 1.25,
                pb: 0.5,
                display: 'block',
                color: 'text.secondary',
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: '0.08em',
                lineHeight: 1.6,
              }}
            >
              {group.label}
            </Typography>
          ) : null}
          <List dense={dense} disablePadding>
            {group.items.map((item) => {
              const Icon = item.icon;
              const badgeCount = badgeFor(item.badgeKey);
              return (
                <ListItemButton
                  key={item.id}
                  component={NavLink}
                  to={item.path}
                  end={navLinkEnd(item, allNavItems)}
                  onClick={onNavigate}
                  sx={{
                    mx: 1,
                    borderRadius: 1.5,
                    '&.active': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': { color: 'inherit' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  />
                  {badgeCount > 0 && (
                    <Badge
                      badgeContent={badgeCount}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          position: 'static',
                          transform: 'none',
                          fontWeight: 700,
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
}
