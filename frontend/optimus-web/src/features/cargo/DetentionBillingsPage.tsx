import { useMemo } from 'react';
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  useGetEdoRenewalsQuery,
  useGetTruckerIntakeSubmissionsQuery,
} from '../../app/api';
import { TABLE_ACTIONS_HEADER, TableViewLink } from '../shared/TableViewLink';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { preForecastDetentionPaymentPath } from '../yard/preForecastPaths';

function moneyPhp(amount: number) {
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DetentionBillingsPage() {
  const { data: detentionBillings = [], isLoading: detentionLoading } = useGetTruckerIntakeSubmissionsQuery(
    'AwaitingDetentionPayment',
  );
  const { data: renewals = [] } = useGetEdoRenewalsQuery();

  const renewalById = useMemo(
    () => new Map(renewals.map((r) => [r.id, r])),
    [renewals],
  );

  return (
    <WorkflowPage
      eyebrow="Pre-forecast · Detention"
      title="Detention Billings"
      subtitle="Review detention / demurrage statements and submit payment receipts for accounting validation."
      chips={
        <Chip
          size="small"
          color={detentionBillings.length ? 'warning' : 'default'}
          label={`${detentionBillings.length} awaiting payment`}
        />
      }
      stats={[
        {
          label: 'Detention due',
          value: detentionBillings.length,
          hint: 'Pre-forecast billings',
          tone: detentionBillings.length ? 'warning' : 'info',
        },
        {
          label: 'Currency',
          value: 'PHP',
          hint: 'Detention charges',
          tone: 'default',
        },
      ]}
    >
      <WorkflowSection
        title="Awaiting payment"
        subtitle="Open each billing statement, pay the amount due, and upload your receipt."
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Container</TableCell>
              <TableCell>Manifest</TableCell>
              <TableCell>Expired eDO</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detentionLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    Loading detention billings…
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!detentionLoading && detentionBillings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    No detention billings awaiting payment.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
              {detentionBillings.map((item) => {
                const renewal = item.renewalRequestId ? renewalById.get(item.renewalRequestId) : undefined;
                const paymentPending =
                  item.detentionPaymentReceiptSubmitted ||
                  (renewal?.paymentReceiptSubmitted && !renewal.paymentVerified);
                return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{item.containerNumber}</Typography>
                    {item.sizeCode && (
                      <Typography variant="caption" color="text.secondary">
                        {item.sizeCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{item.manifestNumber ?? '—'}</TableCell>
                  <TableCell>{item.expiredEdoNumber}</TableCell>
                  <TableCell>{moneyPhp(item.detentionAmount)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={paymentPending ? 'info' : 'warning'}
                      label={paymentPending ? 'Receipt submitted' : 'Payment due'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TableViewLink to={preForecastDetentionPaymentPath(item.id)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </WorkflowSection>
    </WorkflowPage>
  );
}
