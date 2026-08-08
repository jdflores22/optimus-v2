import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  useGetEdoReleaseQueueQuery,
  useGetEdoReleaseRecordsQuery,
  useReleaseEdoMutation,
} from '../../app/api';
import type { RootState } from '../../app/store';
import type { EdoReleaseQueueItemDto, EdoReleaseRecordDto } from '../../shared/types';
import { formatEdoStatus } from '../../shared/formatEdoStatus';
import { formatPhp, formatWhen } from '../../shared/paymentFees';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { AdminFilterBar, AdminSearchField } from '../shared/AdminFilterBar';
import { TABLE_ACTIONS_HEADER, TableActionButton, TableViewLink } from '../shared/TableViewLink';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

type TabKey = 'all' | 'pending' | 'verified' | 'awaiting' | 'record';

function money(amount: number, currency: string) {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return formatPhp(amount);
}

function paymentBadge(item: EdoReleaseQueueItemDto) {
  if (!item.paymentId) {
    return <Chip size="small" label="Awaiting payment" variant="outlined" />;
  }
  if (/verified/i.test(item.paymentStatus ?? '')) {
    return <Chip size="small" label="Payment verified" color="success" />;
  }
  if (/pendingvalidation/i.test(item.paymentStatus ?? '')) {
    return <Chip size="small" label="Pending admin review" color="warning" />;
  }
  if (/reject/i.test(item.paymentStatus ?? '')) {
    return <Chip size="small" label="Payment rejected" color="error" />;
  }
  return <Chip size="small" label={item.paymentStatus ?? '—'} />;
}

function filterQueue(items: EdoReleaseQueueItemDto[], tab: TabKey) {
  switch (tab) {
    case 'pending':
      return items.filter((x) => /pendingvalidation/i.test(x.paymentStatus ?? ''));
    case 'verified':
      return items.filter((x) => x.status === 'PendingRelease');
    case 'awaiting':
      return items.filter((x) => !x.paymentId);
    default:
      return items;
  }
}

