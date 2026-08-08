import { useMemo, useState } from 'react';
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
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import {
  useGetContainerCatalogQuery,
  useUpsertContainerSizeMutation,
  useUpsertContainerTypeMutation,
} from '../../app/api';
import type { ContainerSizeDto, ContainerTypeDto } from '../../shared/types';
import { AdminFilterBar, AdminSearchField, AdminSelectField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

type Props = { mode: 'types' | 'sizes' };

const PAGE_SIZE = 10;

type CatalogItem = ContainerTypeDto | ContainerSizeDto;

function asSize(item: CatalogItem): ContainerSizeDto {
  return item as ContainerSizeDto;
}

export function ContainerCatalogAdminPage({ mode }: Props) {
  const { data: catalog, isLoading, isError, refetch } = useGetContainerCatalogQuery();
  const [upsertType] = useUpsertContainerTypeMutation();
  const [upsertSize] = useUpsertContainerSizeMutation();

  const items = mode === 'types' ? catalog?.types ?? [] : catalog?.sizes ?? [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', code: '', description: '' });
  const [sizeForm, setSizeForm] = useState({ name: '', code: '', teuValue: 1, description: '' });
  const [editActive, setEditActive] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = items.filter((i) => i.isActive).length;
    return { total: items.length, active, inactive: items.length - active };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const paged = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const openCreate = () => {
    setEditingId(null);
    setTypeForm({ name: '', code: '', description: '' });
    setSizeForm({ name: '', code: '', teuValue: 1, description: '' });
    setEditActive(true);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    if (mode === 'types') {
      setTypeForm({
        name: item.name,
        code: item.code,
        description: item.description ?? '',
      });
    } else if (mode === 'sizes') {
      const size = asSize(item);
      setSizeForm({
        name: size.name,
        code: size.code,
        teuValue: size.teuValue,
        description: size.description ?? '',
      });
    }
    setEditActive(item.isActive);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const form = mode === 'types' ? typeForm : sizeForm;
    if (!form.name.trim() || !form.code.trim()) {
      setError('Name and code are required.');
      return;
    }
    if (mode === 'sizes' && sizeForm.teuValue < 1) {
      setError('TEU value must be at least 1.');
      return;
    }

    try {
      if (mode === 'types') {
        await upsertType({
          id: editingId ?? undefined,
          name: typeForm.name.trim(),
          code: typeForm.code.trim(),
          description: typeForm.description.trim() || undefined,
          isActive: editingId ? editActive : true,
        }).unwrap();
      } else {
        await upsertSize({
          id: editingId ?? undefined,
          name: sizeForm.name.trim(),
          code: sizeForm.code.trim(),
          teuValue: sizeForm.teuValue,
          description: sizeForm.description.trim() || undefined,
          isActive: editingId ? editActive : true,
        }).unwrap();
      }
      setMessage(editingId ? 'Record updated.' : 'Record created.');
      setError(null);
      setDialogOpen(false);
      refetch();
    } catch (e: unknown) {
      const msg =
        typeof (e as { data?: unknown })?.data === 'string'
          ? ((e as { data: string }).data as string)
          : (e as { data?: { message?: string } })?.data?.message;
      setError(msg ?? 'Save failed.');
    }
  };

  const handleToggle = async (item: CatalogItem) => {
    try {
      if (mode === 'types') {
        await upsertType({
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description ?? undefined,
          isActive: !item.isActive,
        }).unwrap();
      } else {
        const size = asSize(item);
        await upsertSize({
          id: size.id,
          name: size.name,
          code: size.code,
          teuValue: size.teuValue,
          description: size.description ?? undefined,
          isActive: !size.isActive,
        }).unwrap();
      }
      setMessage('Status updated.');
      setError(null);
      refetch();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Status update failed.');
    }
  };

  const title = mode === 'types' ? 'Container Type Management' : 'Container Size Management';
  const subtitle =
    mode === 'types'
      ? 'Manage container type classifications used in manifests, yard intake, and billing.'
      : 'Manage container size codes and TEU values for capacity planning.';

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title={title}
      subtitle={subtitle}
      chips={<Chip size="small" label={`${stats.total} ${mode === 'types' ? 'types' : 'sizes'}`} color="primary" />}
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add {mode === 'types' ? 'Type' : 'Size'}
        </Button>
      }
      stats={[
        { label: mode === 'types' ? 'Total Types' : 'Total Sizes', value: stats.total, tone: 'primary' },
        { label: 'Active', value: stats.active, tone: 'success' },
        { label: 'Inactive', value: stats.inactive, tone: stats.inactive ? 'error' : 'success' },
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
        title={mode === 'types' ? 'All container types' : 'All container sizes'}
        subtitle={`${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
      >
        <AdminFilterBar>
          <AdminSearchField
            placeholder="Search name or code…"
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
        </AdminFilterBar>
        {isLoading && <LinearProgress />}
        {isError && <Alert severity="error">Could not load catalog data.</Alert>}

        {!isLoading && filtered.length === 0 ? (
          <Alert severity="info" variant="outlined">
            {items.length === 0
              ? `No container ${mode === 'types' ? 'types' : 'sizes'} yet.`
              : 'No records match your filters.'}
          </Alert>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  {mode === 'sizes' && <TableCell>TEU</TableCell>}
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{item.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={item.code} variant="outlined" />
                    </TableCell>
                    {mode === 'sizes' && <TableCell>{asSize(item).teuValue}</TableCell>}
                    <TableCell>{item.description ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.isActive ? 'Active' : 'Inactive'}
                        color={item.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => openEdit(item)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={item.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" color="warning" onClick={() => handleToggle(item)}>
                            {item.isActive ? (
                              <ToggleOffOutlinedIcon fontSize="small" />
                            ) : (
                              <ToggleOnOutlinedIcon fontSize="small" />
                            )}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId
            ? `Edit container ${mode === 'types' ? 'type' : 'size'}`
            : `Add container ${mode === 'types' ? 'type' : 'size'}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && dialogOpen && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Name"
              required
              value={mode === 'types' ? typeForm.name : sizeForm.name}
              onChange={(e) =>
                mode === 'types'
                  ? setTypeForm({ ...typeForm, name: e.target.value })
                  : setSizeForm({ ...sizeForm, name: e.target.value })
              }
            />
            <TextField
              label="Code"
              required
              value={mode === 'types' ? typeForm.code : sizeForm.code}
              onChange={(e) =>
                mode === 'types'
                  ? setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })
                  : setSizeForm({ ...sizeForm, code: e.target.value.toUpperCase() })
              }
            />
            {mode === 'sizes' && (
              <TextField
                type="number"
                label="TEU value"
                required
                inputProps={{ min: 1, step: 0.5 }}
                value={sizeForm.teuValue}
                onChange={(e) => setSizeForm({ ...sizeForm, teuValue: Number(e.target.value) })}
              />
            )}
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={mode === 'types' ? typeForm.description : sizeForm.description}
              onChange={(e) =>
                mode === 'types'
                  ? setTypeForm({ ...typeForm, description: e.target.value })
                  : setSizeForm({ ...sizeForm, description: e.target.value })
              }
            />
            {editingId && (
              <TextField
                select
                label="Status"
                value={editActive ? 'active' : 'inactive'}
                onChange={(e) => setEditActive(e.target.value === 'active')}
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
            {editingId ? 'Save changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
