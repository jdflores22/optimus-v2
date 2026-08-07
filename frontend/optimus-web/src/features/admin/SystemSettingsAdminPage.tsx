import { useState } from 'react';
import { Alert, Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import {
  useGetRateLimitsQuery,
  useGetSystemSettingsQuery,
  useUpsertRateLimitMutation,
  useUpsertSystemSettingMutation,
} from '../../app/api';
import { formRowStackProps } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

export function SystemSettingsAdminPage() {
  const { data: settings = [], refetch: refetchSettings } = useGetSystemSettingsQuery();
  const { data: rates = [], refetch: refetchRates } = useGetRateLimitsQuery();
  const [upsertSetting] = useUpsertSystemSettingMutation();
  const [upsertRate] = useUpsertRateLimitMutation();
  const [settingKey, setSettingKey] = useState('session.idle_minutes');
  const [settingValue, setSettingValue] = useState('30');
  const [rateName, setRateName] = useState('Custom');
  const [ratePrefix, setRatePrefix] = useState('/api');
  const [rateLimit, setRateLimit] = useState(100);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="System Settings"
      subtitle="Global portal configuration, session defaults, and API rate limiting."
      chips={
        <>
          <Chip size="small" label={`${settings.length} settings`} color="primary" />
          <Chip size="small" label={`${rates.length} rate rules`} variant="outlined" />
        </>
      }
    >
      {message && <Alert severity="success">{message}</Alert>}

      <WorkflowSection title="System settings">
        <Stack {...formRowStackProps} my={2}>
          <TextField size="small" label="Key" value={settingKey} onChange={(e) => setSettingKey(e.target.value)} />
          <TextField size="small" label="Value" value={settingValue} onChange={(e) => setSettingValue(e.target.value)} />
          <Button
            onClick={async () => {
              await upsertSetting({ key: settingKey, value: settingValue, description: null }).unwrap();
              setMessage('Setting saved');
              refetchSettings();
            }}
          >
            Upsert
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settings.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.key}</TableCell>
                <TableCell>{s.value}</TableCell>
                <TableCell>{s.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>

      <WorkflowSection title="Rate limiter">
        <Stack {...formRowStackProps} my={2} flexWrap="wrap">
          <TextField size="small" label="Name" value={rateName} onChange={(e) => setRateName(e.target.value)} />
          <TextField size="small" label="Path prefix" value={ratePrefix} onChange={(e) => setRatePrefix(e.target.value)} />
          <TextField
            size="small"
            type="number"
            label="Permit / min"
            value={rateLimit}
            onChange={(e) => setRateLimit(Number(e.target.value))}
            sx={{ width: 120 }}
          />
          <Button
            onClick={async () => {
              await upsertRate({
                name: rateName,
                pathPrefix: ratePrefix,
                role: null,
                permitLimit: rateLimit,
                windowSeconds: 60,
                isActive: true,
              }).unwrap();
              setMessage('Rate rule saved');
              refetchRates();
            }}
          >
            Add rule
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Path</TableCell>
              <TableCell>Limit</TableCell>
              <TableCell>Window</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rates.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.pathPrefix}</TableCell>
                <TableCell>{r.permitLimit}</TableCell>
                <TableCell>{r.windowSeconds}s</TableCell>
                <TableCell>{r.isActive ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>
    </WorkflowPage>
  );
}
