import { useMemo, useState } from 'react';
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
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import {
  useGenerateRenewedEdoMutation,
  useGetEdoRenewalsQuery,
  useReviewEdoRenewalMutation,
  useSubmitEdoRenewalPaymentMutation,
  useVerifyEdoRenewalPaymentMutation,
} from '../../app/api';
import type { RootState } from '../../app/store';
import type { RenewalDto } from '../../shared/types';
import { RenewedEdoBadge } from './RenewedEdoBadge';
import { edoPayToOpenPath } from './edoPayToOpenPaths';
import { preForecastDetailPath } from '../yard/preForecastPaths';
import { TABLE_ACTIONS_HEADER, TableActionButton } from '../shared/TableViewLink';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

function renewalStatusColor(
  status: string,
): 'default' | 'warning' | 'info' | 'success' | 'error' {
  if (status === 'Completed') return 'success';
  if (status === 'ReadyForGeneration') return 'info';
  if (status === 'AwaitingPayment') return 'warning';
  if (status === 'Cancelled') return 'error';
  return 'default';
}

function renewedEdoLink(r: RenewalDto, role: string) {
  if (!r.newEdoId) return null;
  if (role === 'Trucker' && r.isPreForecast) {
    return edoPayToOpenPath(r.newEdoId, 'pre-forecast');
  }
  return `/edo/${r.newEdoId}?from=renewals&tab=files`;
}

