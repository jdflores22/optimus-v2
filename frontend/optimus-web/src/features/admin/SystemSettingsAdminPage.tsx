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
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  useGetRateLimitsQuery,
  useGetSystemSettingsQuery,
  useUpdateRateLimitMutation,
  useUpsertRateLimitMutation,
  useUpsertSystemSettingMutation,
} from '../../app/api';
import type { RateLimitRuleDto, SystemSettingDto } from '../../shared/types';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { AdminFilterBar, AdminSearchField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const PAGE_SIZE = 10;

type Tab = 'settings' | 'rate-limits';

const SETTING_HINTS: Record<string, string> = {
  'session.idle_minutes': 'Idle session timeout in minutes',
  'notifications.email_from': 'Default sender address for email notifications',
  'pwa.vapid_public_key': 'Web Push VAPID public key',
};

export function SystemSettingsAdminPage() {
  const { data: settings = [], isLoading: loadingSettings, refetch: refetchSettings } =
    useGetSystemSettingsQuery();
  const { data: rates = [], isLoading: loadingRates, refetch: refetchRates } = useGetRateLimitsQuery();
  const [upsertSetting] = useUpsertSystemSettingMutation();
  const [upsertRate] = useUpsertRateLimitMutation();
  const [updateRate] = useUpdateRateLimitMutation();

  const [tab, setTab] = useState<Tab>('settings');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSettingDto | null>(null);
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [settingDescription, setSettingDescription] = useState('');

  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RateLimitRuleDto | null>(null);
  const [rateName, setRateName] = useState('');
  const [ratePrefix, setRatePrefix] = useState('/api');
  const [rateRole, setRateRole] = useState('');
  const [rateLimit, setRateLimit] = useState(100);
  const [rateWindow, setRateWindow] = useState(60);
  const [rateActive, setRateActive] = useState(true);

  const sessionTimeout = settings.find((s) => s.key === 'session.idle_minutes')?.value ?? '—';
  const activeRates = rates.filter((r) => r.isActive).length;

  const filteredSettings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return settings.filter(
      (s) =>
        !q ||
        s.key.toLowerCase().includes(q) ||
        s.value.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q),
    );
  }, [settings, search]);

  const pagedSettings = useMemo(
    () => filteredSettings.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredSettings, page],
  );

  const openCreateSetting = () => {
    setEditingSetting(null);
    setSettingKey('');
    setSettingValue('');
    setSettingDescription('');
    setSettingDialogOpen(true);
  };

  const openEditSetting = (setting: SystemSettingDto) => {
    setEditingSetting(setting);
    setSettingKey(setting.key);
    setSettingValue(setting.value);
    setSettingDescription(setting.description ?? '');
    setSettingDialogOpen(true);
  };

  const saveSetting = async () => {
    if (!settingKey.trim()) {
      setError('Setting key is required.');
      return;
    }
    try {
      await upsertSetting({
        key: settingKey.trim(),
        value: settingValue,
        description: settingDescription.trim() || null,
      }).unwrap();
      setMessage(`Saved setting "${settingKey.trim()}"`);
      setError(null);
      setSettingDialogOpen(false);
      refetchSettings();
    } catch {
      setError('Could not save setting.');
    }
  };

  const openCreateRate = () => {
    setEditingRate(null);
    setRateName('');
    setRatePrefix('/api');
    setRateRole('');
    setRateLimit(100);
    setRateWindow(60);
    setRateActive(true);
    setRateDialogOpen(true);
  };

  const openEditRate = (rate: RateLimitRuleDto) => {
    setEditingRate(rate);
    setRateName(rate.name);
    setRatePrefix(rate.pathPrefix);
    setRateRole(rate.role ?? '');
    setRateLimit(rate.permitLimit);
    setRateWindow(rate.windowSeconds);
    setRateActive(rate.isActive);
    setRateDialogOpen(true);
  };

  const saveRate = async () => {
    if (!rateName.trim() || !ratePrefix.trim()) {
      setError('Name and path prefix are required.');
      return;
    }
    const body = {
      name: rateName.trim(),
      pathPrefix: ratePrefix.trim(),
      role: rateRole.trim() || null,
      permitLimit: rateLimit,
      windowSeconds: rateWindow,
      isActive: rateActive,
    };
    try {
      if (editingRate) {
        await updateRate({ id: editingRate.id, ...body }).unwrap();
        setMessage(`Updated rate rule "${rateName.trim()}"`);
      } else {
        await upsertRate(body).unwrap();
        setMessage(`Added rate rule "${rateName.trim()}"`);
      }
      setError(null);
      setRateDialogOpen(false);
      refetchRates();
    } catch {
      setError('Could not save rate rule.');
    }
  };

  const isLoading = loadingSettings || loadingRates;

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="System Settings"
      subtitle="Global portal configuration, session defaults, and API rate limiting."
      actions={
        <ToggleButtonGroup
          exclusive
          size="small"
          value={tab}
          onChange={(_, value: Tab | null) => {
            if (value) {
              setTab(value);
              setPage(0);
              setSearch('');
            }
          }}
          aria-label="Settings section"
        >
          <ToggleButton value="settings">Settings ({settings.length})</ToggleButton>
          <ToggleButton value="rate-limits">Rate limits ({rates.length})</ToggleButton>
        </ToggleButtonGroup>
      }
      stats={[
        { label: 'Settings', value: settings.length, tone: 'primary' },
        { label: 'Session timeout', value: `${sessionTimeout} min`, tone: 'info' },
        { label: 'Rate rules', value: rates.length, tone: 'default' },
        { label: 'Active rules', value: activeRates, tone: activeRates ? 'success' : 'warning' },
      ]}
    >
      {isLoading && <LinearProgress />}
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

      {tab === 'settings' ? (
        <WorkflowSection
          title="Platform settings"
          subtitle={`${filteredSettings.length} setting${filteredSettings.length === 1 ? '' : 's'}`}
          actions={
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateSetting}>
              Add setting
            </Button>
          }
        >
          <AdminFilterBar>
            <AdminSearchField
              placeholder="Search key, value, description…"
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
            />
          </AdminFilterBar>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                      No settings match your search.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pagedSettings.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                        {s.key}
                      </Typography>
                      {SETTING_HINTS[s.key] && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {SETTING_HINTS[s.key]}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" noWrap title={s.value}>
                        {s.value}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" color="text.secondary" noWrap title={s.description ?? ''}>
                        {s.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit setting">
                        <IconButton size="small" onClick={() => openEditSetting(s)} aria-label="Edit setting">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredSettings.length > PAGE_SIZE && (
            <TablePagination
              component="div"
              count={filteredSettings.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
            />
          )}
        </WorkflowSection>
      ) : (
        <WorkflowSection
          title="API rate limits"
          subtitle={`${rates.length} rule${rates.length === 1 ? '' : 's'} configured`}
          actions={
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateRate}>
              Add rule
            </Button>
          }
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Path prefix</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Limit</TableCell>
                <TableCell>Window</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                      No rate limit rules configured yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {r.pathPrefix}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.role || 'All roles'}</TableCell>
                    <TableCell>{r.permitLimit}</TableCell>
                    <TableCell>{r.windowSeconds}s</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit rule">
                        <IconButton size="small" onClick={() => openEditRate(r)} aria-label="Edit rate rule">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </WorkflowSection>
      )}

      <Dialog open={settingDialogOpen} onClose={() => setSettingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSetting ? 'Edit setting' : 'Add setting'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <TextField
              label="Key"
              size="small"
              fullWidth
              value={settingKey}
              onChange={(e) => setSettingKey(e.target.value)}
              disabled={Boolean(editingSetting)}
              placeholder="session.idle_minutes"
            />
            <TextField
              label="Value"
              size="small"
              fullWidth
              value={settingValue}
              onChange={(e) => setSettingValue(e.target.value)}
            />
            <TextField
              label="Description"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={settingDescription}
              onChange={(e) => setSettingDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setSettingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSetting}>
            Save setting
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rateDialogOpen} onClose={() => setRateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRate ? 'Edit rate rule' : 'Add rate rule'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <TextField
              label="Name"
              size="small"
              fullWidth
              value={rateName}
              onChange={(e) => setRateName(e.target.value)}
            />
            <TextField
              label="Path prefix"
              size="small"
              fullWidth
              value={ratePrefix}
              onChange={(e) => setRatePrefix(e.target.value)}
              placeholder="/api/manifests"
            />
            <TextField
              label="Role (optional)"
              size="small"
              fullWidth
              value={rateRole}
              onChange={(e) => setRateRole(e.target.value)}
              placeholder="SystemAdmin"
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Permit limit"
                size="small"
                type="number"
                fullWidth
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Window (seconds)"
                size="small"
                type="number"
                fullWidth
                value={rateWindow}
                onChange={(e) => setRateWindow(Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={rateActive} onChange={(_, checked) => setRateActive(checked)} />
              <Typography variant="body2">Rule is active</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setRateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveRate}>
            {editingRate ? 'Update rule' : 'Add rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
