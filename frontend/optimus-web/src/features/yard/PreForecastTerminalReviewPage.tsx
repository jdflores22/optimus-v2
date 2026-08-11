import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import AnchorOutlinedIcon from '@mui/icons-material/AnchorOutlined';
import {
  useAssignTruckerIntakeTerminalMutation,
  useGetContainersQuery,
  useGetCyAllocationsQuery,
  useGetTerminalSlotsQuery,
  useGetTerminalsQuery,
  useGetTruckerIntakeSubmissionQuery,
  useGetUtilizationQuery,
} from '../../app/api';
import type { RootState } from '../../app/store';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { API_BASE_URL } from '../../shared/types';
import { useDefaultShippingLine } from '../../shared/useDefaultShippingLine';
import { AllocationReviewGrid } from './AllocationReviewCard';
import { buildContractAvailabilityCards, slotSummaryForDate } from './contractAvailabilityCards';
import { preForecastDetailPath } from './preForecastPaths';
import { preForecastStatusColor, preForecastStatusLabel } from './preForecastStatus';
import { PreForecastWorkflowTimeline } from './PreForecastWorkflowTimeline';

function assetUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function PreForecastTerminalReviewPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';
  const { shippingLineId } = useDefaultShippingLine();

  const { data: submission, isLoading, isError, refetch } = useGetTruckerIntakeSubmissionQuery(id, { skip: !id });

  useEffect(() => {
    if (role === 'SlStaff' && submission) {
      navigate(preForecastDetailPath(submission.id), { replace: true });
    }
  }, [role, submission, navigate]);
  const { data: terminals = [] } = useGetTerminalsQuery({ activeOnly: true });
  const { data: allocations = [] } = useGetCyAllocationsQuery(
    shippingLineId ? { shippingLineId, containerYardsOnly: false, activeTerminalsOnly: true } : undefined,
    { skip: !shippingLineId },
  );
  const { data: containers = [] } = useGetContainersQuery();
  const { data: utilization = [] } = useGetUtilizationQuery(
    shippingLineId ? { shippingLineId } : undefined,
    { skip: !shippingLineId },
  );

  const [assignTerminal] = useAssignTruckerIntakeTerminalMutation();
  const [selectedTerminalId, setSelectedTerminalId] = useState('');
  const [assignSlotId, setAssignSlotId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: slots = [] } = useGetTerminalSlotsQuery(selectedTerminalId, { skip: !selectedTerminalId });

  const cyCards = useMemo(
    () => buildContractAvailabilityCards(allocations, terminals, containers, utilization, 'cy'),
    [allocations, containers, terminals, utilization],
  );
  const portCards = useMemo(
    () => buildContractAvailabilityCards(allocations, terminals, containers, utilization, 'port'),
    [allocations, containers, terminals, utilization],
  );

  const selectedCy = cyCards.find((card) => card.terminalId === selectedTerminalId);

  const canAssign = submission?.status === 'PendingTerminalAssignment';
  const returnDay = submission?.returnDate.slice(0, 10) ?? '';
  const slotHint = selectedTerminalId && returnDay ? slotSummaryForDate(slots, returnDay) : null;
  const returnDateSlots = useMemo(
    () => slots.filter((slot) => slot.date.slice(0, 10) === returnDay),
    [returnDay, slots],
  );

  const preferredCard = cyCards.find(
    (card) =>
      card.terminalId === submission?.preferredTerminalId ||
      card.name === submission?.preferredTerminalName,
  );

  useEffect(() => {
    if (!submission || selectedTerminalId) return;
    const preferredId = submission.preferredTerminalId ?? preferredCard?.terminalId;
    if (preferredId) setSelectedTerminalId(preferredId);
  }, [submission, preferredCard?.terminalId, selectedTerminalId]);

  if (!id) {
    return <Alert severity="error">Missing submission id.</Alert>;
  }

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={420} />
      </Stack>
    );
  }

  if (isError || !submission) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Could not load this intake submission.</Alert>
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate('/pre-forecast')}>
          Back to queue
        </Button>
      </Stack>
    );
  }

  const onAssign = async () => {
    if (!selectedTerminalId) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await assignTerminal({
        id: submission.id,
        terminalId: selectedTerminalId,
        slotId: assignSlotId || undefined,
        notes: assignNotes || undefined,
      }).unwrap();
      setActionMessage('CY assigned — CY staff will confirm the return schedule.');
      refetch();
      setTimeout(() => navigate(preForecastDetailPath(submission.id)), 800);
    } catch (e: unknown) {
      setActionError(
        (e as { data?: { message?: string } })?.data?.message ??
          'Could not assign CY. Check your allocation and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkflowPage
      eyebrow="Terminal review"
      title={submission.containerNumber}
      subtitle={`${submission.expiredEdoNumber} · return ${returnDay}`}
      chips={
        <Chip
          size="small"
          label={preForecastStatusLabel(submission.status)}
          color={preForecastStatusColor(submission.status)}
          variant="filled"
          sx={{ fontWeight: 700 }}
        />
      }
      actions={
        <Stack direction="row" spacing={1}>
          <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate('/pre-forecast')} size="small" variant="outlined">
            Queue
          </Button>
          <Button
            component={RouterLink}
            to={preForecastDetailPath(submission.id)}
            size="small"
            endIcon={<OpenInNewOutlinedIcon />}
          >
            Full details
          </Button>
        </Stack>
      }
      stats={[
        {
          label: 'Return date',
          value: returnDay,
          hint: submission.cyConfirmedReturnDate ? `CY confirmed ${submission.cyConfirmedReturnDate.slice(0, 10)}` : 'Requested empty return',
          tone: 'primary',
        },
        {
          label: 'Trucker preference',
          value: submission.preferredTerminalName ?? 'No preference',
          hint: 'Preferred container yard',
          tone: submission.preferredTerminalName ? 'info' : 'default',
        },
        {
          label: 'Detention',
          value: submission.detentionAmount > 0 ? `₱${submission.detentionAmount.toLocaleString()}` : 'None yet',
          hint: submission.overdueDays > 0 ? `${submission.overdueDays} overdue days` : 'After CY confirmation',
          tone: submission.detentionAmount > 0 ? 'warning' : 'default',
        },
        {
          label: 'Photos',
          value: submission.photos.length,
          hint: 'Container identity views',
          tone: 'default',
        },
      ]}
    >
      {actionMessage && (
        <Alert severity="success" icon={<CheckCircleOutlineIcon />} onClose={() => setActionMessage(null)}>
          {actionMessage}
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {submission.message && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {submission.message}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          alignItems: 'start',
        }}
      >
        <WorkflowSection
          title="Intake summary"
          subtitle="QR-verified container and CRO/eDO details from the trucker submission."
        >
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Container
              </Typography>
              <Typography fontWeight={700}>{submission.containerNumber}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Expired CRO/eDO
              </Typography>
              <Typography fontWeight={700}>{submission.expiredEdoNumber}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Return date
              </Typography>
              <Typography fontWeight={600}>{returnDay}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Trucker
              </Typography>
              <Typography fontWeight={600}>{submission.truckerName ?? '—'}</Typography>
            </Box>
          </Box>

          {submission.photos.length > 0 && (
            <Box mt={2.5}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                Identity photos
              </Typography>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }} gap={1.25}>
                {submission.photos.map((photo) => (
                  <Box
                    key={photo.id}
                    component="a"
                    href={assetUrl(photo.filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <Box
                      component="img"
                      src={assetUrl(photo.filePath)}
                      alt={photo.label}
                      sx={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                    />
                    <Typography variant="caption" fontWeight={700} px={1} py={0.75} display="block">
                      {photo.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </WorkflowSection>

        <WorkflowSection title="Workflow status" subtitle="Progress after you assign a CY.">
          <PreForecastWorkflowTimeline submission={submission} />
        </WorkflowSection>
      </Box>

      <WorkflowSection
        title="TEU allocation contracts"
        subtitle="Review your shipping line contract capacity before assigning a container yard."
      >
        <Stack spacing={2.5}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.25}>
              <AnchorOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight={800}>
                Port terminals
              </Typography>
              <Chip size="small" label="Reference" variant="outlined" sx={{ height: 22 }} />
            </Stack>
            <AllocationReviewGrid cards={portCards} referenceOnly />
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.25}>
              <WarehouseOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight={800}>
                Container yards
              </Typography>
              {canAssign && <Chip size="small" label="Select one" color="primary" sx={{ height: 22 }} />}
            </Stack>
            {preferredCard && canAssign && (
              <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                Trucker preference: <strong>{preferredCard.name}</strong>
              </Alert>
            )}
            <AllocationReviewGrid
              cards={cyCards}
              selectedTerminalId={selectedTerminalId}
              preferredTerminalId={submission.preferredTerminalId}
              preferredTerminalName={submission.preferredTerminalName}
              selectable={canAssign}
              onSelect={(terminalId) => {
                setSelectedTerminalId(terminalId);
                setAssignSlotId('');
              }}
            />
          </Box>
        </Stack>
      </WorkflowSection>

      {canAssign && (
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography fontWeight={800} mb={0.5}>
            Confirm assignment
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Complete the assignment after selecting a CY with available contract capacity.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' },
              alignItems: 'start',
            }}
          >
            {selectedCy ? (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                  Selected CY
                </Typography>
                <Typography fontWeight={800}>{selectedCy.code}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {selectedCy.name} · {selectedCy.usedTeu}/{selectedCy.capacityTeu} TEU
                </Typography>
                <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={1}>
                  <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      20ft capacity
                    </Typography>
                    <Typography fontWeight={800}>
                      {selectedCy.allocated20} / {selectedCy.capacity20}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedCy.available20} available
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      40ft capacity
                    </Typography>
                    <Typography fontWeight={800}>
                      {selectedCy.allocated40} / {selectedCy.capacity40}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedCy.available40} available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Alert severity="warning">Select a container yard from the list above.</Alert>
            )}

            <Stack spacing={2}>
              {selectedTerminalId && returnDateSlots.length > 0 && (
                <FormControl fullWidth size="small">
                  <InputLabel id="review-assign-slot">Slot on return date</InputLabel>
                  <Select
                    labelId="review-assign-slot"
                    label="Slot on return date"
                    value={assignSlotId}
                    onChange={(e) => setAssignSlotId(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>No specific slot</em>
                    </MenuItem>
                    {returnDateSlots.map((slot) => (
                      <MenuItem key={slot.id} value={slot.id}>
                        {slot.date.slice(0, 10)} · {slot.assignedCount}/{slot.capacity} booked
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {slotHint && (
                <Typography variant="caption" color="text.secondary">
                  {slotHint}
                </Typography>
              )}

              <TextField
                label="Notes for CY"
                multiline
                minRows={2}
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                fullWidth
                size="small"
              />

              <Button
                variant="contained"
                size="large"
                disabled={!selectedTerminalId || submitting}
                onClick={onAssign}
              >
                {submitting ? 'Assigning…' : 'Confirm CY assignment'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </WorkflowPage>
  );
}
