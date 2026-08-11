import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useGetTruckerIntakeSubmissionsQuery } from '../../app/api';
import type { RootState } from '../../app/store';
import { TABLE_ACTIONS_HEADER, TableActionButton, TableViewLink } from '../shared/TableViewLink';
import { filterPreForecastQueue } from './preForecastIntakeFilters';
import { preForecastBillingPath, preForecastDetailPath } from './preForecastPaths';
import { preForecastQueueStatusColor, preForecastQueueStatusLabel } from './preForecastStatus';
import { useSelector } from 'react-redux';

type Props = {
  onMessage?: (msg: string) => void;
};

export function PreForecastIntakeQueue(_props: Props) {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';
  const isTerminalOps = ['TerminalTeam', 'ShippingLinesAdmin'].includes(role);
  const isSlStaff = role === 'SlStaff';
  const isCy = role === 'CyStaff';
  const isAccounting = role === 'Accounting' || role === 'SystemAdmin';

  const { data: list = [] } = useGetTruckerIntakeSubmissionsQuery(undefined);

  const visible = filterPreForecastQueue(list, role);

  const accountingBillingStatuses = ['PendingAccountingReview', 'AwaitingDetentionPayment'] as const;

  const canAccountingViewBilling = (status: string) =>
    accountingBillingStatuses.includes(status as (typeof accountingBillingStatuses)[number]);

  const rowNavigate = (row: { id: string; status: string }) => {
    if (isSlStaff) {
      navigate(preForecastDetailPath(row.id));
      return;
    }
    if (isTerminalOps) {
      navigate(`/pre-forecast/submissions/${row.id}/review`);
      return;
    }
    if (isCy) {
      navigate(preForecastDetailPath(row.id));
      return;
    }
    if (isAccounting && canAccountingViewBilling(row.status)) {
      navigate(preForecastBillingPath(row.id));
    }
  };

  if (visible.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Intake queue is clear
        </Typography>
        <Typography color="text.secondary">
          {isSlStaff
            ? 'Pre-forecasts ready for renewed CRO/eDO generation appear here after accounting validates detention payment.'
            : 'Trucker QR-verified pre-forecast submissions will appear here for your role.'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        {isSlStaff ? 'Renewed CRO/eDO queue' : 'Pre-forecast intake queue'}
      </Typography>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Container</TableCell>
                <TableCell>CRO/eDO</TableCell>
                <TableCell>Return date</TableCell>
                <TableCell>CY</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: isTerminalOps || isSlStaff || isCy || isAccounting ? 'pointer' : 'default' }}
                  onClick={() => rowNavigate(row)}
                >
                  <TableCell>
                    <Typography fontWeight={700}>{row.containerNumber}</Typography>
                    {row.preferredTerminalName && (
                      <Typography variant="caption" color="text.secondary">
                        Pref: {row.preferredTerminalName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{row.expiredEdoNumber}</TableCell>
                  <TableCell>
                    {row.returnDate.slice(0, 10)}
                    {(row.scheduleDeltaDays ?? 0) > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={`CY +${row.scheduleDeltaDays}d`}
                        sx={{ ml: 0.75 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{row.assignedTerminalName ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={preForecastQueueStatusLabel(row.status, row.detentionPaymentReceiptSubmitted)}
                      color={preForecastQueueStatusColor(row.status, row.detentionPaymentReceiptSubmitted)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    {isAccounting && canAccountingViewBilling(row.status) ? (
                      row.detentionPaymentReceiptSubmitted ? (
                        <TableActionButton label="Validate" to={preForecastBillingPath(row.id)} color="success" />
                      ) : (
                        <TableViewLink to={preForecastBillingPath(row.id)} />
                      )
                    ) : (
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                        {isSlStaff && row.status === 'PendingReview' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(preForecastDetailPath(row.id))}
                          >
                            Generate CRO/eDO
                          </Button>
                        )}
                        {isTerminalOps && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/pre-forecast/submissions/${row.id}/review`)}
                          >
                            Review
                          </Button>
                        )}
                        {isTerminalOps && row.status === 'PendingTerminalAssignment' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/pre-forecast/submissions/${row.id}/review`)}
                          >
                            Assign CY
                          </Button>
                        )}
                        {isCy && row.status === 'PendingCySchedule' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(preForecastDetailPath(row.id))}
                          >
                            Confirm return date
                          </Button>
                        )}
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {visible.map((row) => (
          <Paper key={row.id} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                <Box>
                  <Typography fontWeight={800}>{row.containerNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.expiredEdoNumber}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={preForecastQueueStatusLabel(row.status, row.detentionPaymentReceiptSubmitted)}
                  color={preForecastQueueStatusColor(row.status, row.detentionPaymentReceiptSubmitted)}
                  variant="outlined"
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Return {row.returnDate.slice(0, 10)}
                {row.preferredTerminalName ? ` · pref. ${row.preferredTerminalName}` : ''}
              </Typography>
              <Stack direction="row" spacing={1}>
                {isAccounting && canAccountingViewBilling(row.status) ? (
                  row.detentionPaymentReceiptSubmitted ? (
                    <TableActionButton label="Validate" to={preForecastBillingPath(row.id)} color="success" />
                  ) : (
                    <TableViewLink to={preForecastBillingPath(row.id)} />
                  )
                ) : (
                  <>
                    {isSlStaff && row.status === 'PendingReview' && (
                      <Button size="small" variant="contained" onClick={() => navigate(preForecastDetailPath(row.id))}>
                        Generate CRO/eDO
                      </Button>
                    )}
                    {isTerminalOps && (
                      <Button size="small" variant="outlined" onClick={() => navigate(`/pre-forecast/submissions/${row.id}/review`)}>
                        Review
                      </Button>
                    )}
                    {isCy && row.status === 'PendingCySchedule' && (
                      <Button size="small" variant="contained" onClick={() => navigate(preForecastDetailPath(row.id))}>
                        Confirm return date
                      </Button>
                    )}
                    {isTerminalOps && row.status === 'PendingTerminalAssignment' && (
                      <Button size="small" variant="contained" onClick={() => navigate(`/pre-forecast/submissions/${row.id}/review`)}>
                        Assign CY
                      </Button>
                    )}
                  </>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
