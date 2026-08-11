import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  useGetActivePaymentFeeQuery,
  useGetPaymentFeesQuery,
  useUpsertPaymentFeeMutation,
} from '../../app/api';
import { DEFAULT_DETENTION_RATE, formatPhp, formatWhen } from '../../shared/paymentFees';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const FEE_TYPE = 'detention' as const;
const FEE_LABEL = 'Detention rate (per day)';

export function DetentionRateAdminPage() {
  const { data: allFees = [], refetch: refetchAll } = useGetPaymentFeesQuery();
  const { data: activeFee, refetch: refetchActive } = useGetActivePaymentFeeQuery(FEE_TYPE);
  const [upsertFee, { isLoading: saving }] = useUpsertPaymentFeeMutation();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  const history = useMemo(
    () => allFees.filter((f) => f.feeType === FEE_TYPE),
    [allFees],
  );

  useEffect(() => {
    setAmountInput(activeFee?.amount != null ? String(activeFee.amount) : String(DEFAULT_DETENTION_RATE));
  }, [activeFee?.amount]);

  const stats = useMemo(
    () => ({
      activeAmount: activeFee?.amount ?? DEFAULT_DETENTION_RATE,
      historyCount: history.length,
    }),
    [activeFee?.amount, history.length],
  );

  const onSaveFee = async () => {
    const value = Number(amountInput);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }
    try {
      await upsertFee({ feeType: FEE_TYPE, amount: value }).unwrap();
      setMessage(`${FEE_LABEL} updated to ${formatPhp(value)}/day`);
      setError(null);
      setFeeDialogOpen(false);
      refetchAll();
      refetchActive();
    } catch {
      setError('Could not save detention rate.');
    }
  };

  return (
    <WorkflowPage
      eyebrow="Shipping line billing"
      title="Detention Rate"
      subtitle="Set the daily detention charge used for pre-forecast billing and eDO renewals. Applies to new calculations only."
      stats={[
        { label: 'Active rate', value: `${formatPhp(stats.activeAmount)}/day`, tone: 'primary' },
        { label: 'History', value: stats.historyCount, hint: FEE_LABEL, tone: 'info' },
      ]}
    >
      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
          alignItems: 'start',
        }}
      >
        <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
            Current rate
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Charged per calendar day after free time expires.
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            color="primary.main"
            sx={{ fontVariantNumeric: 'tabular-nums', mb: 2 }}
          >
            {formatPhp(activeFee?.amount ?? DEFAULT_DETENTION_RATE)}
            <Typography component="span" variant="h5" color="text.secondary" fontWeight={600}>
              {' '}
              / day
            </Typography>
          </Typography>
          <Button
            fullWidth
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => setFeeDialogOpen(true)}
          >
            Update rate
          </Button>
        </Paper>

        <WorkflowSection
          title="Configuration history"
          subtitle="All changes to the shipping line detention rate"
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Previous</TableCell>
                <TableCell>New rate</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                      No configuration history yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                history.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2">{formatWhen(row.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      {row.previousAmount != null ? (
                        <Typography variant="body2" color="text.secondary">
                          {formatPhp(row.previousAmount)}/day
                        </Typography>
                      ) : (
                        <Chip size="small" label="Initial" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPhp(row.amount)}/day
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.isActive ? 'Active' : 'Superseded'}
                        color={row.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </WorkflowSection>
      </Box>

      <Dialog open={feeDialogOpen} onClose={() => setFeeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update detention rate</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              autoFocus
              fullWidth
              type="number"
              label="Rate per day (PHP)"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              inputProps={{ min: 0.01, step: 0.01 }}
              size="small"
            />
            <Alert severity="warning">
              This change applies to new pre-forecast and renewal calculations. Amounts already stored on
              in-progress submissions are not recalculated automatically.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setFeeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSaveFee} disabled={saving}>
            {saving ? 'Saving…' : 'Update rate'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
