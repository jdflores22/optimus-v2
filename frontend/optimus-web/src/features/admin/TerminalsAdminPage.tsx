import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  useDeleteTerminalMutation,
  useGetTerminalsQuery,
  useToggleTerminalStatusMutation,
  useUpdateTerminalMutation,
  useUploadTerminalLogoMutation,
  useUpsertTerminalMutation,
} from '../../app/api';
import {
  PORT_TERMINAL_OPERATOR_OPTIONS,
  TERMINAL_TYPE_OPTIONS,
  emptyTerminalForm,
  formToPayload,
  suggestTerminalCode,
  terminalToForm,
  terminalTypeLabel,
  type TerminalFormState,
} from '../../shared/terminalAdminHelpers';
import { terminalMatchesOperatorFilter, terminalMatchesTypeFilter, terminalOperatorForDisplay, isContainerYardTerminal, isPortTerminal } from '../../shared/terminalTaxonomy';
import { AdminFilterBar, AdminSearchField, AdminSelectField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { TerminalLogoField } from './TerminalLogoField';
import { resolveTerminalLogoUrl, validateTerminalLogoFile } from '../../shared/terminalLogoUtils';
import { isTerminalAddressComplete, formatTerminalLocationLabel } from '../../shared/terminalAddressHelpers';
import { AddressPicker } from '../ops/AddressPicker';

const PAGE_SIZE = 10;

export function TerminalsAdminPage() {
  const location = useLocation();
  const { data: terminals = [], isLoading, isError, refetch } = useGetTerminalsQuery({ activeOnly: false });
  const [createTerminal] = useUpsertTerminalMutation();
  const [updateTerminal] = useUpdateTerminalMutation();
  const [toggleStatus] = useToggleTerminalStatusMutation();
  const [deleteTerminal] = useDeleteTerminalMutation();
  const [uploadTerminalLogo] = useUploadTerminalLogoMutation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TerminalFormState>(emptyTerminalForm());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoPath, setExistingLogoPath] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const resetLogoState = () => {
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setExistingLogoPath(null);
    setLogoError(null);
  };

  const handleLogoSelect = (file: File | null) => {
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      setLogoError(null);
      return;
    }
    const validationError = validateTerminalLogoFile(file);
    if (validationError) {
      setLogoError(validationError);
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoError(null);
  };

  const stats = useMemo(() => {
    const active = terminals.filter((t) => t.isActive).length;
    const containerYards = terminals.filter((t) => isContainerYardTerminal(t.identity)).length;
    const portTerminals = terminals.filter((t) => isPortTerminal(t.identity)).length;
    return {
      total: terminals.length,
      active,
      inactive: terminals.length - active,
      containerYards,
      portTerminals,
    };
  }, [terminals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return terminals.filter((t) => {
      const locationLabel = formatTerminalLocationLabel(t);
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        locationLabel.toLowerCase().includes(q) ||
        (t.city ?? '').toLowerCase().includes(q) ||
        (t.region ?? '').toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && t.isActive) ||
        (statusFilter === 'inactive' && !t.isActive);
      const matchesType = terminalMatchesTypeFilter(t, typeFilter);
      const matchesOperator = terminalMatchesOperatorFilter(t, operatorFilter);
      return matchesSearch && matchesStatus && matchesType && matchesOperator;
    });
  }, [terminals, search, statusFilter, typeFilter, operatorFilter]);

  const paged = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyTerminalForm());
    resetLogoState();
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const terminal = terminals.find((t) => t.id === id);
    if (!terminal) return;
    setEditingId(id);
    setForm(terminalToForm(terminal));
    resetLogoState();
    setExistingLogoPath(terminal.logoPath ?? null);
    setError(null);
    setDialogOpen(true);
  };

  useEffect(() => {
    const editId = (location.state as { editId?: string } | null)?.editId;
    if (editId && terminals.length > 0) {
      openEdit(editId);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once when navigated from detail
  }, [location.state, terminals]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.terminalType || !form.code.trim()) {
      setError('Name, code, and type are required.');
      return;
    }
    if (!isTerminalAddressComplete(form.addressSerialized)) {
      setError('Select region, province, and city/municipality from the address picker.');
      return;
    }
    if (form.terminalType === 'PortTerminal' && !form.operator) {
      setError('Port terminals require an operator (ATI or ICTSI).');
      return;
    }
    if (logoFile) {
      const validationError = validateTerminalLogoFile(logoFile);
      if (validationError) {
        setLogoError(validationError);
        setError(validationError);
        return;
      }
    }

    try {
      const payload = formToPayload(form, !editingId);
      let terminalId = editingId;
      if (editingId) {
        await updateTerminal({ id: editingId, ...payload, isActive: form.isActive }).unwrap();
      } else {
        const created = await createTerminal(payload).unwrap();
        terminalId = created.id;
      }

      if (logoFile && terminalId) {
        await uploadTerminalLogo({ id: terminalId, file: logoFile }).unwrap();
      }

      setMessage(editingId ? 'Location updated.' : 'Location created as inactive. Activate it when ready.');
      setError(null);
      setDialogOpen(false);
      resetLogoState();
      refetch();
    } catch (e: unknown) {
      setError((e as { data?: string | { message?: string } })?.data?.toString?.() ??
        (e as { data?: { message?: string } })?.data?.message ??
        'Save failed.');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleStatus(id).unwrap();
      setMessage('Terminal status updated.');
      setError(null);
      refetch();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Status update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTerminal(id).unwrap();
      setMessage('Terminal deleted.');
      setError(null);
      setConfirmDeleteId(null);
      refetch();
    } catch (e: unknown) {
      const msg =
        typeof (e as { data?: unknown })?.data === 'string'
          ? ((e as { data: string }).data as string)
          : (e as { data?: { message?: string } })?.data?.message;
      setError(msg ?? 'Delete failed.');
      setConfirmDeleteId(null);
    }
  };

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Terminals and Container Yard"
      subtitle="Register port terminals (ATI / ICTSI) and container yards (CY) — name, address, and status. Contract TEU per shipping line is managed under Contract TEU."
      chips={
        <>
          <Chip size="small" label={`${stats.portTerminals} port terminals`} color="primary" />
          <Chip size="small" label={`${stats.containerYards} container yards`} color="secondary" variant="outlined" />
        </>
      }
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add terminal or CY
        </Button>
      }
      stats={[
        { label: 'Total locations', value: stats.total, tone: 'primary' },
        { label: 'Port terminals', value: stats.portTerminals, tone: 'info' },
        { label: 'Container yards', value: stats.containerYards, tone: 'warning' },
        { label: 'Active', value: stats.active, tone: 'success' },
      ]}
    >
      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && !dialogOpen && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}


      <WorkflowSection
        title="Terminals and container yards"
        subtitle={`${filtered.length} location${filtered.length === 1 ? '' : 's'} — port terminals and CY facilities`}
      >
        <AdminFilterBar>
          <AdminSearchField
            placeholder="Search name, code, location…"
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
          />
          <AdminSelectField
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </AdminSelectField>
          <AdminSelectField
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              if (e.target.value !== 'PortTerminal') setOperatorFilter('');
              setPage(0);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All types</MenuItem>
            {TERMINAL_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </AdminSelectField>
          <AdminSelectField
            value={operatorFilter}
            onChange={(e) => {
              setOperatorFilter(e.target.value);
              setPage(0);
            }}
            disabled={typeFilter === 'ContainerYard'}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All operators</MenuItem>
            {PORT_TERMINAL_OPERATOR_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </AdminSelectField>
        </AdminFilterBar>
        {isLoading && <LinearProgress />}
        {isError && <Alert severity="error">Could not load terminals.</Alert>}

        {!isLoading && filtered.length === 0 ? (
          <Alert severity="info" variant="outlined">
            {terminals.length === 0
              ? 'No port terminals or container yards yet. Add your first location to get started.'
              : 'No locations match your filters.'}
          </Alert>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Operator</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          src={resolveTerminalLogoUrl(t.logoPath)}
                          variant="rounded"
                          sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700 }}
                        >
                          {t.code.slice(0, 2)}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography fontWeight={600}>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.code}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={terminalTypeLabel(t.identity)} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{terminalOperatorForDisplay(t) ?? '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" title={formatTerminalLocationLabel(t)}>
                        {formatTerminalLocationLabel(t)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t.isActive ? 'Active' : 'Inactive'}
                        color={t.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            component={RouterLink}
                            to={`/admin/terminals/${t.id}`}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => openEdit(t.id)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" color="warning" onClick={() => handleToggle(t.id)}>
                            {t.isActive ? (
                              <ToggleOffOutlinedIcon fontSize="small" />
                            ) : (
                              <ToggleOnOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setConfirmDeleteId(t.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
            />
          </>
        )}
      </WorkflowSection>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          resetLogoState();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingId ? 'Edit location' : 'Add port terminal or container yard'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && dialogOpen && <Alert severity="error">{error}</Alert>}
            {!editingId && (
              <Alert severity="info">
                Choose <strong>Container Yard</strong> for CY facilities or <strong>Port Terminal</strong> for ATI / ICTSI gates.
                New locations are created inactive — activate from the list when ready.
              </Alert>
            )}
            <TerminalLogoField
              name={form.name}
              terminalType={form.terminalType}
              existingLogoPath={existingLogoPath}
              previewUrl={logoPreview}
              onFileSelect={handleLogoSelect}
              onClear={() => handleLogoSelect(null)}
              error={logoError}
            />
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  code: editingId ? prev.code : suggestTerminalCode(name, prev.terminalType, prev.operator),
                }));
              }}
            />
            <TextField
              select
              label="Type"
              required
              value={form.terminalType}
              onChange={(e) => {
                const terminalType = e.target.value as TerminalFormState['terminalType'];
                setForm((prev) => ({
                  ...prev,
                  terminalType,
                  operator: terminalType === 'PortTerminal' ? prev.operator || 'Ati' : '',
                  code: editingId ? prev.code : suggestTerminalCode(prev.name, terminalType, prev.operator || 'Ati'),
                }));
              }}
            >
              {TERMINAL_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            {form.terminalType === 'PortTerminal' && (
              <TextField
                select
                label="Port terminal operator"
                required
                value={form.operator}
                onChange={(e) => {
                  const operator = e.target.value as TerminalFormState['operator'];
                  setForm((prev) => ({
                    ...prev,
                    operator,
                    code: editingId ? prev.code : suggestTerminalCode(prev.name, prev.terminalType, operator),
                  }));
                }}
                helperText="ATI and ICTSI are operators under Port Terminal, not terminal types."
              >
                {PORT_TERMINAL_OPERATOR_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              helperText="Unique terminal code (e.g. CY-MNL)"
            />
            <AddressPicker
              label="Address"
              required
              value={form.addressSerialized}
              onChange={(addressSerialized) => setForm((prev) => ({ ...prev, addressSerialized }))}
              helpText="Region, province, and city auto-fill from the location database. Add street or building details if needed."
            />
            {editingId && (
              <TextField
                select
                label="Status"
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingId ? 'Save changes' : 'Create terminal'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete terminal?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This cannot be undone. Terminals with pre-advice requests cannot be deleted — deactivate instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