function matchesSearch(text: string, q: string) {
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

function queueMatches(item: EdoReleaseQueueItemDto, q: string) {
  return (
    matchesSearch(item.manifestNumber, q) ||
    matchesSearch(item.edoNumber, q) ||
    matchesSearch(item.containerNumber ?? '', q) ||
    matchesSearch(item.brokerName ?? '', q) ||
    matchesSearch(item.consigneeName ?? '', q) ||
    matchesSearch(item.submittedByName ?? '', q)
  );
}

function recordMatches(item: EdoReleaseRecordDto, q: string) {
  return (
    matchesSearch(item.manifestNumber, q) ||
    matchesSearch(item.edoNumber, q) ||
    matchesSearch(item.containerNumber ?? '', q) ||
    matchesSearch(item.brokerName ?? '', q) ||
    matchesSearch(item.consigneeName ?? '', q) ||
    matchesSearch(item.releasedByName ?? '', q)
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
  icon: ReactNode;
}) {
  const colors = {
    primary: { bg: 'rgba(11,61,92,0.08)', fg: 'primary.main' },
    success: { bg: 'rgba(46,125,50,0.1)', fg: 'success.main' },
    warning: { bg: 'rgba(239,108,0,0.1)', fg: 'warning.main' },
    info: { bg: 'rgba(2,119,189,0.1)', fg: 'info.main' },
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

function QueueCard({
  item,
  canPerformRelease,
  onRelease,
}: {
  item: EdoReleaseQueueItemDto;
  canPerformRelease: boolean;
  onRelease: (item: EdoReleaseQueueItemDto) => void;
}) {
  const readyToRelease = item.status === 'PendingRelease';

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5} mb={1.5}>
        <Box minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700} fontFamily="monospace">
            {item.manifestNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            {item.edoNumber}
          </Typography>
        </Box>
        {paymentBadge(item)}
      </Stack>

      <Stack spacing={0.5} mb={1.5}>
        <MetaRow label="Consignee" value={item.consigneeName ?? 'Not declared'} />
        <MetaRow label="Broker" value={item.brokerName ?? 'None'} />
        <MetaRow label="Container" value={item.containerNumber ?? '—'} mono />
        {item.paymentAmount != null && item.paymentCurrency && (
          <MetaRow label="Amount" value={money(item.paymentAmount, item.paymentCurrency)} bold />
        )}
        <MetaRow label="Generated" value={formatWhen(item.generatedAt)} />
        {item.submittedByName && <MetaRow label="Submitted by" value={item.submittedByName} />}
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button
          component={RouterLink}
          to={`/edo/${item.edoId}?from=release`}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          View eDO
        </Button>
        {readyToRelease && canPerformRelease && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<SendOutlinedIcon />}
            onClick={() => onRelease(item)}
            sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
          >
            Release
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

function RecordCard({ item }: { item: EdoReleaseRecordDto }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700} fontFamily="monospace">
            {item.manifestNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            {item.edoNumber}
          </Typography>
        </Box>
        <Chip size="small" label="Released" color="success" />
      </Stack>
      <Stack spacing={0.5} mb={1.5}>
        <MetaRow label="Consignee" value={item.consigneeName ?? '—'} />
        <MetaRow label="Broker" value={item.brokerName ?? '—'} />
        <MetaRow
          label="Payment"
          value={
            item.paymentAmount != null && item.paymentCurrency
              ? money(item.paymentAmount, item.paymentCurrency)
              : '—'
          }
        />
        <MetaRow label="Released" value={item.releasedAt ? formatWhen(item.releasedAt) : '—'} />
        <MetaRow label="Released by" value={item.releasedByName ?? '—'} />
      </Stack>
      <Button
        component={RouterLink}
        to={`/edo/${item.edoId}?from=release`}
        variant="outlined"
        size="small"
        fullWidth
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        View eDO
      </Button>
    </Paper>
  );
}

function MetaRow({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="baseline">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="caption"
        fontWeight={bold ? 700 : 600}
        fontFamily={mono ? 'monospace' : undefined}
        sx={{ textAlign: 'right', wordBreak: 'break-word' }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/** Shipping line staff release eDO/CRO; platform admin can view queue and release record (read-only). */
export function EdoReleasePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';
  const canView = ['SlStaff', 'ShippingLinesAdmin', 'TerminalTeam', 'SystemAdmin'].includes(role);
  const canPerformRelease = ['SlStaff', 'ShippingLinesAdmin', 'TerminalTeam'].includes(role);
  const isProviderView = role === 'SystemAdmin';

  const { data, isLoading, isFetching, refetch } = useGetEdoReleaseQueueQuery(undefined, {
    skip: !canView,
    pollingInterval: canView ? 30_000 : 0,
  });
  const { data: records = [], refetch: refetchRecords } = useGetEdoReleaseRecordsQuery(undefined, {
    skip: !canView,
    pollingInterval: canView ? 30_000 : 0,
  });
  const [releaseEdo, { isLoading: releasing }] = useReleaseEdoMutation();

  const [tab, setTab] = useState<TabKey>(isProviderView ? 'all' : 'verified');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<EdoReleaseQueueItemDto | null>(null);

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (tab === 'record') {
      return records.filter((r) => recordMatches(r, q));
    }
    return filterQueue(items, tab).filter((i) => queueMatches(i, q));
  }, [items, records, tab, search]);

  const handleRelease = async () => {
    if (!confirmItem) return;
    setError(null);
    try {
      await releaseEdo({ id: confirmItem.edoId, approve: true }).unwrap();
      setMessage(`Released ${confirmItem.edoNumber}`);
      setConfirmItem(null);
      refetch();
      refetchRecords();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Release failed');
      setConfirmItem(null);
    }
  };

  if (!canView) {
    return (
      <Alert severity="info">
        eDO release is handled by shipping line staff. Platform admins validate payments under{' '}
        <strong>eDO Payment Validation</strong>.
      </Alert>
    );
  }

  return (
    <WorkflowPage
      eyebrow={isProviderView ? 'Platform admin' : 'Shipping line operations'}
      title="Release eDO / CRO"
      subtitle={
        isProviderView
          ? 'Monitor broker payments, validation status, and documents ready for shipping line release.'
          : 'Release electronic delivery orders after the platform admin has verified broker payment.'
      }
      chips={
        <>
          <Chip size="small" color="success" label={`${data?.readyToRelease ?? 0} ready to release`} />
          {(data?.pendingValidation ?? 0) > 0 && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={`${data?.pendingValidation} awaiting validation`}
            />
          )}
        </>
      }
      actions={
        isProviderView ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              component={RouterLink}
              to="/admin/edo-release/revenue"
              variant="outlined"
              startIcon={<CurrencyExchangeOutlinedIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Revenue
            </Button>
            <Button
              component={RouterLink}
              to="/edo/payment-validation"
              variant="contained"
              startIcon={<FactCheckOutlinedIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Validate payments
            </Button>
          </Stack>
        ) : undefined
      }
    >
      {(isLoading || isFetching) && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {isProviderView && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are viewing as platform admin. Validate broker payments under{' '}
          <strong>eDO Payment Validation</strong>. Only shipping line staff can release documents.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          mb: 2,
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          label="Total in queue"
          value={data?.total ?? 0}
          hint="Open eDO/CRO documents"
          tone="primary"
          icon={<Inventory2OutlinedIcon fontSize="small" />}
        />
        <StatCard
          label="Pending validation"
          value={data?.pendingValidation ?? 0}
          hint="Awaiting platform review"
          tone="warning"
          icon={<HourglassEmptyOutlinedIcon fontSize="small" />}
        />
        <StatCard
          label="Ready to release"
          value={data?.readyToRelease ?? 0}
          hint="Payment verified"
          tone="success"
          icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />}
        />
        <StatCard
          label="Awaiting payment"
          value={data?.awaitingPayment ?? 0}
          hint="No receipt submitted"
          tone="info"
          icon={<CreditCardOutlinedIcon fontSize="small" />}
        />
      </Box>

      <WorkflowSection
        title="Release queue"
        subtitle="Filter by payment status, search manifests, and release verified eDOs."
      >
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
            <Tab value="all" label={`All (${data?.total ?? 0})`} />
            <Tab value="pending" label={`Pending validation (${data?.pendingValidation ?? 0})`} />
            <Tab value="verified" label={`Ready to release (${data?.readyToRelease ?? 0})`} />
            <Tab value="awaiting" label={`Awaiting payment (${data?.awaitingPayment ?? 0})`} />
            <Tab value="record" label={`Released (${records.length})`} />
          </Tabs>

          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <AdminFilterBar>
              <AdminSearchField
                value={search}
                onValueChange={setSearch}
                placeholder="Search manifest, eDO, broker, consignee…"
              />
            </AdminFilterBar>

            {filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <DescriptionOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" fontWeight={700}>
                  Queue is clear
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  No eDOs match this filter right now.
                </Typography>
              </Box>
            ) : tab === 'record' ? (
              isMobile ? (
                <Stack spacing={1.25}>
                  {filtered.map((item) => (
                    <RecordCard key={item.edoId} item={item as EdoReleaseRecordDto} />
                  ))}
                </Stack>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Manifest / eDO</TableCell>
                        <TableCell>Consignee</TableCell>
                        <TableCell>Broker</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell>Admin validated</TableCell>
                        <TableCell>Released</TableCell>
                        <TableCell>Released by</TableCell>
                        <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(filtered as EdoReleaseRecordDto[]).map((item) => (
                        <TableRow key={item.edoId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                              {item.manifestNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {item.edoNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.consigneeName ?? '—'}</TableCell>
                          <TableCell>{item.brokerName ?? '—'}</TableCell>
                          <TableCell>
                            {item.paymentAmount != null && item.paymentCurrency
                              ? money(item.paymentAmount, item.paymentCurrency)
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {item.paymentValidatedAt ? (
                              <>
                                <Typography variant="caption" display="block">
                                  {formatWhen(item.paymentValidatedAt)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.paymentValidatedByName ?? 'Provider'}
                                </Typography>
                              </>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>{item.releasedAt ? formatWhen(item.releasedAt) : '—'}</TableCell>
                          <TableCell>{item.releasedByName ?? '—'}</TableCell>
                          <TableCell align="right">
                            <TableViewLink to={`/edo/${item.edoId}?from=release`} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )
            ) : isMobile ? (
              <Stack spacing={1.25}>
                {(filtered as EdoReleaseQueueItemDto[]).map((item) => (
                  <QueueCard
                    key={item.edoId}
                    item={item}
                    canPerformRelease={canPerformRelease}
                    onRelease={setConfirmItem}
                  />
                ))}
              </Stack>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Manifest / eDO</TableCell>
                      <TableCell>Consignee</TableCell>
                      <TableCell>Broker</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Generated</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(filtered as EdoReleaseQueueItemDto[]).map((item) => {
                      const readyToRelease = item.status === 'PendingRelease';
                      return (
                        <TableRow key={item.edoId} hover>
                          <TableCell>
                            <Button
                              component={RouterLink}
                              to={`/manifests/${item.manifestId}?tab=documents`}
                              size="small"
                              sx={{ display: 'block', textAlign: 'left', fontFamily: 'monospace', p: 0, fontWeight: 700 }}
                            >
                              {item.manifestNumber}
                            </Button>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {item.edoNumber}
                            </Typography>
                            {item.containerNumber && (
                              <Typography variant="caption" color="text.secondary" display="block" fontFamily="monospace">
                                {item.containerNumber}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{item.consigneeName ?? '—'}</TableCell>
                          <TableCell>{item.brokerName ?? '—'}</TableCell>
                          <TableCell>
                            <Stack spacing={0.75}>
                              {paymentBadge(item)}
                              {item.paymentAmount != null && item.paymentCurrency && (
                                <Typography variant="caption" fontWeight={700}>
                                  {money(item.paymentAmount, item.paymentCurrency)}
                                </Typography>
                              )}
                              {item.submittedByName && (
                                <Typography variant="caption" color="text.secondary">
                                  by {item.submittedByName}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block" fontWeight={600}>
                              {formatWhen(item.generatedAt).split(',')[0]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatWhen(item.generatedAt).split(',').slice(1).join(',').trim()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={formatEdoStatus(item.status, item.paymentStatus)}
                              color={readyToRelease ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                              <TableViewLink to={`/edo/${item.edoId}?from=release`} />
                              {readyToRelease && canPerformRelease ? (
                                <TableActionButton
                                  label="Release"
                                  color="success"
                                  icon={<SendOutlinedIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => setConfirmItem(item)}
                                />
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        </Paper>
      </WorkflowSection>

      {!isProviderView && records.length > 0 && tab !== 'record' && (
        <Alert severity="info" icon={<ArrowBackOutlinedIcon />} sx={{ mt: 2 }}>
          {records.length} document{records.length === 1 ? '' : 's'} already released — open the{' '}
          <strong>Released</strong> tab to review history.
        </Alert>
      )}

      <Dialog open={Boolean(confirmItem)} onClose={() => setConfirmItem(null)} fullWidth maxWidth="xs">
        <DialogTitle>Release eDO / CRO</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Confirm release of this document to the broker/consignee workflow.
          </Typography>
          {confirmItem && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                {confirmItem.manifestNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                {confirmItem.edoNumber}
              </Typography>
              {confirmItem.paymentAmount != null && confirmItem.paymentCurrency && (
                <Typography variant="body2" mt={1} fontWeight={700} color="success.main">
                  {money(confirmItem.paymentAmount, confirmItem.paymentCurrency)} verified
                </Typography>
              )}
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setConfirmItem(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={releasing}
            startIcon={<SendOutlinedIcon />}
            onClick={handleRelease}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Release eDO
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
