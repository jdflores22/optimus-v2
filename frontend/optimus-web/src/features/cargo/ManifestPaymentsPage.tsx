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
import { useSelector } from 'react-redux';
import { useGetManifestsQuery } from '../../app/api';
import type { RootState } from '../../app/store';
import type { ManifestDto } from '../../shared/types';
import { TABLE_ACTIONS_HEADER, TableActionButton } from '../shared/TableViewLink';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { formatWorkflowState } from '../../shared/formatWorkflowState';

function money(amount: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ownsManifest(manifest: ManifestDto, user: { role?: string; id?: string } | null | undefined) {
  if (!user?.id) return false;
  if (user.role === 'Broker') return !manifest.brokerId || manifest.brokerId === user.id;
  if (user.role === 'Consignee') return !manifest.consigneeId || manifest.consigneeId === user.id;
  return false;
}

function isPayableManifest(manifest: ManifestDto) {
  return (
    manifest.workflowState === 'BillingGenerated' &&
    Boolean(manifest.billingPdfPath) &&
    manifest.billingTotal != null
  );
}

export function ManifestPaymentsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: manifests = [], isLoading } = useGetManifestsQuery();

  const payableManifests = useMemo(
    () => manifests.filter((m) => ownsManifest(m, user) && isPayableManifest(m)),
    [manifests, user],
  );

  return (
    <WorkflowPage
      eyebrow="Manifest workflow · Billing"
      title="Manifest Payments"
      subtitle="Pay manifest final billing after accounting generates the invoice. eDO access fees and detention are handled separately."
      chips={
        <Chip
          size="small"
          color={payableManifests.length ? 'warning' : 'default'}
          label={`${payableManifests.length} payable`}
        />
      }
      stats={[
        {
          label: 'Payable manifests',
          value: payableManifests.length,
          hint: 'Billing generated',
          tone: payableManifests.length ? 'warning' : 'info',
        },
        {
          label: 'Payment type',
          value: 'Final',
          hint: 'Manifest billing only',
          tone: 'primary',
        },
      ]}
    >
      <WorkflowSection
        title="Awaiting final payment"
        subtitle="Open the manifest billing PDF, pay the exact amount, and upload your receipt."
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Manifest</TableCell>
              <TableCell>BL</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    Loading manifests…
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && payableManifests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    No manifest billings awaiting payment.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {payableManifests.map((manifest) => {
              const currency = (manifest.billingCurrency || 'USD').toUpperCase();
              return (
                <TableRow key={manifest.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{manifest.manifestNumber}</Typography>
                  </TableCell>
                  <TableCell>{manifest.blNumber ?? '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={formatWorkflowState(manifest.workflowState)} color="warning" />
                  </TableCell>
                  <TableCell>{money(manifest.billingTotal!, currency)}</TableCell>
                  <TableCell align="right">
                    <TableActionButton label="Pay" to={`/manifests/${manifest.id}/final-payment`} />
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
