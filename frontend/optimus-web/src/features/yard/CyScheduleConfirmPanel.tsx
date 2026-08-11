import { useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import { useConfirmTruckerIntakeCyScheduleMutation } from '../../app/api';
import { PreForecastCyActionSuccessDialog } from './PreForecastCyActionSuccessDialog';

type Props = {
  submission: TruckerPreForecastSubmissionDto;
  onConfirmed?: (message: string) => void;
  onBackToQueue?: () => void;
  compact?: boolean;
};

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function dayDelta(preferred: string, confirmed: string) {
  const a = new Date(`${preferred}T00:00:00`);
  const b = new Date(`${confirmed}T00:00:00`);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

export function CyScheduleConfirmPanel({ submission, onConfirmed, onBackToQueue, compact }: Props) {
  const [confirmCy, { isLoading }] = useConfirmTruckerIntakeCyScheduleMutation();
  const truckerDate = formatDate(submission.truckerPreferredReturnDate ?? submission.returnDate);
  const [cyDate, setCyDate] = useState(truckerDate);
  const [cyNotes, setCyNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successVariant, setSuccessVariant] = useState<'confirmed' | 'declined'>('confirmed');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<'approve' | 'decline' | null>(null);

  const scheduleDeltaDays = useMemo(() => dayDelta(truckerDate, cyDate), [truckerDate, cyDate]);
  const depotName = submission.assignedTerminalName ?? 'your depot';
  const shippingLineLabel = submission.shippingLineBrandName?.trim() || 'the shipping line';

  const submit = async (approve: boolean) => {
    setError(null);
    try {
      await confirmCy({
        id: submission.id,
        confirmedReturnDate: cyDate,
        approve,
        notes: cyNotes || undefined,
      }).unwrap();

      const message = approve
        ? scheduleDeltaDays > 0
          ? `Return confirmed for ${cyDate} — ${scheduleDeltaDays} day${scheduleDeltaDays === 1 ? '' : 's'} after the trucker requested. The trucker and ${shippingLineLabel} will see this schedule.`
          : `Return confirmed for ${cyDate}. The trucker and ${shippingLineLabel} will see this schedule.`
        : `This empty return was declined — ${shippingLineLabel} will be notified.`;

      setSuccessVariant(approve ? 'confirmed' : 'declined');
      setSuccessMessage(message);
      setSuccessOpen(true);
      setConfirmDialog(null);
      onConfirmed?.(message);
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Could not save schedule confirmation.');
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          p: compact ? 2 : 2.5,
          borderRadius: 2,
          border: 2,
          borderColor: 'primary.main',
          bgcolor: (theme) => `${theme.palette.primary.main}08`,
        }}
      >
        <Backdrop
          open={isLoading}
          sx={{
            position: 'absolute',
            zIndex: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.72)',
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <CircularProgress size={36} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Saving schedule…
            </Typography>
          </Stack>
        </Backdrop>

        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <EventAvailableOutlinedIcon color="primary" />
          <Typography fontWeight={800}>Confirm depot free day</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Terminal team assigned this empty return to <strong>{depotName}</strong>. The trucker requested{' '}
          <strong>{truckerDate}</strong> — pick the next day your yard can accept the container if that date is full.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: compact ? '1fr' : '1fr 1fr' },
            mb: 2,
          }}
        >
          <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
              <CalendarTodayOutlinedIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Trucker preferred date
              </Typography>
            </Stack>
            <Typography variant="h6" fontWeight={800}>
              {truckerDate}
            </Typography>
            {submission.preferredTerminalName && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Preferred CY: {submission.preferredTerminalName}
              </Typography>
            )}
          </Paper>

          {!compact && (
            <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: 'background.paper' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.75}>
                Container
              </Typography>
              <Typography fontWeight={800}>{submission.containerNumber}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {submission.expiredEdoNumber}
              </Typography>
            </Paper>
          )}
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Your confirmed return date"
            type="date"
            value={cyDate}
            onChange={(e) => setCyDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={isLoading}
            helperText={
              scheduleDeltaDays > 0
                ? `${scheduleDeltaDays} day${scheduleDeltaDays === 1 ? '' : 's'} later than the trucker requested.`
                : 'Pick the day your depot can receive this empty.'
            }
          />

          {scheduleDeltaDays > 0 && (
            <Alert severity="info" variant="outlined">
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mb={0.75}>
                <Typography variant="body2" fontWeight={600}>
                  Later than requested:
                </Typography>
                <Chip size="small" color="primary" variant="outlined" label={`${truckerDate} → ${cyDate}`} />
                <Chip size="small" label={`+${scheduleDeltaDays} day${scheduleDeltaDays === 1 ? '' : 's'}`} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                The trucker and <strong>{shippingLineLabel}</strong> will see this updated return date from your depot.
                No reason required — just confirm when your yard can accept the container.
              </Typography>
            </Alert>
          )}

          <TextField
            label="Notes for shipping line and trucker (optional)"
            multiline
            minRows={2}
            value={cyNotes}
            onChange={(e) => setCyNotes(e.target.value)}
            fullWidth
            disabled={isLoading}
            placeholder="e.g. yard at capacity on the preferred date"
            helperText={`Optional — only if you want to add context for the trucker or ${shippingLineLabel}.`}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
          <Button
            color="error"
            variant="outlined"
            disabled={isLoading}
            onClick={() => setConfirmDialog('decline')}
          >
            Decline — not available
          </Button>
          <Button
            variant="contained"
            disabled={isLoading || !cyDate}
            onClick={() => setConfirmDialog('approve')}
          >
            {scheduleDeltaDays > 0 ? `Confirm ${cyDate}` : 'Confirm this date'}
          </Button>
        </Stack>
      </Paper>

      <Dialog
        open={confirmDialog !== null}
        onClose={() => !isLoading && setConfirmDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog === 'approve' ? 'Confirm return date?' : 'Decline this empty return?'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              Container <strong>{submission.containerNumber}</strong> · {submission.expiredEdoNumber}
            </Typography>

            {confirmDialog === 'approve' ? (
              <>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                    Trucker preferred
                  </Typography>
                  <Typography fontWeight={800}>{truckerDate}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mt={1}>
                    Your confirmed date
                  </Typography>
                  <Typography fontWeight={800} color="primary.main">
                    {cyDate}
                  </Typography>
                  {scheduleDeltaDays > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      label={`+${scheduleDeltaDays} day${scheduleDeltaDays === 1 ? '' : 's'} later`}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Paper>
                <Alert severity="info" variant="outlined">
                  The trucker and <strong>{shippingLineLabel}</strong> will be notified of this return date. Please
                  review before submitting — this cannot be changed here after you confirm.
                </Alert>
              </>
            ) : (
              <Alert severity="warning" variant="outlined">
                This tells {shippingLineLabel} your depot cannot accept this empty on the requested schedule. Only
                decline if you are sure — accidental declines delay the trucker&apos;s return.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={isLoading} onClick={() => setConfirmDialog(null)}>
            Go back
          </Button>
          <Button
            variant="contained"
            color={confirmDialog === 'decline' ? 'error' : 'primary'}
            disabled={isLoading}
            onClick={() => void submit(confirmDialog === 'approve')}
          >
            {isLoading
              ? 'Saving…'
              : confirmDialog === 'approve'
                ? `Yes, confirm ${cyDate}`
                : 'Yes, decline'}
          </Button>
        </DialogActions>
      </Dialog>

      <PreForecastCyActionSuccessDialog
        open={successOpen}
        variant={successVariant}
        title={successVariant === 'confirmed' ? 'Return date confirmed' : 'Return declined'}
        message={successMessage}
        containerNumber={submission.containerNumber}
        confirmedDate={successVariant === 'confirmed' ? cyDate : undefined}
        onClose={() => setSuccessOpen(false)}
        onBackToQueue={onBackToQueue}
      />
    </>
  );
}
