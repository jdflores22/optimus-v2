import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useGetNotificationMetricsQuery } from '../../app/api';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

export function NotificationMetricsAdminPage() {
  const { data: metrics } = useGetNotificationMetricsQuery();

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Notification Metrics"
      subtitle="Monitor delivery volume, failures, and unread in-app alerts across the platform."
      chips={
        metrics ? (
          <>
            <Chip size="small" label={`${metrics.sent} sent`} color="success" />
            <Chip size="small" label={`${metrics.failed} failed`} color="error" variant="outlined" />
          </>
        ) : undefined
      }
      stats={
        metrics
          ? [
              { label: 'Sent', value: metrics.sent, hint: 'Successful deliveries', tone: 'success' },
              { label: 'Failed', value: metrics.failed, hint: 'Delivery errors', tone: 'error' },
              { label: 'Skipped', value: metrics.skipped, hint: 'Muted or filtered', tone: 'warning' },
              { label: 'Unread in-app', value: metrics.inAppUnread, hint: 'Open alerts', tone: 'primary' },
            ]
          : undefined
      }
    >
      <WorkflowSection title="Recent delivery log">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Channel</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>When</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(metrics?.recent ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    No recent notification deliveries recorded.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {(metrics?.recent ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.channel}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>
    </WorkflowPage>
  );
}