export function EdoRenewalsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';
  const { data: renewals = [], refetch } = useGetEdoRenewalsQuery(undefined, { pollingInterval: 30_000 });
  const [review] = useReviewEdoRenewalMutation();
  const [verifyPayment] = useVerifyEdoRenewalPaymentMutation();
  const [submitRenewalPayment] = useSubmitEdoRenewalPaymentMutation();
  const [generate] = useGenerateRenewedEdoMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isStaff = ['SlStaff', 'ShippingLinesAdmin'].includes(role);
  const isAccounting = role === 'Accounting';
  const isBroker = ['Broker', 'Consignee'].includes(role);
  const isTrucker = role === 'Trucker';

  const pending = renewals.filter((r) => r.status === 'PendingReview');
  const awaitingPayment = renewals.filter((r) => r.status === 'AwaitingPayment');
  const ready = renewals.filter((r) => r.status === 'ReadyForGeneration');
  const completed = renewals.filter((r) => r.status === 'Completed');
  const withRenewedEdo = renewals.filter((r) => r.newEdoId);

  const pageTitle = isTrucker ? 'My renewed eDO' : 'eDO Renewals';
  const pageSubtitle = isTrucker
    ? 'Pre-forecast empty-return renewals — open your renewed CRO/eDO once pay-to-open is complete.'
    : 'Review expired eDO renewals, verify detention payment, and generate renewed documents.';

  const stats = useMemo(
    () =>
      isTrucker
        ? [
            { label: 'Renewals', value: renewals.length, hint: 'Linked to your pre-forecast', tone: 'primary' as const },
            { label: 'Renewed issued', value: withRenewedEdo.length, hint: 'New CRO/eDO generated', tone: 'success' as const },
            { label: 'Completed', value: completed.length, hint: 'Ready to open/download', tone: 'info' as const },
          ]
        : [
            { label: 'All Requests', value: renewals.length, hint: 'Renewal queue', tone: 'primary' as const },
            { label: 'Pending Review', value: pending.length, hint: 'Staff decision required', tone: 'warning' as const },
            { label: 'Ready For Generation', value: ready.length, hint: 'Can be generated', tone: 'success' as const },
            { label: 'Completed', value: completed.length, hint: 'Renewed eDO issued', tone: 'info' as const },
          ],
    [isTrucker, renewals.length, withRenewedEdo.length, completed.length, pending.length, ready.length],
  );

  return (
    <WorkflowPage
      eyebrow={isTrucker ? 'Pre-forecast · Renewals' : 'Renewal Queue'}
      title={pageTitle}
      subtitle={pageSubtitle}
      chips={
        <>
          {!isTrucker && (
            <>
              <Chip size="small" color="warning" label={`${pending.length} pending`} />
              <Chip size="small" color="info" label={`${awaitingPayment.length} awaiting payment`} />
            </>
          )}
          <Chip size="small" color="success" label={`${completed.length} completed`} />
          {withRenewedEdo.length > 0 && (
            <Chip size="small" variant="outlined" label={`${withRenewedEdo.length} renewed issued`} color="secondary" />
          )}
        </>
      }
      stats={stats}
    >
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {isTrucker && completed.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Completed renewals below include your <strong>renewed CRO/eDO</strong> number. Use <strong>Open renewed eDO</strong>{' '}
          to download the PDF after pay-to-open is validated.
        </Alert>
      )}

      <WorkflowSection
        title={isTrucker ? 'My renewal records' : 'Renewal Requests'}
        subtitle={
          isTrucker
            ? 'Each row links the expired release to your new renewed document.'
            : 'Status-aware list of expired eDO renewal requests, including pre-forecast intake.'
        }
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Container</TableCell>
              <TableCell>Expired eDO</TableCell>
              <TableCell>Renewed eDO</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              {!isTrucker && <TableCell>Detention</TableCell>}
              {!isTrucker && <TableCell>Paid</TableCell>}
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renewals.length === 0 && (
              <TableRow>
                <TableCell colSpan={isTrucker ? 6 : 8}>
                  <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                    {isTrucker ? 'No renewed eDO records yet.' : 'No renewal requests yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {renewals.map((r) => {
              const edoLink = renewedEdoLink(r, role);
              return (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} fontFamily="monospace">
                      {r.containerNumber ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {r.expiredEdoNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {r.newEdoNumber ? (
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                          {r.newEdoNumber}
                        </Typography>
                        <RenewedEdoBadge variant="outlined" />
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not generated
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.isPreForecast ? (
                      <Chip size="small" label="Pre-forecast" color="secondary" variant="outlined" />
                    ) : (
                      <Chip size="small" label="Broker request" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} color={renewalStatusColor(r.status)} />
                  </TableCell>
                  {!isTrucker && (
                    <>
                      <TableCell>{r.detentionChargeAmount} PHP</TableCell>
                      <TableCell>{r.paymentVerified ? 'Yes' : 'No'}</TableCell>
                    </>
                  )}
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.75} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                      {r.newEdoId && edoLink && (
                        <TableActionButton label="Open renewed eDO" to={edoLink} />
                      )}
                      {isTrucker && r.preForecastSubmissionId && (
                        <TableActionButton label="Pre-forecast" to={preForecastDetailPath(r.preForecastSubmissionId)} />
                      )}
                      {isStaff && r.status === 'PendingReview' && (
                        <Button
                          size="small"
                          onClick={async () => {
                            try {
                              await review({ id: r.id, approve: true }).unwrap();
                              setMessage('Renewal approved');
                              refetch();
                            } catch (e: unknown) {
                              setError(
                                (e as { data?: { message?: string } })?.data?.message ?? 'Review failed',
                              );
                            }
                          }}
                        >
                          Approve
                        </Button>
                      )}
                      {isBroker && r.status === 'AwaitingPayment' && (
                        <Button size="small" component="label">
                          Pay detention
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                await submitRenewalPayment({
                                  id: r.id,
                                  amount: r.detentionChargeAmount,
                                  receipt: file,
                                }).unwrap();
                                setMessage('Detention receipt submitted for accounting validation');
                                refetch();
                              } catch (err: unknown) {
                                setError(
                                  (err as { data?: { message?: string } })?.data?.message ?? 'Payment submit failed',
                                );
                              }
                              e.target.value = '';
                            }}
                          />
                        </Button>
                      )}
                      {isAccounting && r.status === 'AwaitingPayment' && (
                        <Button
                          size="small"
                          onClick={async () => {
                            try {
                              await verifyPayment(r.id).unwrap();
                              setMessage('Detention payment verified');
                              refetch();
                            } catch (e: unknown) {
                              setError(
                                (e as { data?: { message?: string } })?.data?.message ?? 'Verify failed',
                              );
                            }
                          }}
                        >
                          Verify pay
                        </Button>
                      )}
                      {isStaff && r.status === 'ReadyForGeneration' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            try {
                              const edo = await generate(r.id).unwrap();
                              setMessage(`Renewed as ${edo.edoNumber}`);
                              refetch();
                            } catch (e: unknown) {
                              setError(
                                (e as { data?: { message?: string } })?.data?.message ?? 'Generate failed',
                              );
                            }
                          }}
                        >
                          Generate
                        </Button>
                      )}
                    </Stack>
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
