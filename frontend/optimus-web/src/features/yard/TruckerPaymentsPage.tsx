import { useMemo } from 'react';
import {
  Alert,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { useGetActivePaymentFeeQuery, useGetTruckerIntakeSubmissionsQuery } from '../../app/api';
import { formatPhp, resolveEdoFeeAmount } from '../../shared/paymentFees';
import { TABLE_ACTIONS_HEADER, TableActionButton } from '../shared/TableViewLink';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { RenewedEdoBadge } from '../edo/RenewedEdoBadge';
import { edoPayToOpenPath } from '../edo/edoPayToOpenPaths';
import { preForecastDetailPath } from './preForecastPaths';
import {
  countTruckerPendingEdoPayments,
  filterTruckerPendingEdoPayments,
  filterTruckerRenewalEdoPaymentsAwaitingValidation,
  truckerRenewalEdoPaymentRejected,
} from './truckerEdoPayments';

export function TruckerPaymentsPage() {
  const { data: submissions = [], isLoading } = useGetTruckerIntakeSubmissionsQuery(undefined, {
    pollingInterval: 30_000,
  });
  const { data: edoFee } = useGetActivePaymentFeeQuery('edo');

  const feeAmount = resolveEdoFeeAmount(edoFee);
  const payable = useMemo(() => filterTruckerPendingEdoPayments(submissions), [submissions]);
  const awaitingValidation = useMemo(
    () => filterTruckerRenewalEdoPaymentsAwaitingValidation(submissions),
    [submissions],
  );
  const pendingCount = countTruckerPendingEdoPayments(submissions);

  return (
    <WorkflowPage
      eyebrow="Pre-forecast · Pay to open"
      title="eDO Payments"
      subtitle="Pay the eDO access fee for renewed CRO/eDO documents after shipping line staff generates your replacement release."
      chips={
        <>
          <Chip
            size="small"
            icon={<PaymentsOutlinedIcon />}
            label={`${pendingCount} due`}
            color={pendingCount ? 'warning' : 'default'}
          />
          {awaitingValidation.length > 0 && (
            <Chip size="small" label={`${awaitingValidation.length} validating`} color="info" variant="outlined" />
          )}
        </>
      }
      stats={[
        {
          label: 'Due now',
          value: pendingCount,
          hint: 'Upload receipt',
          tone: pendingCount ? 'warning' : 'success',
        },
        {
          label: 'Fee per eDO',
          value: formatPhp(feeAmount),
          hint: 'Access fee',
          tone: 'primary',
        },
        {
          label: 'Validating',
          value: awaitingValidation.length,
          hint: 'Accounting review',
          tone: awaitingValidation.length ? 'info' : 'default',
        },
      ]}
    >
      {pendingCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have <strong>{pendingCount}</strong> renewed CRO/eDO
          {pendingCount === 1 ? '' : 's'} waiting for your pay-to-open fee. Pay the exact amount and upload your
          receipt — accounting validates before the document can be opened.
        </Alert>
      )}

      <WorkflowSection
        title="Pay to open"
        subtitle="Renewed releases generated after detention was cleared — trucker pays the eDO access fee."
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Container</TableCell>
              <TableCell>Renewed eDO</TableCell>
              <TableCell>Replaces</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    Loading payments…
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && payable.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    No renewed eDO payments due right now.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {payable.map((item) => {
              const rejected = truckerRenewalEdoPaymentRejected(item);
              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} fontFamily="monospace">
                      {item.containerNumber}
                    </Typography>
                    {item.sizeCode && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.sizeCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography fontFamily="monospace" fontWeight={600}>
                        {item.newEdoNumber ?? '—'}
                      </Typography>
                      <RenewedEdoBadge />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.expiredEdoNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatPhp(feeAmount)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={rejected ? 'Resubmit payment' : 'Payment due'}
                      color={rejected ? 'error' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TableActionButton
                      label={rejected ? 'Resubmit' : 'Pay now'}
                      to={
                        item.newEdoId
                          ? edoPayToOpenPath(item.newEdoId, 'pre-forecast')
                          : preForecastDetailPath(item.id)
                      }
                      color="warning"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </WorkflowSection>

      {awaitingValidation.length > 0 && (
        <WorkflowSection
          title="Awaiting accounting validation"
          subtitle="Receipt submitted — download unlocks after verification."
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Container</TableCell>
                <TableCell>Renewed eDO</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {awaitingValidation.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} fontFamily="monospace">
                      {item.containerNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontFamily="monospace">{item.newEdoNumber ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label="Validating" color="info" />
                  </TableCell>
                  <TableCell align="right">
                    <TableActionButton label="View submission" to={preForecastDetailPath(item.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorkflowSection>
      )}
    </WorkflowPage>
  );
}
