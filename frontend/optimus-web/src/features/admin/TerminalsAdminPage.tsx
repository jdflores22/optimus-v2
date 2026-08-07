import { useState } from 'react';
import { Alert, Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useGetTerminalsQuery, useUpsertTerminalMutation } from '../../app/api';
import { formRowStackProps } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

export function TerminalsAdminPage() {
  const { data: terminals = [], refetch } = useGetTerminalsQuery();
  const [upsertTerminal] = useUpsertTerminalMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    identity: 'ContainerYard',
    kind: 'Cy',
    dailyCapacity: 100,
  });

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Terminals"
      subtitle="Register and maintain container yards and port terminals used across yard and release workflows."
      chips={<Chip size="small" label={`${terminals.length} terminals`} color="primary" />}
    >
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <WorkflowSection title="Add or update terminal" subtitle="Create a new terminal record or update fields by reusing the same code.">
        <Stack {...formRowStackProps}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <TextField
            label="Kind"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            helperText="Cy = container yard, Ati = port"
          />
          <TextField
            type="number"
            label="Daily capacity"
            value={form.dailyCapacity}
            onChange={(e) => setForm({ ...form, dailyCapacity: Number(e.target.value) })}
          />
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await upsertTerminal(form).unwrap();
                setMessage('Terminal saved');
                setError(null);
                refetch();
              } catch (e: unknown) {
                setError((e as { data?: { message?: string } })?.data?.message ?? 'Save failed');
              }
            }}
          >
            Save
          </Button>
        </Stack>
      </WorkflowSection>

      <WorkflowSection title="Terminal register">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Kind</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terminals.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.code}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.kind}</TableCell>
                <TableCell>{t.dailyCapacity}</TableCell>
                <TableCell>{t.isActive ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>
    </WorkflowPage>
  );
}
