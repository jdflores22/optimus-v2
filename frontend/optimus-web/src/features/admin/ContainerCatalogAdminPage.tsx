import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {
  useGetContainerCatalogQuery,
  useUpsertContainerSizeMutation,
  useUpsertContainerTypeMutation,
} from '../../app/api';
import { formRowStackProps } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

type Props = { mode: 'types' | 'sizes' };

export function ContainerCatalogAdminPage({ mode }: Props) {
  const { data: catalog, refetch } = useGetContainerCatalogQuery();
  const [upsertType] = useUpsertContainerTypeMutation();
  const [upsertSize] = useUpsertContainerSizeMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', code: '', description: '' });
  const [sizeForm, setSizeForm] = useState({ name: '', code: '', teuValue: 1, description: '' });

  const types = catalog?.types ?? [];
  const sizes = catalog?.sizes ?? [];

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title={mode === 'types' ? 'Container Types' : 'Container Sizes'}
      subtitle={
        mode === 'types'
          ? 'Maintain container type codes used in manifests, yard intake, and billing.'
          : 'Maintain TEU values and size codes for operational capacity planning.'
      }
      chips={
        <Chip
          size="small"
          label={mode === 'types' ? `${types.length} types` : `${sizes.length} sizes`}
          color="primary"
        />
      }
    >
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {mode === 'types' ? (
        <>
          <WorkflowSection title="Add container type">
            <Stack {...formRowStackProps}>
              <TextField label="Name" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
              <TextField label="Code" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} />
              <TextField label="Description" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    await upsertType({ ...typeForm, isActive: true }).unwrap();
                    setMessage('Container type saved');
                    refetch();
                  } catch {
                    setError('Save failed');
                  }
                }}
              >
                Save
              </Button>
            </Stack>
          </WorkflowSection>
          <WorkflowSection title="Registered types">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.code}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.description ?? '—'}</TableCell>
                    <TableCell>{t.isActive ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </WorkflowSection>
        </>
      ) : (
        <>
          <WorkflowSection title="Add container size">
            <Stack {...formRowStackProps}>
              <TextField label="Name" value={sizeForm.name} onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })} />
              <TextField label="Code" value={sizeForm.code} onChange={(e) => setSizeForm({ ...sizeForm, code: e.target.value })} />
              <TextField
                type="number"
                label="TEU value"
                value={sizeForm.teuValue}
                onChange={(e) => setSizeForm({ ...sizeForm, teuValue: Number(e.target.value) })}
              />
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    await upsertSize({ ...sizeForm, isActive: true }).unwrap();
                    setMessage('Container size saved');
                    refetch();
                  } catch {
                    setError('Save failed');
                  }
                }}
              >
                Save
              </Button>
            </Stack>
          </WorkflowSection>
          <WorkflowSection title="Registered sizes">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>TEU</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sizes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.code}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.teuValue}</TableCell>
                    <TableCell>{s.isActive ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </WorkflowSection>
        </>
      )}
    </WorkflowPage>
  );
}
