import { type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useGetAdminDashboardMetricsQuery } from '../../app/api';
import { formatPhp } from '../../shared/paymentFees';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

function money(amount: number) {
  return formatPhp(amount);
}

export function SystemAdminDashboardPage() {
  const { data: metrics, isLoading, refetch, isFetching } = useGetAdminDashboardMetricsQuery();

  return (
    <WorkflowPage
      eyebrow="Admin Console"
      title="System Dashboard"
      subtitle="Monitor eDO payments, platform operations, and system health from one centralized command view."
      chips={
        <>
          <Chip
            size="small"
            color="warning"
            icon={<FactCheckOutlinedIcon />}
            label={`${metrics?.pendingEdoPayments ?? 0} pending validations`}
          />
          <Chip
            size="small"
            color="primary"
            icon={<TaskAltOutlinedIcon />}
            label={`${metrics?.readyToRelease ?? 0} ready to release`}
          />
        </>
      }
      actions={
        <>
          <Button component={RouterLink} to="/admin/audit-logs" variant="outlined" startIcon={<ListAltOutlinedIcon />}>
            Audit Logs
          </Button>
          <Button component={RouterLink} to="/edo/payment-validation" variant="contained" startIcon={<FactCheckOutlinedIcon />}>
            Payment Validation
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<RefreshOutlinedIcon />} onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </>
      }
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: 1,
          borderColor: 'primary.light',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}14 0%, ${theme.palette.background.paper} 55%, ${theme.palette.background.paper} 100%)`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <ShieldOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Platform overview
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Admin-focused metrics for eDO revenue and release readiness.
        </Typography>
      </Paper>

      <WorkflowSection title="eDO Payment Overview">
        <StatsPanel>
          <OverviewStat
            label="Total Fees"
            value={isLoading ? '…' : money(metrics?.verifiedEdoPaymentAmount ?? 0)}
            hint="All verified payments"
            icon={<PaymentsOutlinedIcon />}
            tone="primary"
          />
          <OverviewStat
            label="Daily Fees"
            value={isLoading ? '…' : money(metrics?.dailyVerifiedFees ?? 0)}
            hint="Today collections"
            icon={<CalendarTodayOutlinedIcon />}
            tone="success"
          />
          <OverviewStat
            label="Awaiting Payment"
            value={isLoading ? '…' : (metrics?.pendingEdoPayments ?? 0)}
            hint={isLoading ? '' : money(metrics?.pendingEdoPaymentAmount ?? 0)}
            icon={<HourglassEmptyOutlinedIcon />}
            tone="warning"
          />
          <OverviewStat
            label="Completed"
            value={isLoading ? '…' : (metrics?.verifiedEdoPayments ?? 0)}
            hint={isLoading ? '' : money(metrics?.verifiedEdoPaymentAmount ?? 0)}
            icon={<CheckCircleOutlineOutlinedIcon />}
            tone="secondary"
          />
          <OverviewStat
            label="Total Payments"
            value={isLoading ? '…' : (metrics?.totalEdoPayments ?? 0)}
            hint={isLoading ? '' : money(metrics?.totalEdoPaymentAmount ?? 0)}
            icon={<ReceiptLongOutlinedIcon />}
            tone="info"
          />
        </StatsPanel>
      </WorkflowSection>

      <WorkflowSection title="Attention Required">
        <StatsPanel columns={3}>
          <AttentionStat
            label="Payment Validation"
            value={metrics?.pendingEdoPayments ?? 0}
            tone="warning"
            actionLabel="Review now"
            to="/edo/payment-validation"
          />
          <AttentionStat
            label="Release Monitor"
            value={metrics?.readyToRelease ?? 0}
            tone="primary"
            actionLabel="Open queue"
            to="/edo/release"
          />
          <AttentionStat
            label="Audit Activity (7d)"
            value={metrics?.auditLogsLast7Days ?? 0}
            tone="info"
            actionLabel="View logs"
            to="/admin/audit-logs"
          />
        </StatsPanel>
      </WorkflowSection>
    </WorkflowPage>
  );
}

function StatsPanel({ children, columns = 5 }: { children: ReactNode; columns?: 3 | 4 | 5 }) {
  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`,
            lg: `repeat(${columns}, minmax(0, 1fr))`,
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

function OverviewStat({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone: 'primary' | 'success' | 'warning' | 'info' | 'secondary';
}) {
  const color = tone === 'secondary' ? 'text.secondary' : `${tone}.main`;
  return (
    <Box sx={{ p: 2.25, minWidth: 0, borderRight: { lg: 1 }, borderColor: { lg: 'divider' }, '&:last-of-type': { borderRight: 0 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box minWidth={0}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} color={color} mt={0.35} sx={{ wordBreak: 'break-word' }}>
            {value}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              {hint}
            </Typography>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.85, flexShrink: 0 }}>{icon}</Box>
      </Stack>
    </Box>
  );
}

function AttentionStat({
  label,
  value,
  tone,
  actionLabel,
  to,
}: {
  label: string;
  value: number;
  tone: 'warning' | 'primary' | 'info';
  actionLabel: string;
  to: string;
}) {
  const color = `${tone}.main` as const;
  return (
    <Box sx={{ p: 2.25, minWidth: 0, borderRight: { md: 1 }, borderColor: { md: 'divider' }, '&:last-of-type': { borderRight: 0 } }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800} color={color} mt={0.35}>
        {value}
      </Typography>
      <Button component={RouterLink} to={to} size="small" color={tone} sx={{ mt: 1.25, textTransform: 'none' }}>
        {actionLabel}
      </Button>
    </Box>
  );
}
