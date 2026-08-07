import { useMemo } from 'react';
import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useGetPendingEdoPaymentsQuery, useGetReviewedEdoPaymentsQuery } from '../../app/api';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

function money(amount: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function EdoRevenueAdminPage() {
  const { data: pending = [] } = useGetPendingEdoPaymentsQuery();
  const { data: reviewed = [] } = useGetReviewedEdoPaymentsQuery();

  const verified = useMemo(
    () => reviewed.filter((p) => /verified/i.test(p.status)),
    [reviewed],
  );
  const collected = useMemo(
    () => verified.reduce((sum, p) => sum + p.amount, 0),
    [verified],
  );
  const pipeline = useMemo(
    () => pending.reduce((sum, p) => sum + p.amount, 0),
    [pending],
  );

  return (
    <WorkflowPage
      eyebrow="Platform revenue"
      title="eDO Access Revenue"
      subtitle="Track collected eDO access fees, pending validation pipeline, and verified payment history."
      chips={
        <>
          <Chip size="small" label={`${verified.length} verified`} color="success" />
          <Chip size="small" label={`${pending.length} pending`} color="warning" variant="outlined" />
        </>
      }
      stats={[
        { label: 'Collected (verified)', value: money(collected, 'PHP'), hint: 'Approved eDO payments', tone: 'success' },
        { label: 'Pending pipeline', value: money(pipeline, 'PHP'), hint: 'Awaiting admin validation', tone: 'warning' },
        { label: 'Verified count', value: verified.length, hint: 'Released access fees', tone: 'primary' },
        { label: 'Rejected / other', value: reviewed.length - verified.length, hint: 'Non-verified outcomes', tone: 'info' },
      ]}
    >
      <WorkflowSection title="Verified payments" subtitle="Fees collected after platform admin validation.">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>eDO</TableCell>
              <TableCell>Manifest</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {verified.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    No verified eDO payments yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {verified.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.edoNumber ?? p.edoId?.slice(0, 8) ?? '—'}</TableCell>
                <TableCell>{p.manifestNumber ?? '—'}</TableCell>
                <TableCell>{money(p.amount, p.currency)}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>

      <WorkflowSection title="Pending validation" subtitle="Payments awaiting platform review before release.">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>eDO</TableCell>
              <TableCell>Manifest</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Submitted by</TableCell>
              <TableCell>Submitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pending.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.edoNumber ?? '—'}</TableCell>
                <TableCell>{p.manifestNumber ?? '—'}</TableCell>
                <TableCell>{money(p.amount, p.currency)}</TableCell>
                <TableCell>{p.submittedByName ?? '—'}</TableCell>
                <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </WorkflowSection>
    </WorkflowPage>
  );
}
