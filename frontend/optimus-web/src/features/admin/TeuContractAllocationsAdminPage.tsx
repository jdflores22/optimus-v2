import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useSearchParams } from 'react-router-dom';
import {
  useGetCyAllocationsQuery,
  useGetShippingLinesQuery,
  useGetTerminalsQuery,
  useUpsertCyAllocationMutation,
} from '../../app/api';
import { terminalTypeLabel } from '../../shared/terminalTaxonomy';
import { computeContractTeu, teuFrom20FtSlots, teuFrom40FtSlots } from '../../shared/teuUtils';
import { AdminFilterBar, AdminSearchField, AdminSelectField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const PAGE_SIZE = 10;

type FormState = {
  shippingLineId: string;
  terminalId: string;
  capacity20Ft: number;
  capacity40Ft: number;
};

function emptyForm(): FormState {
  return {
    shippingLineId: '',
    terminalId: '',
    capacity20Ft: 25,
    capacity40Ft: 12,
  };
}

function utilizationTone(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 90) return 'error';
  if (pct >= 70) return 'warning';
  return 'success';
}

export function TeuContractAllocationsAdminPage() {
  const [searchParams] = useSearchParams();
  const initialTerminalId = searchParams.get('terminalId') ?? '';

  const { data: allocations = [], isLoading, isError, refetch } = useGetCyAllocationsQuery({
    activeTerminalsOnly: false,
    containerYardsOnly: false,
  });
  const { data: shippingLines = [] } = useGetShippingLinesQuery();
  const { data: terminals = [] } = useGetTerminalsQuery({ activeOnly: false });
  const [upsertAllocation] = useUpsertCyAllocationMutation();

  const [search, setSearch] = useState('');
  const [shippingLineFilter, setShippingLineFilter] = useState('');
  const [terminalFilter, setTerminalFilter] = useState(initialTerminalId);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTerminalId) {
      setTerminalFilter(initialTerminalId);
    }
  }, [initialTerminalId]);

  const terminalById = useMemo(
    () => new Map(terminals.map((t) => [t.id, t])),
    [terminals],
  );

  const stats = useMemo(() => {
    const totalContractTeu = allocations.reduce((sum, a) => sum + a.allocatedCapacityTeu, 0);
    const totalUsedTeu = allocations.reduce((sum, a) => sum + a.usedTeu, 0);
    const terminalIds = new Set(allocations.map((a) => a.terminalId));
    return {
      contracts: allocations.length,
      totalContractTeu,
      totalUsedTeu,
      terminalsCovered: terminalIds.size,
    };
  }, [allocations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allocations.filter((a) => {
      const terminal = terminalById.get(a.terminalId);
      const matchesSearch =
        !q ||
        a.shippingLineName.toLowerCase().includes(q) ||
        a.terminalName.toLowerCase().includes(q) ||
        (terminal?.code ?? '').toLowerCase().includes(q);
      const matchesLine = !shippingLineFilter || a.shippingLineId === shippingLineFilter;
      const matchesTerminal = !terminalFilter || a.terminalId === terminalFilter;
      return matchesSearch && matchesLine && matchesTerminal;
    });
  }, [allocations, search, shippingLineFilter, terminalFilter, terminalById]);

  const paged = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      terminalId: terminalFilter || '',
      shippingLineId: shippingLineFilter || '',
    });
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const row = allocations.find((a) => a.id === id);
    if (!row) return;
    setEditingId(id);
    setForm({
      shippingLineId: row.shippingLineId,
      terminalId: row.terminalId,
      capacity20Ft: row.capacity20Ft,
      capacity40Ft: row.capacity40Ft,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.shippingLineId || !form.terminalId) {
      setError('Shipping line and terminal/CY are required.');
      return;
    }

    const allocatedCapacityTeu = computeContractTeu(form.capacity20Ft, form.capacity40Ft);
    if (allocatedCapacityTeu < 1) {
      setError('Enter at least one 20ft or 40ft slot — contract TEU is computed from slot counts.');
      return;
    }

    try {
      await upsertAllocation({
        id: editingId ?? undefined,
        shippingLineId: form.shippingLineId,
        terminalId: form.terminalId,
        allocatedCapacityTeu,
        capacity20Ft: form.capacity20Ft,
        capacity40Ft: form.capacity40Ft,
      }).unwrap();
      setDialogOpen(false);
      setMessage(editingId ? 'Contract allocation updated.' : 'Contract allocation created.');
      refetch();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Save failed.');
    }
  };

  const computedContractTeu = computeContractTeu(form.capacity20Ft, form.capacity40Ft);

  return (
    <WorkflowPage
      eyebrow="Master Data"
      title="Contract TEU allocations"
      subtitle="Assign contractual TEU capacity per shipping line at each port terminal or container yard. Capacity is defined here — not on the Terminal & CY profile."
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New contract allocation
        </Button>
      }
      stats={[
        { label: 'Active contracts', value: stats.contracts, tone: 'primary' },
        { label: 'Contract TEU total', value: stats.totalContractTeu, hint: 'Sum of all allocations', tone: 'success' },
        { label: 'Used TEU', value: stats.totalUsedTeu, hint: 'Current occupancy', tone: 'info' },
        { label: 'Locations covered', value: stats.terminalsCovered, tone: 'warning' },
      ]}
    >
      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {isError && <Alert severity="error">Could not load contract allocations.</Alert>}

      <AdminFilterBar>
        <AdminSearchField
          value={search}
          onValueChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Shipping line or terminal…"
        />
        <AdminSelectField
          value={shippingLineFilter}
          onChange={(e) => {
            setShippingLineFilter(e.target.value);
            setPage(0);
          }}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="">All shipping lines</MenuItem>
          {shippingLines.map((sl) => (
            <MenuItem key={sl.id} value={sl.id}>
              {sl.brandName}
            </MenuItem>
          ))}
        </AdminSelectField>
        <AdminSelectField
          value={terminalFilter}
          onChange={(e) => {
            setTerminalFilter(e.target.value);
            setPage(0);
          }}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="">All locations</MenuItem>
          {terminals.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name} ({t.code})
            </MenuItem>
          ))}
        </AdminSelectField>
      </AdminFilterBar>

      {isLoading && <LinearProgress />}

      <WorkflowSection
        title="Shipping line contracts"
        subtitle="Each row is a contractual TEU block for one shipping line at one terminal or CY."
      >
        {filtered.length === 0 && !isLoading ? (
          <Alert severity="info" variant="outlined">
            No contract allocations yet. Create one to link a shipping line to a terminal or CY with a TEU quota.
          </Alert>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Shipping line</TableCell>
                  <TableCell>Terminal / CY</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Contract TEU</TableCell>
                  <TableCell align="right">Used TEU</TableCell>
                  <TableCell align="right">20ft TEU / 40ft TEU</TableCell>
                  <TableCell align="right">Utilization</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((a) => {
                  const terminal = terminalById.get(a.terminalId);
                  const pct = a.allocatedCapacityTeu
                    ? Math.round((a.usedTeu / a.allocatedCapacityTeu) * 1000) / 10
                    : 0;
                  return (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{a.shippingLineName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography fontWeight={600}>{a.terminalName}</Typography>
                          {terminal && !terminal.isActive && (
                            <Chip size="small" label="Inactive CY" color="error" variant="outlined" />
                          )}
                        </Stack>
                        {terminal && (
                          <Typography variant="caption" color="text.secondary">
                            {terminal.code}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {terminal ? (
                          <Chip
                            size="small"
                            label={terminalTypeLabel(terminal.identity)}
                            variant="outlined"
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="right">{a.allocatedCapacityTeu}</TableCell>
                      <TableCell align="right">{a.usedTeu}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {teuFrom20FtSlots(a.capacity20Ft)} / {teuFrom40FtSlots(a.capacity40Ft)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {a.capacity20Ft}×20ft · {a.capacity40Ft}×40ft
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={`${pct}%`} color={utilizationTone(pct)} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit contract">
                          <IconButton size="small" onClick={() => openEdit(a.id)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
            />
          </>
        )}
      </WorkflowSection>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit contract allocation' : 'New contract allocation'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Shipping line"
              required
              disabled={!!editingId}
              value={form.shippingLineId}
              onChange={(e) => setForm({ ...form, shippingLineId: e.target.value })}
              helperText={editingId ? 'Shipping line cannot be changed on an existing contract.' : undefined}
            >
              <MenuItem value="">Select shipping line</MenuItem>
              {shippingLines.map((sl) => (
                <MenuItem key={sl.id} value={sl.id}>
                  {sl.brandName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Terminal / container yard"
              required
              disabled={!!editingId}
              value={form.terminalId}
              onChange={(e) => setForm({ ...form, terminalId: e.target.value })}
              helperText={
                editingId
                  ? 'Location cannot be changed on an existing contract.'
                  : 'Where this shipping line holds contractual TEU capacity.'
              }
            >
              <MenuItem value="">Select terminal or CY</MenuItem>
              {terminals.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} — {terminalTypeLabel(t.identity)} ({t.code})
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                type="number"
                label="20ft containers"
                inputProps={{ min: 0 }}
                value={form.capacity20Ft}
                onChange={(e) => setForm({ ...form, capacity20Ft: Number(e.target.value) })}
                helperText={`= ${teuFrom20FtSlots(form.capacity20Ft)} TEU (1 TEU per 20ft)`}
                fullWidth
              />
              <TextField
                type="number"
                label="40ft containers"
                inputProps={{ min: 0 }}
                value={form.capacity40Ft}
                onChange={(e) => setForm({ ...form, capacity40Ft: Number(e.target.value) })}
                helperText={`= ${teuFrom40FtSlots(form.capacity40Ft)} TEU (2 TEU per 40ft)`}
                fullWidth
              />
            </Stack>
            <TextField
              type="number"
              label="Contract TEU (total)"
              required
              value={computedContractTeu}
              InputProps={{ readOnly: true }}
              helperText={`${teuFrom20FtSlots(form.capacity20Ft)} TEU (20ft) + ${teuFrom40FtSlots(form.capacity40Ft)} TEU (40ft) = ${computedContractTeu} TEU`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingId ? 'Save changes' : 'Create contract'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
