import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import {
  useGenerateRenewedEdoMutation,
  useGetEdoRenewalsQuery,
  useReviewEdoRenewalMutation,
} from '../../app/api';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import { RenewedEdoBadge } from '../edo/RenewedEdoBadge';
import { WorkflowSection } from '../shared/WorkflowPage';

type Props = {
  submission: TruckerPreForecastSubmissionDto;
  onUpdated?: () => void;
};

export function PreForecastSlStaffRenewalPanel({ submission, onUpdated }: Props) {
  const { data: renewals = [], refetch: refetchRenewals } = useGetEdoRenewalsQuery();
  const [review, { isLoading: reviewing }] = useReviewEdoRenewalMutation();
  const [generate, { isLoading: generating }] = useGenerateRenewedEdoMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const renewal = useMemo(
    () =>
      submission.renewalRequestId
        ? renewals.find((r) => r.id === submission.renewalRequestId)
        : undefined,
    [renewals, submission.renewalRequestId],
  );

  const busy = reviewing || generating;

  if (submission.status === 'AwaitingRenewalPayment' && submission.newEdoId) {
    return (
      <WorkflowSection
        title="Renewed CRO/eDO issued"
        subtitle="Pay-to-open applies — the trucker who submitted the pre-forecast must pay before the document can be opened."
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <RenewedEdoBadge />
              <Chip size="small" color="info" label="Awaiting pay-to-open" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              You generated <strong>{submission.newEdoNumber ?? 'the renewed release'}</strong> to replace expired{' '}
              <strong>{submission.expiredEdoNumber}</strong>. The assigned trucker must pay the eDO access fee and
              accounting must validate before download is unlocked.
            </Typography>
            <Button
              component={RouterLink}
              to={`/edo/${submission.newEdoId}?from=pre-forecast`}
              variant="outlined"
              endIcon={<OpenInNewOutlinedIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              View renewed CRO/eDO
            </Button>
          </Stack>
        </Paper>
      </WorkflowSection>
    );
  }

  if (submission.status !== 'PendingReview') {
    return null;
  }

  const handleApprove = async () => {
    if (!renewal) return;
    setError(null);
    try {
      await review({ id: renewal.id, approve: true }).unwrap();
      setMessage('Renewal approved — you can now generate the new CRO/eDO.');
      await refetchRenewals();
      onUpdated?.();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Approval failed');
    }
  };

  const handleGenerate = async () => {
    if (!renewal) return;
    setError(null);
    try {
      const edo = await generate(renewal.id).unwrap();
      setMessage(`Renewed eDO ${edo.edoNumber} generated. The trucker pays to open the document after you issue it.`);
      setConfirmOpen(false);
      await refetchRenewals();
      onUpdated?.();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Generation failed');
    }
  };

  return (
    <WorkflowSection
      title="Generate renewed CRO/eDO"
      subtitle="Accounting validated detention payment — issue a new release for the expired document."
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: 2,
          border: 1,
          borderColor: 'primary.main',
          bgcolor: (theme) => `${theme.palette.primary.main}08`,
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <DescriptionOutlinedIcon color="primary" />
            <Box minWidth={0} flex={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mb={0.5}>
                <Typography fontWeight={800}>Expired {submission.expiredEdoNumber}</Typography>
                <RenewedEdoBadge variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Container {submission.containerNumber}
                {submission.detentionAmount > 0
                  ? ` · detention ₱${submission.detentionAmount.toLocaleString()} verified`
                  : ' · no detention billing'}
              </Typography>
            </Box>
          </Stack>

          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          {!submission.renewalRequestId && (
            <Alert severity="warning">
              No renewal request is linked to this pre-forecast yet. Ask accounting to finalize detention billing
              first.
            </Alert>
          )}

          {renewal && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Chip size="small" label={`Renewal: ${renewal.status}`} color="warning" variant="outlined" />
              {renewal.paymentVerified && (
                <Chip size="small" label="Detention verified" color="success" variant="outlined" />
              )}
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {renewal?.status === 'PendingReview' && (
              <Button variant="outlined" disabled={busy} onClick={() => void handleApprove()}>
                Approve renewal
              </Button>
            )}
            {renewal?.status === 'ReadyForGeneration' && (
              <Button variant="contained" disabled={busy} onClick={() => setConfirmOpen(true)}>
                Generate new CRO/eDO
              </Button>
            )}
            {renewal?.status === 'AwaitingPayment' && (
              <Alert severity="info" sx={{ flex: 1 }}>
                Detention payment is still awaiting accounting validation before you can generate the renewed
                document.
              </Alert>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate renewed CRO/eDO?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              This will issue a <strong>new renewed eDO</strong> for container{' '}
              <strong>{submission.containerNumber}</strong>, replacing the expired release below.
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                Expired document
              </Typography>
              <Typography fontWeight={800}>{submission.expiredEdoNumber}</Typography>
              {submission.cyConfirmedReturnDate && (
                <>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mt={1}>
                    CY confirmed return
                  </Typography>
                  <Typography fontWeight={700}>{submission.cyConfirmedReturnDate.slice(0, 10)}</Typography>
                </>
              )}
              {submission.detentionAmount > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mt={1}>
                    Detention verified
                  </Typography>
                  <Typography fontWeight={700}>₱{submission.detentionAmount.toLocaleString()}</Typography>
                </>
              )}
            </Paper>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <RenewedEdoBadge variant="outlined" />
              <Typography variant="body2" color="text.secondary">
                Pay-to-open applies on the new document after generation.
              </Typography>
            </Stack>
            <Alert severity="warning" variant="outlined">
              Please review carefully — the expired CRO/eDO will be superseded and this action cannot be undone from
              this screen.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={busy} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={busy} onClick={() => void handleGenerate()}>
            {busy ? 'Generating…' : 'Yes, generate renewed eDO'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowSection>
  );
}
