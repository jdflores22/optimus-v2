import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import { useFinalizeTruckerIntakeAccountingMutation } from '../../app/api';

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

type Props = {
  submission: TruckerPreForecastSubmissionDto;
  onFinalized?: (message: string) => void;
  layout?: 'page' | 'compact';
};

export function PreForecastAccountingPanel({ submission, onFinalized, layout = 'page' }: Props) {
  const [finalizeAccounting, { isLoading }] = useFinalizeTruckerIntakeAccountingMutation();
  const [acctAmount, setAcctAmount] = useState('');
  const [acctNotes, setAcctNotes] = useState('');
  const [waiveExtraDays, setWaiveExtraDays] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const truckerPreferred = formatDate(submission.truckerPreferredReturnDate ?? submission.returnDate);
  const cyConfirmed = submission.cyConfirmedReturnDate
    ? formatDate(submission.cyConfirmedReturnDate)
    : formatDate(submission.returnDate);

  const hasScheduleDelta = (submission.scheduleDeltaDays ?? 0) > 0;
  const extraDetention = submission.extraDaysDetentionAmount ?? 0;
  const baseDetention = submission.detentionAtPreferredDate ?? 0;
  const canFinalize = submission.status === 'PendingAccountingReview';

  const effectiveAmount = useMemo(() => {
    if (waiveExtraDays && hasScheduleDelta) {
      return baseDetention;
    }
    return submission.detentionAmount;
  }, [submission.detentionAmount, waiveExtraDays, hasScheduleDelta, baseDetention]);

  useEffect(() => {
    setAcctAmount(String(submission.detentionAmount));
    setAcctNotes('');
    setWaiveExtraDays(false);
    setError(null);
  }, [submission.id, submission.detentionAmount]);

  useEffect(() => {
    if (waiveExtraDays && hasScheduleDelta) {
      setAcctAmount(String(baseDetention));
    } else {
      setAcctAmount(String(submission.detentionAmount));
    }
  }, [waiveExtraDays, hasScheduleDelta, baseDetention, submission.detentionAmount]);

  const submit = async () => {
    setError(null);
    try {
      await finalizeAccounting({
        id: submission.id,
        adjustedDetentionAmount: acctAmount ? Number(acctAmount) : undefined,
        waiveExtraDays: waiveExtraDays && hasScheduleDelta ? true : undefined,
        notes: acctNotes || undefined,
      }).unwrap();
      onFinalized?.('Detention billing finalized — broker/consignee will be notified.');
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Could not finalize billing.');
    }
  };

  return (
    <Stack spacing={2.5}>
      {layout === 'page' && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Review detention after CY confirmed the empty return schedule.
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} gap={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Container yard
              </Typography>
              <Typography fontWeight={700}>{submission.assignedTerminalName ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Trucker preferred
              </Typography>
              <Typography fontWeight={700}>{truckerPreferred}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                CY confirmed
              </Typography>
              <Typography fontWeight={700}>{cyConfirmed}</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {hasScheduleDelta && (
        <Alert
          severity="warning"
          icon={<WarningAmberOutlinedIcon />}
          sx={{
            border: 1,
            borderColor: 'warning.main',
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>
            CY date differs from trucker preference
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.5} mb={1.5}>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'background.paper' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                Trucker preferred
              </Typography>
              <Typography fontWeight={800}>{truckerPreferred}</Typography>
              <Typography variant="caption" color="text.secondary">
                Base detention ₱{baseDetention.toLocaleString()}
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: (theme) => `${theme.palette.warning.main}14`,
                borderColor: 'warning.main',
              }}
            >
              <Typography variant="caption" color="warning.dark" fontWeight={700} display="block">
                CY confirmed
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography fontWeight={800} color="warning.dark">
                  {cyConfirmed}
                </Typography>
                <Chip
                  size="small"
                  color="warning"
                  label={`+${submission.scheduleDeltaDays} day${submission.scheduleDeltaDays === 1 ? '' : 's'}`}
                />
              </Stack>
              <Typography variant="caption" color="warning.dark">
                Extra detention ₱{extraDetention.toLocaleString()}
              </Typography>
            </Paper>
          </Box>
          <Typography variant="body2">
            The broker pays detention based on the return date. You may waive the extra amount if the delay was caused
            by CY availability — not the trucker.
          </Typography>
        </Alert>
      )}

      {hasScheduleDelta && canFinalize && (
        <FormControlLabel
          control={
            <Switch
              checked={waiveExtraDays}
              onChange={(e) => setWaiveExtraDays(e.target.checked)}
              color="warning"
              disabled={!canFinalize || isLoading}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={700}>
                Waive extra days (CY schedule change)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bill only trucker-preferred detention (₱{baseDetention.toLocaleString()}) — waives ₱
                {extraDetention.toLocaleString()}
              </Typography>
            </Box>
          }
        />
      )}

      <TextField
        label="Detention amount (PHP)"
        type="number"
        value={acctAmount}
        onChange={(e) => setAcctAmount(e.target.value)}
        fullWidth
        disabled={!canFinalize || isLoading}
        helperText={
          waiveExtraDays && hasScheduleDelta
            ? `Waiving CY extra days — billing ₱${effectiveAmount.toLocaleString()} instead of ₱${submission.detentionAmount.toLocaleString()}.`
            : 'Confirm or manually adjust the amount billed to broker/consignee.'
        }
      />
      <TextField
        label="Billing notes"
        multiline
        minRows={3}
        value={acctNotes}
        onChange={(e) => setAcctNotes(e.target.value)}
        fullWidth
        disabled={!canFinalize || isLoading}
      />

      {!hasScheduleDelta && (
        <Alert severity="info" variant="outlined">
          CY confirmed the trucker&apos;s preferred return date — no schedule adjustment to review.
        </Alert>
      )}

      <Alert severity="warning" variant="outlined">
        After finalize, broker/consignee pays detention; accounting validates receipt; then shipping line staff
        generate the new CRO/eDO (pay-to-open).
      </Alert>

      {canFinalize && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
          <Button variant="contained" disabled={isLoading} onClick={() => void submit()}>
            {isLoading ? 'Saving…' : 'Finalize & bill broker/consignee'}
          </Button>
        </Stack>
      )}

      {!canFinalize && (
        <Alert severity="success" variant="outlined">
          Detention billing was already finalized for this submission.
        </Alert>
      )}
    </Stack>
  );
}
