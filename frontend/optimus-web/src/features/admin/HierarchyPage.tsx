import { useMemo, useState } from 'react';
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
  LinearProgress,
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
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { useSelector } from 'react-redux';
import {
  useGetHierarchyUsersQuery,
  useInviteUserMutation,
  useUnlockUserMutation,
} from '../../app/api';
import type { RootState } from '../../app/store';
import { formatRoleLabel } from '../../shared/roleLabels';
import { API_BASE_URL, type UserDto } from '../../shared/types';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { AdminFilterBar, AdminSearchField, AdminSelectField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const PAGE_SIZE = 10;

const SYSTEM_ROLES = [
  'SystemAdmin',
  'ShippingLinesAdmin',
  'SlStaff',
  'Evaluator',
  'Accounting',
  'TerminalTeam',
  'Broker',
  'Consignee',
  'Trucker',
];

const TEAM_INVITE_ROLES = ['SlStaff', 'Evaluator', 'Accounting', 'TerminalTeam'];

const EMPTY_INVITE = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'SlStaff',
};

function userInitials(user: UserDto): string {
  const fromName = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim();
  if (fromName) return fromName.toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

function avatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 42% 38%)`;
}

function roleChipColor(role: string): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'default' {
  switch (role) {
    case 'ShippingLinesAdmin':
      return 'secondary';
    case 'SlStaff':
      return 'primary';
    case 'Evaluator':
      return 'info';
    case 'Accounting':
      return 'warning';
    case 'TerminalTeam':
      return 'success';
    default:
      return 'default';
  }
}

function statusChipColor(status: string): 'success' | 'error' | 'warning' | 'default' {
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'active') return 'success';
  if (s === 'locked' || s === 'denied') return 'error';
  if (s === 'pending' || s === 'emailunverified') return 'warning';
  return 'default';
}

function formatUserStatus(status: string): string {
  if (status === 'Approved') return 'Active';
  if (status === 'EmailUnverified') return 'Email unverified';
  return status;
}

type HierarchyPageProps = {
  variant?: 'hierarchy' | 'users';
};

export function HierarchyPage({ variant = 'hierarchy' }: HierarchyPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const role = useSelector((state: RootState) => state.auth.user?.role ?? '');

  const isShippingAdmin = role === 'ShippingLinesAdmin';
  const isSystemAdmin = role === 'SystemAdmin';
  const canInvite = isShippingAdmin || isSystemAdmin;
  const inviteRoles = isShippingAdmin ? TEAM_INVITE_ROLES : SYSTEM_ROLES;
  const roleFilterOptions = isShippingAdmin
    ? [...TEAM_INVITE_ROLES, 'ShippingLinesAdmin']
    : SYSTEM_ROLES;

  const { data = [], isLoading, isError, refetch } = useGetHierarchyUsersQuery();
  const [inviteUser, { isLoading: inviting }] = useInviteUserMutation();
  const [unlockUser, { isLoading: unlocking }] = useUnlockUserMutation();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_INVITE);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUsersView = variant === 'users' && isSystemAdmin;

  const stats = useMemo(() => {
    const locked = data.filter((u) => u.status.toLowerCase() === 'locked').length;
    const active = data.filter((u) => u.status === 'Approved').length;
    const roles = new Set(data.map((u) => u.role)).size;
    return { total: data.length, locked, active, roles };
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (statusFilter) {
        const normalized = user.status.toLowerCase();
        if (statusFilter === 'active' && normalized !== 'approved') return false;
        if (statusFilter === 'locked' && normalized !== 'locked') return false;
        if (statusFilter === 'pending' && normalized !== 'pending' && normalized !== 'emailunverified') return false;
      }
      if (!q) return true;
      return (
        user.email.toLowerCase().includes(q) ||
        user.fullName.toLowerCase().includes(q) ||
        formatRoleLabel(user.role).toLowerCase().includes(q)
      );
    });
  }, [data, roleFilter, search, statusFilter]);

  const paged = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const onInvite = async () => {
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setError('Email, first name, and last name are required.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const pending = await inviteUser(form).unwrap();
      setMessage(`Invited ${pending.email}. Acceptance token issued.`);
      setForm({ ...EMPTY_INVITE, role: isShippingAdmin ? 'SlStaff' : form.role });
      setInviteOpen(false);
      refetch();
    } catch {
      setError('Invite failed.');
    }
  };

  const onUnlock = async (userId: string) => {
    try {
      await unlockUser(userId).unwrap();
      setMessage('User unlocked successfully.');
      setError(null);
      refetch();
    } catch {
      setError('Could not unlock user.');
    }
  };

  const onExport = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/hierarchy/users/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimus-users.csv';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('User export downloaded.');
      setError(null);
    } catch {
      setError('Could not export users.');
    }
  };

  const renderUserCell = (user: UserDto) => (
    <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 13,
          fontWeight: 700,
          bgcolor: avatarColor(user.email),
          flexShrink: 0,
        }}
      >
        {userInitials(user)}
      </Avatar>
      <Box minWidth={0}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {user.fullName || user.email.split('@')[0]}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {user.email}
        </Typography>
      </Box>
    </Stack>
  );

  const renderUnlockAction = (user: UserDto) =>
    isSystemAdmin && user.status.toLowerCase() === 'locked' ? (
      <Button
        size="small"
        variant="outlined"
        color="warning"
        startIcon={<LockOpenOutlinedIcon />}
        disabled={unlocking}
        onClick={() => onUnlock(user.id)}
      >
        Unlock
      </Button>
    ) : null;

  const emptyMessage =
    data.length === 0
      ? 'No users in your hierarchy yet. Invite a teammate to get started.'
      : 'No users match your filters.';

  return (
    <WorkflowPage
      eyebrow={isUsersView ? 'Management' : isShippingAdmin ? 'Shipping Lines Admin' : 'Governance'}
      title={isUsersView ? 'User Management' : isShippingAdmin ? 'My Team' : 'User hierarchy'}
      subtitle={
        isUsersView
          ? 'Manage system users and their roles across shipping lines, brokers, and internal operators.'
          : isShippingAdmin
            ? 'Invite and manage operators under your shipping line: staff, evaluators, accounting, and terminal team.'
            : 'Invite internal operators, review account status, and restore access for locked users.'
      }
      actions={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width={{ xs: '100%', sm: 'auto' }}>
          {isSystemAdmin && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={onExport}
              fullWidth={isMobile}
            >
              Export CSV
            </Button>
          )}
          {canInvite && (
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={() => {
                setError(null);
                setInviteOpen(true);
              }}
              fullWidth={isMobile}
            >
              {isShippingAdmin ? 'Invite teammate' : 'Invite user'}
            </Button>
          )}
        </Stack>
      }
      stats={[
        { label: 'Team', value: stats.total, hint: isShippingAdmin ? 'Your hierarchy' : 'Visible records', tone: 'primary' },
        { label: 'Active', value: stats.active, hint: 'Approved accounts', tone: 'success' },
        { label: 'Locked', value: stats.locked, hint: 'Requires unlock', tone: stats.locked ? 'warning' : 'success' },
        { label: 'Roles', value: stats.roles, hint: 'In current view', tone: 'info' },
      ]}
    >
      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">Could not load users.</Alert>}
      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && !inviteOpen && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <WorkflowSection
        title={isShippingAdmin ? 'Team register' : 'Access register'}
        subtitle={`${filtered.length} user${filtered.length === 1 ? '' : 's'} matching filters`}
      >
        <AdminFilterBar>
          <AdminSearchField
            placeholder="Search name, email, role…"
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
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">All roles</MenuItem>
              {roleFilterOptions.map((r) => (
                <MenuItem key={r} value={r}>
                  {formatRoleLabel(r)}
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
              <MenuItem value="locked">Locked</MenuItem>
              <MenuItem value="pending">Pending / unverified</MenuItem>
            </AdminSelectField>
          </Box>
        </AdminFilterBar>

        {/* Mobile cards */}
        <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
          {paged.length === 0 ? (
            <Stack alignItems="center" py={4} spacing={1}>
              <PersonOutlineOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {emptyMessage}
              </Typography>
            </Stack>
          ) : (
            paged.map((user) => (
              <Paper key={user.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    {renderUserCell(user)}
                    <Chip
                      size="small"
                      label={formatUserStatus(user.status)}
                      color={statusChipColor(user.status)}
                      sx={{ flexShrink: 0 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={formatRoleLabel(user.role)}
                      color={roleChipColor(user.role)}
                      variant="outlined"
                    />
                    {user.userType && (
                      <Chip size="small" label={user.userType} variant="outlined" />
                    )}
                  </Stack>
                  {renderUnlockAction(user)}
                </Stack>
              </Paper>
            ))
          )}
        </Stack>

        {/* Desktop table */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                {isSystemAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSystemAdmin ? 5 : 4}>
                    <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell sx={{ minWidth: 220 }}>{renderUserCell(user)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={formatRoleLabel(user.role)}
                        color={roleChipColor(user.role)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.userType || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={formatUserStatus(user.status)}
                        color={statusChipColor(user.status)}
                      />
                    </TableCell>
                    {isSystemAdmin && (
                      <TableCell align="right">{renderUnlockAction(user)}</TableCell>
                    )}
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

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isShippingAdmin ? 'Invite teammate' : 'Invite user'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            {error && inviteOpen && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              {isShippingAdmin
                ? 'New operators report to you and inherit your shipping-line scope.'
                : 'Provision the next internal operator into the shipping portal.'}
            </Typography>
            <TextField
              label="Email"
              type="email"
              fullWidth
              size="small"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First name"
                fullWidth
                size="small"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <TextField
                label="Last name"
                fullWidth
                size="small"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Stack>
            <TextField
              select
              label="Role"
              fullWidth
              size="small"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {inviteRoles.map((r) => (
                <MenuItem key={r} value={r}>
                  {formatRoleLabel(r)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onInvite} disabled={inviting}>
            Send invite
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
