import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import {
  useActivateDocumentTemplateMutation,
  useCloneDocumentTemplateMutation,
  useDeleteDocumentTemplateMutation,
  useGetDocumentTemplatesQuery,
  useUpsertDocumentTemplateMutation,
} from '../../app/api';
import type { DocumentTemplateDto } from '../../shared/types';
import {
  DOCUMENT_TEMPLATE_TYPES,
  defaultDocumentTemplateHtml,
  documentTypeLabel,
  documentTypeShortLabel,
} from '../../shared/documentTemplateTypes';
import {
  defaultDocumentLayout,
  serializeDocumentLayout,
} from './documentTemplate/documentTemplateBlocks';
import {
  DocumentTemplateBuilder,
  triggerDocumentTemplatePreview,
  triggerDocumentTemplateSave,
} from './documentTemplate/DocumentTemplateBuilder';
import { formatWhen } from '../../shared/paymentFees';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { AdminFilterBar, AdminSearchField, AdminSelectField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const PAGE_SIZE = 10;

function statusColor(isActive: boolean): 'success' | 'default' {
  return isActive ? 'success' : 'default';
}

export function DocumentTemplatesAdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: templates = [], isLoading, isError, refetch } = useGetDocumentTemplatesQuery();
  const [upsertTemplate, { isLoading: saving }] = useUpsertDocumentTemplateMutation();
  const [activateTemplate] = useActivateDocumentTemplateMutation();
  const [cloneTemplate] = useCloneDocumentTemplateMutation();
  const [deleteTemplate, { isLoading: deleting }] = useDeleteDocumentTemplateMutation();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<string>('EDO');
  const [bodyHtml, setBodyHtml] = useState(defaultDocumentTemplateHtml('EDO'));
  const [layoutSaving, setLayoutSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState('EDO');
  const [createName, setCreateName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplateDto | null>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  const editing = templates.find((t) => t.id === editingId) ?? null;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDocumentType(editing.documentType);
      setBodyHtml(editing.bodyHtml);
    }
  }, [editing?.id, editing?.bodyHtml, editing?.name, editing?.documentType]);

  const stats = useMemo(() => {
    const active = templates.filter((t) => t.isActive).length;
    const types = new Set(templates.map((t) => t.documentType)).size;
    return { total: templates.length, active, inactive: templates.length - active, types };
  }, [templates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.documentType.toLowerCase().includes(q) ||
        documentTypeLabel(t.documentType).toLowerCase().includes(q);
      const matchesType = !typeFilter || t.documentType === typeFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && t.isActive) ||
        (statusFilter === 'inactive' && !t.isActive);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [templates, search, typeFilter, statusFilter]);

  const paged = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const openCreate = () => {
    setCreateType('EDO');
    setCreateName('');
    setCreateOpen(true);
  };

  const onCreate = async () => {
    if (!createName.trim()) {
      setError('Template name is required.');
      return;
    }
    try {
      const defaultLayout = defaultDocumentLayout(createType);
      const created = await upsertTemplate({
        documentType: createType,
        name: createName.trim(),
        bodyHtml: defaultDocumentTemplateHtml(createType),
        layoutJson: serializeDocumentLayout(defaultLayout),
        paperSize: String(defaultLayout.canvas.paperSize ?? 'A4'),
        orientation: String(defaultLayout.canvas.orientation ?? 'portrait'),
        isActive: false,
      }).unwrap();
      setMessage(`Created ${created.name} v${created.version}`);
      setError(null);
      setCreateOpen(false);
      setEditingId(created.id);
      refetch();
    } catch {
      setError('Could not create template.');
    }
  };

  const onPublishVersion = async (activate: boolean) => {
    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }
    try {
      const saved = await upsertTemplate({
        documentType,
        name: name.trim(),
        bodyHtml,
        isActive: activate,
      }).unwrap();
      setMessage(activate ? `Published and activated v${saved.version}` : `Saved draft v${saved.version}`);
      setError(null);
      setEditingId(saved.id);
      refetch();
    } catch {
      setError('Could not save template.');
    }
  };

  const onActivate = async (template: DocumentTemplateDto) => {
    try {
      await activateTemplate(template.id).unwrap();
      setMessage(`Activated ${template.name} v${template.version}`);
      setError(null);
      refetch();
    } catch {
      setError('Could not activate template.');
    }
  };

  const onClone = async (template: DocumentTemplateDto) => {
    try {
      const cloned = await cloneTemplate(template.id).unwrap();
      setMessage(`New version v${cloned.version} created`);
      setError(null);
      setEditingId(cloned.id);
      refetch();
    } catch {
      setError('Could not create new version.');
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate(deleteTarget.id).unwrap();
      if (editingId === deleteTarget.id) setEditingId(null);
      setMessage(`Deleted ${deleteTarget.name} v${deleteTarget.version}`);
      setError(null);
      setDeleteTarget(null);
      refetch();
    } catch {
      setError('Could not delete template. Active versions cannot be deleted.');
    }
  };

  const onSaveLayout = () => {
    setLayoutSaving(true);
    triggerDocumentTemplateSave();
  };

  const onPreviewLayout = () => {
    triggerDocumentTemplatePreview();
  };

  const renderTemplateActions = (t: DocumentTemplateDto, compact?: boolean) => (
    <Stack direction="row" spacing={compact ? 0.5 : 0.25} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
      <Tooltip title="Edit template">
        <IconButton size="small" onClick={() => setEditingId(t.id)} aria-label="Edit template">
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {!t.isActive && (
        <Tooltip title="Activate">
          <IconButton size="small" color="success" onClick={() => onActivate(t)} aria-label="Activate">
            <CheckCircleOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="New version">
        <IconButton size="small" onClick={() => onClone(t)} aria-label="New version">
          <ContentCopyOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {!t.isActive && (
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(t)} aria-label="Delete template">
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const emptyListMessage =
    templates.length === 0
      ? 'No document templates yet. Create one to get started.'
      : 'No templates match your filters.';

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Document Templates"
      subtitle="Visual canvas builder for NOA, eDO, billing, and other generated documents."
      stats={[
        { label: 'Total versions', value: stats.total, tone: 'primary' },
        { label: 'Active', value: stats.active, tone: 'success' },
        { label: 'Inactive', value: stats.inactive, tone: stats.inactive ? 'warning' : 'default' },
        { label: 'Document types', value: stats.types, tone: 'info' },
      ]}
    >
      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">Could not load document templates.</Alert>}
      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!editing ? (
        <WorkflowSection
          title="All templates"
          subtitle={`${filtered.length} version${filtered.length === 1 ? '' : 's'} matching filters`}
          actions={
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={openCreate}
              fullWidth={isMobile}
              sx={{ minWidth: { sm: 'auto' } }}
            >
              Create template
            </Button>
          }
        >
          <AdminFilterBar>
            <AdminSearchField
              placeholder="Search name or type…"
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'subgrid' },
                gap: 1,
                gridColumn: { md: 'span 2' },
              }}
            >
              <AdminSelectField
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">All types</MenuItem>
                {DOCUMENT_TEMPLATE_TYPES.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {isMobile ? documentTypeShortLabel(t.id) : t.label}
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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </AdminSelectField>
            </Box>
          </AdminFilterBar>

          {/* Mobile: card list */}
          <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {paged.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                {emptyListMessage}
              </Typography>
            ) : (
              paged.map((t) => (
                <Paper
                  key={t.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:active': { bgcolor: 'action.selected' },
                  }}
                  onClick={() => setEditingId(t.id)}
                >
                  <Stack spacing={1.25}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box minWidth={0} flex={1}>
                        <Typography variant="subtitle2" fontWeight={700} lineHeight={1.3}>
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                          {formatWhen(t.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={t.isActive ? 'Active' : 'Inactive'}
                        color={statusColor(t.isActive)}
                        sx={{ flexShrink: 0 }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                      <Chip
                        size="small"
                        label={documentTypeShortLabel(t.documentType)}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip size="small" label={`v${t.version}`} variant="outlined" />
                    </Stack>
                    <Box onClick={(e) => e.stopPropagation()}>{renderTemplateActions(t, true)}</Box>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>

          {/* Desktop: table */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                      {emptyListMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={documentTypeLabel(t.documentType)} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>v{t.version}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.isActive ? 'Active' : 'Inactive'} color={statusColor(t.isActive)} />
                    </TableCell>
                    <TableCell>{formatWhen(t.createdAt)}</TableCell>
                    <TableCell align="right">{renderTemplateActions(t)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </Box>

          {filtered.length > PAGE_SIZE && (
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
            />
          )}
        </WorkflowSection>
      ) : (
        <>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Button
                  startIcon={<ArrowBackOutlinedIcon />}
                  onClick={() => setEditingId(null)}
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  {isMobile ? 'Back' : 'All templates'}
                </Button>
                <Box minWidth={0} flex={1}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {documentTypeLabel(documentType)} · v{editing.version}
                  </Typography>
                  <TextField
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ mt: 0.5, width: '100%' }}
                    placeholder="Template name"
                  />
                  <Stack direction="row" spacing={0.75} mt={0.75} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={editing.isActive ? 'Active' : 'Inactive'}
                      color={statusColor(editing.isActive)}
                    />
                  </Stack>
                </Box>
              </Stack>

              {isMobile ? (
                <>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                    <Button variant="contained" disabled={layoutSaving} onClick={onSaveLayout} fullWidth>
                      Save layout
                    </Button>
                    <Button variant="outlined" onClick={onPreviewLayout} fullWidth>
                      Preview
                    </Button>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={saving}
                      onClick={() => onPublishVersion(false)}
                      sx={{ flex: 1 }}
                    >
                      Save draft
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={saving}
                      onClick={() => onPublishVersion(true)}
                      sx={{ flex: 1 }}
                    >
                      Publish
                    </Button>
                    <IconButton
                      size="small"
                      aria-label="More actions"
                      onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                      sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                    >
                      <MoreVertOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Menu
                    anchorEl={moreMenuAnchor}
                    open={Boolean(moreMenuAnchor)}
                    onClose={() => setMoreMenuAnchor(null)}
                  >
                    {!editing.isActive && (
                      <MenuItem
                        onClick={() => {
                          setMoreMenuAnchor(null);
                          onActivate(editing);
                        }}
                      >
                        Activate current
                      </MenuItem>
                    )}
                    <MenuItem
                      onClick={() => {
                        setMoreMenuAnchor(null);
                        onClone(editing);
                      }}
                    >
                      New version
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                  <Button size="small" variant="contained" disabled={layoutSaving} onClick={onSaveLayout}>
                    Save layout
                  </Button>
                  <Button size="small" variant="outlined" onClick={onPreviewLayout}>
                    Preview
                  </Button>
                  <Button size="small" variant="outlined" disabled={saving} onClick={() => onPublishVersion(false)}>
                    Save draft
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<PublishOutlinedIcon />}
                    disabled={saving}
                    onClick={() => onPublishVersion(true)}
                  >
                    Publish & activate
                  </Button>
                  {!editing.isActive && (
                    <Button size="small" onClick={() => onActivate(editing)}>
                      Activate current
                    </Button>
                  )}
                  <Button size="small" onClick={() => onClone(editing)}>
                    New version
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>

          <DocumentTemplateBuilder
            template={editing}
            onToast={(msg, severity) => {
              if (severity === 'success') {
                setMessage(msg);
                setError(null);
                if (msg.toLowerCase().includes('layout saved')) {
                  setLayoutSaving(false);
                  refetch();
                }
              } else {
                setError(msg);
                setLayoutSaving(false);
              }
            }}
          />
        </>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create document template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <TextField
              select
              label="Document type"
              size="small"
              fullWidth
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
            >
              {DOCUMENT_TEMPLATE_TYPES.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Template name"
              size="small"
              fullWidth
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Standard NOA layout"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void onCreate()} disabled={saving}>
            Create & edit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete template version</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete &quot;{deleteTarget?.name}&quot; v{deleteTarget?.version}? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => void onDelete()} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
