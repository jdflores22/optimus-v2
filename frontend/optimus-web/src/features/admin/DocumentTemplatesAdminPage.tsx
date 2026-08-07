import { useState } from 'react';
import { Alert, Button, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useGetDocumentTemplatesQuery, useUpsertDocumentTemplateMutation } from '../../app/api';
import { formRowStackProps } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

export function DocumentTemplatesAdminPage() {
  const { data: docTemplates = [], refetch } = useGetDocumentTemplatesQuery();
  const [upsertDoc] = useUpsertDocumentTemplateMutation();
  const [docType, setDocType] = useState('EDO');
  const [docBody, setDocBody] = useState('<h1>EDO</h1>');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Document Templates"
      subtitle="Maintain HTML templates for NOA, eDO, billing, and other generated documents."
      chips={<Chip size="small" label={`${docTemplates.length} versions`} color="primary" />}
    >
      {message && <Alert severity="success">{message}</Alert>}

      <WorkflowSection title="Publish template version">
        <Stack {...formRowStackProps} my={2}>
          <TextField select size="small" label="Type" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {['NOA', 'EDO', 'BL', 'Billing', 'OR', 'Certificate'].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" label="HTML" value={docBody} onChange={(e) => setDocBody(e.target.value)} fullWidth />
          <Button
            variant="contained"
            onClick={async () => {
              await upsertDoc({
                documentType: docType,
                name: `${docType} custom`,
                bodyHtml: docBody,
                isActive: true,
              }).unwrap();
              setMessage('Document template versioned');
              refetch();
            }}
          >
            Publish version
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {docTemplates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.documentType}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.version}</TableCell>
                <TableCell>{t.isActive ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>
    </WorkflowPage>
  );
}
