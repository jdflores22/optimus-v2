import { useMemo, useState } from 'react';
import {
  Alert,
  Chip,
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useGetNotificationMetricsQuery } from '../../app/api';
import { AdminFilterBar, AdminSearchField, AdminSelectField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const PAGE_SIZE = 15;

function statusColor(status: string): 'success' | 'error' | 'warning' | 'default' {
  const s = status.toLowerCase();
  if (s === 'sent' || s === 'delivered') return 'success';
  if (s === 'failed') return 'error';
  if (s === 'skipped') return 'warning';
  return 'default';
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function NotificationMetricsAdminPage() {
  const { data: metrics, isLoading, isError } = useGetNotificationMetricsQuery(undefined, {
    pollingInterval: 60_000,
  });

  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const deliveryRate = useMemo(() => {
    if (!metrics) return 0;
    const total = metrics.sent + metrics.failed;
    return total > 0 ? (metrics.sent / total) * 100 : 100;
  }, [metrics]);

  const failureRate = useMemo(() => {
    if (!metrics) return 0;
    const total = metrics.sent + metrics.failed;
    return total > 0 ? (metrics.failed / total) * 100 : 0;
  }, [metrics]);

  const channelBreakdown = useMemo(() => {
    const rows = metrics?.recent ?? [];
    const map = new Map<string, { sent: number; failed: number; skipped: number }>();
    rows.forEach((row) => {
      const bucket = map.get(row.channel) ?? { sent: 0, failed: 0, skipped: 0 };
      const s = row.status.toLowerCase();
      if (s === 'failed') bucket.failed += 1;
      else if (s === 'skipped') bucket.skipped += 1;
      else bucket.sent += 1;
      map.set(row.channel, bucket);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [metrics?.recent]);

  const filteredRecent = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (metrics?.recent ?? []).filter((row) => {
      const matchesSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.channel.toLowerCase().includes(q);
      const matchesChannel = !channelFilter || row.channel === channelFilter;
      const matchesStatus = !statusFilter || row.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [metrics?.recent, search, channelFilter, statusFilter]);

  const pagedRecent = useMemo(
    () => filteredRecent.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredRecent, page],
  );

  const channels = useMemo(
    () => [...new Set((metrics?.recent ?? []).map((r) => r.channel))].sort(),
    [metrics?.recent],
  );

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Notification Metrics"
      subtitle="Monitor delivery volume, failures, and unread in-app alerts across the platform."
      stats={
        metrics
          ? [
              { label: 'Sent', value: metrics.sent, hint: 'Successful deliveries', tone: 'success' },
              {
                label: 'Delivery rate',
                value: `${deliveryRate.toFixed(1)}%`,
                hint: `${metrics.sent + metrics.failed} attempts`,
                tone: deliveryRate >= 95 ? 'success' : 'warning',
              },
              { label: 'Failed', value: metrics.failed, hint: `${failureRate.toFixed(1)}% failure`, tone: 'error' },
              {
                label: 'Unread in-app',
                value: metrics.inAppUnread,
                hint: `${metrics.skipped} skipped`,
                tone: 'primary',
              },
            ]
          : undefined
      }
    >
      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">Could not load notification metrics.</Alert>}
      {metrics && deliveryRate < 95 && metrics.sent + metrics.failed > 0 && (
        <Alert severity="warning">
          Delivery rate ({deliveryRate.toFixed(1)}%) is below the 95% threshold. Review recent failures
          below.
        </Alert>
      )}

      {channelBreakdown.length > 0 && (
        <WorkflowSection
          title="Recent activity by channel"
          subtitle="Summary from the latest delivery log entries"
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Channel</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Failed</TableCell>
                <TableCell align="right">Skipped</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {channelBreakdown.map(([channel, counts]) => (
                <TableRow key={channel} hover>
                  <TableCell>
                    <Chip size="small" label={channel} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{counts.sent}</TableCell>
                  <TableCell align="right">{counts.failed}</TableCell>
                  <TableCell align="right">{counts.skipped}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorkflowSection>
      )}

      <WorkflowSection
        title="Recent delivery log"
        subtitle={`${filteredRecent.length} entr${filteredRecent.length === 1 ? 'y' : 'ies'} matching filters`}
      >
        <AdminFilterBar>
          <AdminSearchField
            placeholder="Search title, category, channel…"
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
          />
          <AdminSelectField
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(0);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All channels</MenuItem>
            {channels.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </AdminSelectField>
          <AdminSelectField
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All status</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="skipped">Skipped</MenuItem>
          </AdminSelectField>
        </AdminFilterBar>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Channel</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>When</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRecent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                    No notification deliveries match your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pagedRecent.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Chip size="small" label={row.channel} variant="outlined" />
                  </TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2" noWrap title={row.title}>
                      {row.title}
                    </Typography>
                    {row.error && (
                      <Typography variant="caption" color="error.main" display="block" noWrap title={row.error}>
                        {row.error}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={row.status} color={statusColor(row.status)} />
                  </TableCell>
                  <TableCell>{formatWhen(row.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filteredRecent.length > PAGE_SIZE && (
          <TablePagination
            component="div"
            count={filteredRecent.length}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        )}
      </WorkflowSection>
    </WorkflowPage>
  );
}
