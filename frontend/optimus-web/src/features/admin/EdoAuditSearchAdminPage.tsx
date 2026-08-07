import { useState } from 'react';
import { Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useGetEdoAuditQuery } from '../../app/api';
import { formRowStackProps } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

export function EdoAuditSearchAdminPage() {
  const [edoId, setEdoId] = useState('');
  const { data: edoAudit = [] } = useGetEdoAuditQuery(edoId, { skip: !edoId.trim() });

  return (
    <WorkflowPage
      eyebrow="Management"
      title="eDO Audit Search"
      subtitle="Inspect state-change history for a specific electronic delivery order."
    >
      <WorkflowSection title="Search by eDO identifier">
        <Stack {...formRowStackProps} mb={2}>
          <TextField
            size="small"
            label="eDO Id"
            value={edoId}
            onChange={(e) => setEdoId(e.target.value)}
            fullWidth
            placeholder="Paste eDO UUID"
          />
        </Stack>
        {!edoId.trim() && (
          <Typography variant="body2" color="text.secondary">
            Enter an eDO id to load its audit trail.
          </Typography>
        )}
        {edoId.trim() && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>From → To</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {edoAudit.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                      No audit events found for this eDO.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {edoAudit.map((a, i) => (
                <TableRow key={`${a.at}-${i}`}>
                  <TableCell>{a.event}</TableCell>
                  <TableCell>
                    {a.from ?? '-'} → {a.to ?? '-'}
                  </TableCell>
                  <TableCell>{a.actor}</TableCell>
                  <TableCell>{new Date(a.at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </WorkflowSection>
    </WorkflowPage>
  );
}
