import { useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useGetActivePaymentFeeQuery, useGetEdoRevenueReportQuery } from '../../app/api';
import { formatPhp, formatWhen } from '../../shared/paymentFees';
import { AdminFilterBar, AdminSearchField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import type { EdoRevenuePaymentRowDto } from '../../shared/types';

const FEE_TYPE = 'edo';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function formatDayLabel(day: string) {
  try {
    return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return day;
  }
}

function formatPeriod(from: string, to: string) {
  try {
    const f = new Date(`${from}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const t = new Date(`${to}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${f} – ${t}`;
  } catch {
    return `${from} – ${to}`;
  }
}

function money(amount: number, currency = 'PHP') {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return formatPhp(amount);
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'success' | 'warning' | 'error' | 'primary';
  icon: ReactNode;
}) {
  const colors = {
    success: { bg: 'rgba(46,125,50,0.1)', fg: 'success.main' },
    warning: { bg: 'rgba(239,108,0,0.1)', fg: 'warning.main' },
    error: { bg: 'rgba(198,40,40,0.1)', fg: 'error.main' },
    primary: { bg: 'rgba(11,61,92,0.08)', fg: 'primary.main' },
  }[tone];

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2.5, height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: colors.bg,
            color: colors.fg,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box minWidth={0}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} lineHeight={1.2} sx={{ color: colors.fg }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function DailyRevenueChart({ days }: { days: { day: string; amount: number }[] }) {
  const max = Math.max(...days.map((d) => d.amount), 1);

  if (days.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No verified payments in this period.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 220, pt: 1 }}>
      {days.map((day) => {
        const heightPct = Math.max(8, (day.amount / max) * 100);
        return (
          <Box key={day.day} sx={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <Box
              title={`${formatDayLabel(day.day)}: ${formatPhp(day.amount)}`}
              sx={{
                height: `${heightPct}%`,
                minHeight: 8,
                mx: 'auto',
                maxWidth: 36,
                bgcolor: 'success.main',
                opacity: 0.82,
                borderRadius: '6px 6px 2px 2px',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 1 },
              }}
            />
            <Typography variant="caption" color="text.secondary" display="block" mt={0.75} noWrap>
              {formatDayLabel(day.day)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function PaymentRowMobile({ row }: { row: EdoRevenuePaymentRowDto }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5} mb={1}>
        <Box minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700}>
            {row.manifestNumber ?? 'Manifest'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.edoNumber ?? '—'} · {formatWhen(row.validatedAt ?? row.createdAt)}
          </Typography>
        </Box>
        <Typography variant="subtitle2" fontWeight={800} color="success.main">
          {money(row.amount, row.currency)}
        </Typography>
      </Stack>
      <Stack spacing={0.35}>
        <Typography variant="caption" color="text.secondary">
          Line: <strong>{row.shippingLineName}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Submitted by: {row.submittedByName ?? '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Validated by: {row.validatedByName ?? '—'}
        </Typography>
      </Stack>
    </Paper>
  );
}

export function EdoRevenueAdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const initial = useMemo(() => defaultRange(), []);
  const [fromInput, setFromInput] = useState(initial.from);
  const [toInput, setToInput] = useState(initial.to);
  const [appliedRange, setAppliedRange] = useState(initial);
  const [search, setSearch] = useState('');

  const { data: report, isLoading, isFetching } = useGetEdoRevenueReportQuery(appliedRange);
  const { data: activeFee } = useGetActivePaymentFeeQuery(FEE_TYPE);

  const filteredRows = useMemo(() => {
    const rows = report?.recentVerified ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.edoNumber?.toLowerCase().includes(q) ||
        r.manifestNumber?.toLowerCase().includes(q) ||
        r.shippingLineName.toLowerCase().includes(q) ||
        r.submittedByName?.toLowerCase().includes(q) ||
        r.validatedByName?.toLowerCase().includes(q),
    );
  }, [report?.recentVerified, search]);

  const applyRange = () => {
    setAppliedRange({ from: fromInput, to: toInput });
  };

  return (
    <WorkflowPage
      eyebrow="Platform revenue"
      title="eDO Access Revenue"
      subtitle="Track collected fees, pending pipeline, daily trends, and revenue by shipping line."
      chips={
        report && (
          <>
            <Chip size="small" color="success" label={`${report.verified.count} verified in period`} />
            <Chip size="small" color="warning" variant="outlined" label={`${report.pending.count} pending`} />
          </>
        )
      }
      actions={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            to="/edo/release"
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Release queue
          </Button>
          <Button
            component={RouterLink}
            to="/admin/payment-fees"
            variant="outlined"
            startIcon={<SettingsOutlinedIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Fee config
          </Button>
        </Stack>
      }
    >
      {(isLoading || isFetching) && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 3, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ md: 'flex-end' }}
          useFlexGap
        >
          <TextField
            label="From"
            type="date"
            size="small"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Button variant="contained" onClick={applyRange} sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>
            Apply
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
          Period: {report ? formatPeriod(report.from, report.to) : formatPeriod(appliedRange.from, appliedRange.to)}
          {' · '}
          Current eDO fee:{' '}
          <strong>{formatPhp(activeFee?.amount ?? 750)}</strong>
        </Typography>
      </Paper>

      {report && (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            mb: 2,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          }}
        >
          <StatCard
            label="Collected"
            value={money(report.verified.amount)}
            hint={`${report.verified.count} verified in period`}
            tone="success"
            icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />}
          />
          <StatCard
            label="Pending review"
            value={money(report.pending.amount)}
            hint={`${report.pending.count} submitted in period`}
            tone="warning"
            icon={<HourglassEmptyOutlinedIcon fontSize="small" />}
          />
          <StatCard
            label="Rejected"
            value={money(report.rejected.amount)}
            hint={`${report.rejected.count} in period`}
            tone="error"
            icon={<CancelOutlinedIcon fontSize="small" />}
          />
          <StatCard
            label="All-time collected"
            value={money(report.lifetimeVerified.amount)}
            hint={`${report.lifetimeVerified.count} total verified`}
            tone="primary"
            icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />}
          />
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          mb: 2,
          gridTemplateColumns: { xs: '1fr', xl: '1.2fr 1fr' },
          alignItems: 'start',
        }}
      >
        <WorkflowSection
          title="Daily collected revenue"
          subtitle="Verified eDO access fees grouped by validation date."
        >
          {report ? (
            <DailyRevenueChart days={report.dailyRevenue} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading chart…
            </Typography>
          )}
        </WorkflowSection>

        <WorkflowSection
          title="Revenue by shipping line"
          subtitle="Verified totals in the selected period."
        >
          {!report?.byShippingLine.length ? (
            <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
              No shipping line breakdown for this period.
            </Typography>
          ) : isMobile ? (
            <Stack spacing={1}>
              {report.byShippingLine.map((line) => (
                <Paper key={line.shippingLineId} elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {line.brandName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {line.count} payment{line.count === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color="success.main">
                      {money(line.amount)}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Shipping line</TableCell>
                  <TableCell align="right">Payments</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.byShippingLine.map((line) => (
                  <TableRow key={line.shippingLineId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{line.brandName}</TableCell>
                    <TableCell align="right">{line.count}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {money(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </WorkflowSection>
      </Box>

      <WorkflowSection
        title="Recent verified payments"
        subtitle="Latest validated eDO access fees in the selected date range."
        actions={
          report && (
            <Chip
              size="small"
              icon={<TrendingUpOutlinedIcon />}
              label={`${filteredRows.length} shown`}
              color="primary"
              variant="outlined"
            />
          )
        }
      >
        <AdminFilterBar>
          <AdminSearchField
            value={search}
            onValueChange={setSearch}
            placeholder="Search manifest, eDO, line, or user…"
          />
        </AdminFilterBar>

        {!report ? (
          <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
            Loading payments…
          </Typography>
        ) : filteredRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" py={4} textAlign="center">
            No verified payments match your filters in this period.
          </Typography>
        ) : isMobile ? (
          <Stack spacing={1.25}>
            {filteredRows.map((row) => (
              <PaymentRowMobile key={row.id} row={row} />
            ))}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Validated</TableCell>
                  <TableCell>Manifest / eDO</TableCell>
                  <TableCell>Shipping line</TableCell>
                  <TableCell>Submitted by</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Validated by</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.validatedAt ? formatWhen(row.validatedAt).split(',')[0] : '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.validatedAt ? formatWhen(row.validatedAt).split(',').slice(1).join(',').trim() : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.manifestNumber ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.edoNumber ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.shippingLineName}</TableCell>
                    <TableCell>{row.submittedByName ?? '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {money(row.amount, row.currency)}
                    </TableCell>
                    <TableCell>{row.validatedByName ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </WorkflowSection>
    </WorkflowPage>
  );
}
