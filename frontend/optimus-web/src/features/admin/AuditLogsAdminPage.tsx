import { useState } from 'react';
import { MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useGetActivityLogsQuery } from '../../app/api';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

export function AuditLogsAdminPage() {
  const [entityType, setEntityType] = useState('');
  const { data: activity = [] } = useGetActivityLogsQuery({ entityType: entityType || undefined });

  return (
    <WorkflowPage
      eyebrow="Management"
      title="Audit Logs"
      subtitle="Platform activity history across manifests, eDOs, terminals, and operator actions."
    >
      <WorkflowSection title="Activity log">
        <TextField
          select
          size="small"
          label="Entity type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          sx={{ minWidth: 200, mb: 2 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Manifest">Manifest</MenuItem>
          <MenuItem value="ElectronicDeliveryOrder">eDO</MenuItem>
          <MenuItem value="Terminal">Terminal</MenuItem>
        </TextField>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>When</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activity.slice(0, 100).map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.action}</TableCell>
                <TableCell>
                  {a.entityType} {a.entityId?.slice(0, 8)}
                </TableCell>
                <TableCell>{a.actorName}</TableCell>
                <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>
    </WorkflowPage>
  );
}
