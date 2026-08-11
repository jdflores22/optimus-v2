import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import {
  useGetTerminalsQuery,
  useLazyVerifyTruckerPreForecastEdoQuery,
  useSubmitTruckerPreForecastMutation,
} from '../../app/api';
import type { TruckerPreForecastSearchResultDto, TruckerPreForecastSubmissionDto } from '../../shared/types';
import { CONTAINER_PHOTO_CATEGORIES } from '../../shared/containerPhotoCategories';
import { ContainerIdentityPhotoGrid } from './ContainerIdentityPhotoGrid';
import { CroEdoAttachPanel, type CroEdoAttachSuccess } from './CroEdoAttachPanel';
import { PreForecastProgressStrip, type PreForecastStep } from './PreForecastProgressStrip';
import { PreForecastSubmittedPanel } from './PreForecastSubmittedPanel';
import { VerifiedContainerDetailsCard } from './VerifiedContainerDetailsCard';

const STEPS = ['verify', 'return', 'photos', 'review'] as const;
type StepKey = (typeof STEPS)[number];

function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <CheckCircleOutlineIcon sx={{ fontSize: 18, color: done ? 'success.main' : 'action.disabled' }} />
      <Typography variant="body2" color={done ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
    </Stack>
  );
}

export function PreForecastTruckerFlow({ onSubmitted }: { onSubmitted?: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const [verificationToken, setVerificationToken] = useState('');
  const [verifiedMatch, setVerifiedMatch] = useState<TruckerPreForecastSearchResultDto | null>(null);
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [preferredTerminalId, setPreferredTerminalId] = useState('');
  const [releaseDoc, setReleaseDoc] = useState<File | null>(null);
  const [containerPhotos, setContainerPhotos] = useState<Partial<Record<string, File>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<TruckerPreForecastSubmissionDto | null>(null);

  const [verifyEdo] = useLazyVerifyTruckerPreForecastEdoQuery();
  const [submitPreForecast, { isLoading: pfSubmitting }] = useSubmitTruckerPreForecastMutation();
  const { data: terminals = [] } = useGetTerminalsQuery({ activeOnly: true });
  const cyTerminals = useMemo(
    () => terminals.filter((t) => t.identity === 'ContainerYard'),
    [terminals],
  );

  const verifyToken = useCallback(
    async (token: string) => verifyEdo(token).unwrap(),
    [verifyEdo],
  );

  const photoCount = CONTAINER_PHOTO_CATEGORIES.filter((c) => containerPhotos[c.field]).length;
  const allRequiredPhotos = photoCount === CONTAINER_PHOTO_CATEGORIES.length;
  const hasVerifiedEdo = Boolean(verificationToken && verifiedMatch);
  const hasRelease = Boolean(releaseDoc && returnDate);
  const readyToSubmit = hasVerifiedEdo && hasRelease && allRequiredPhotos;

  const isSubmitted = Boolean(submissionResult);
  const preferredTerminalName = useMemo(
    () => cyTerminals.find((t) => t.id === preferredTerminalId)?.name ?? null,
    [cyTerminals, preferredTerminalId],
  );

  const completionPct = useMemo(() => {
    if (isSubmitted) return 100;
    let score = 0;
    if (hasVerifiedEdo) score += 35;
    if (hasRelease) score += 25;
    if (allRequiredPhotos) score += 40;
    else score += Math.round((photoCount / CONTAINER_PHOTO_CATEGORIES.length) * 40);
    return score;
  }, [isSubmitted, hasVerifiedEdo, hasRelease, allRequiredPhotos, photoCount]);

  const progressSteps: PreForecastStep[] = useMemo(
    () => [
      {
        key: 'verify',
        label: 'CRO/eDO QR',
        detail: verifiedMatch?.containerNumber ?? 'Scan or upload document',
        state: hasVerifiedEdo || isSubmitted ? 'complete' : activeStep === 0 ? 'current' : 'upcoming',
      },
      {
        key: 'return',
        label: 'Return date',
        detail: returnDate,
        state: hasRelease || isSubmitted ? 'complete' : hasVerifiedEdo && activeStep === 1 ? 'current' : 'upcoming',
      },
      {
        key: 'photos',
        label: 'Photos',
        detail: isSubmitted
          ? `${CONTAINER_PHOTO_CATEGORIES.length}/${CONTAINER_PHOTO_CATEGORIES.length} identity views`
          : `${photoCount}/${CONTAINER_PHOTO_CATEGORIES.length} identity views`,
        state: allRequiredPhotos || isSubmitted ? 'complete' : activeStep === 2 ? 'current' : 'upcoming',
      },
      {
        key: 'review',
        label: 'Submit',
        detail: isSubmitted ? 'Submitted' : readyToSubmit ? 'Ready to send' : 'Complete steps above',
        state: isSubmitted ? 'complete' : readyToSubmit ? (activeStep === 3 ? 'current' : 'complete') : 'upcoming',
      },
    ],
    [verifiedMatch, hasVerifiedEdo, hasRelease, allRequiredPhotos, photoCount, activeStep, returnDate, readyToSubmit, isSubmitted],
  );

  const onCroLinked = (payload: CroEdoAttachSuccess) => {
    setVerificationToken(payload.token);
    setVerifiedMatch(payload.match);
    if (payload.file) setReleaseDoc(payload.file);
    setError(null);
    setActiveStep(1);
  };

  const onCroCleared = () => {
    setVerificationToken('');
    setVerifiedMatch(null);
    setReleaseDoc(null);
  };

  const handlePhotoChange = (field: string, file: File | null) => {
    setContainerPhotos((prev) => {
      const next = { ...prev };
      if (file) next[field] = file;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    if (!readyToSubmit || !releaseDoc || !verificationToken) return;
    try {
      const result = await submitPreForecast({
        verificationToken,
        returnDate: new Date(returnDate).toISOString(),
        preferredTerminalId: preferredTerminalId || undefined,
        releaseDocument: releaseDoc,
        containerPhotos,
      }).unwrap();
      setSubmissionResult(result);
      setActiveStep(3);
      onSubmitted?.();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Submit failed');
    }
  };

  const goToStep = (index: number) => {
    if (isSubmitted) return;
    if (index === 0) setActiveStep(0);
    else if (index === 1 && hasVerifiedEdo) setActiveStep(1);
    else if (index === 2 && hasVerifiedEdo) setActiveStep(2);
    else if (index === 3 && readyToSubmit) setActiveStep(3);
  };

  const resetFlow = () => {
    setActiveStep(0);
    setVerificationToken('');
    setVerifiedMatch(null);
    setReturnDate(new Date().toISOString().slice(0, 10));
    setPreferredTerminalId('');
    setReleaseDoc(null);
    setContainerPhotos({});
    setMessage(null);
    setError(null);
    setSubmissionResult(null);
  };

  const stepKey = STEPS[activeStep] as StepKey;

  return (
    <Stack spacing={2.5}>
      <PreForecastProgressStrip steps={progressSteps} onStepClick={goToStep} />

      <LinearProgress
        variant="determinate"
        value={completionPct}
        sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover' }}
      />

      {message && !isSubmitted && (
        <Alert severity={verifiedMatch?.estimatedDetention ? 'warning' : 'success'} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1fr 320px' }} gap={2.5} alignItems="start">
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box px={{ xs: 2, sm: 3 }} py={2.5} borderBottom={1} borderColor="divider">
            <Typography variant="h6" fontWeight={700}>
              {isSubmitted && 'Submission received'}
              {!isSubmitted && stepKey === 'verify' && 'Verify CRO/eDO document'}
              {!isSubmitted && stepKey === 'return' && 'Empty return date'}
              {!isSubmitted && stepKey === 'photos' && 'Container identity photos'}
              {!isSubmitted && stepKey === 'review' && 'Review & submit'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isSubmitted &&
                'Your intake is with the terminal team. You will be notified as CY assignment and billing progress.'}
              {!isSubmitted && stepKey === 'verify' &&
                'Upload the CRO/eDO PDF or photo — we read the QR and lock container details so nothing can be mistyped.'}
              {!isSubmitted && stepKey === 'return' && 'Confirm when the empty container was returned.'}
              {!isSubmitted && stepKey === 'photos' && 'Same 7 views as ICS — flooring and all sides in/out.'}
              {!isSubmitted && stepKey === 'review' && 'Container details came from the verified QR — confirm before sending.'}
            </Typography>
          </Box>

          <Box px={{ xs: 2, sm: 3 }} py={3}>
            {isSubmitted && submissionResult && (
              <PreForecastSubmittedPanel
                submission={submissionResult}
                verifiedMatch={verifiedMatch}
                returnDate={returnDate}
                releaseDocName={releaseDoc?.name}
                photoCount={photoCount}
                preferredTerminalName={preferredTerminalName}
                onStartAnother={resetFlow}
              />
            )}

            {!isSubmitted && stepKey === 'verify' && (
              <Stack spacing={2.5} maxWidth={560}>
                <CroEdoAttachPanel
                  onLinked={onCroLinked}
                  onCleared={onCroCleared}
                  verifyToken={verifyToken}
                />
                {hasVerifiedEdo && (
                  <Button variant="contained" onClick={() => setActiveStep(1)} sx={{ alignSelf: 'flex-start' }}>
                    Continue
                  </Button>
                )}
              </Stack>
            )}

            {!isSubmitted && stepKey === 'return' && (
              <Stack spacing={2.5} maxWidth={560}>
                {!hasVerifiedEdo && <Alert severity="warning">Verify your CRO/eDO document first.</Alert>}
                {verifiedMatch && <VerifiedContainerDetailsCard match={verifiedMatch} compact showSourceNote={false} />}
                <TextField
                  label="Empty return date"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={!hasVerifiedEdo}
                />
                <FormControl fullWidth disabled={!hasVerifiedEdo}>
                  <InputLabel shrink id="preferred-cy-label">
                    Preferred CY (optional)
                  </InputLabel>
                  <Select
                    labelId="preferred-cy-label"
                    label="Preferred CY (optional)"
                    displayEmpty
                    value={preferredTerminalId}
                    onChange={(e) => setPreferredTerminalId(e.target.value)}
                    notched
                  >
                    <MenuItem value="">
                      <em>No preference — terminal team will assign</em>
                    </MenuItem>
                    {cyTerminals.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                        {t.location ? ` · ${t.location}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  Your preference is optional. Terminal team assigns the CY with available allocation or slot; the CY
                  confirms the free-day schedule before detention is billed.
                </Typography>
                {!releaseDoc && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderStyle: 'dashed',
                      borderRadius: 2,
                      textAlign: 'center',
                    }}
                  >
                    <UploadFileOutlinedIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" mb={1.5}>
                      Attach the CRO/eDO release document (required if you verified by token only)
                    </Typography>
                    <Button variant="outlined" component="label" disabled={!hasVerifiedEdo}>
                      Choose file
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={(e) => setReleaseDoc(e.target.files?.[0] ?? null)}
                      />
                    </Button>
                  </Paper>
                )}
                {releaseDoc && (
                  <Typography variant="body2">
                    Release document: <strong>{releaseDoc.name}</strong>
                  </Typography>
                )}
                {verifiedMatch && verifiedMatch.estimatedDetention > 0 && (
                  <Alert severity="warning">
                    Past free time — est. detention ₱{verifiedMatch.estimatedDetention.toLocaleString()}. Broker and
                    consignee are notified to pay before a new CRO/eDO can be issued.
                  </Alert>
                )}
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button variant="contained" disabled={!hasVerifiedEdo || !releaseDoc} onClick={() => setActiveStep(2)}>
                    Continue to photos
                  </Button>
                </Stack>
              </Stack>
            )}

            {!isSubmitted && stepKey === 'photos' && (
              <Stack spacing={2.5}>
                {verifiedMatch && <VerifiedContainerDetailsCard match={verifiedMatch} compact showSourceNote={false} />}
                <ContainerIdentityPhotoGrid photos={containerPhotos} onChange={handlePhotoChange} />
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => setActiveStep(1)}>
                    Back
                  </Button>
                  <Button variant="contained" disabled={!allRequiredPhotos} onClick={() => setActiveStep(3)}>
                    Review submission
                  </Button>
                </Stack>
              </Stack>
            )}

            {!isSubmitted && stepKey === 'review' && (
              <Stack spacing={2.5} maxWidth={560}>
                {verifiedMatch && <VerifiedContainerDetailsCard match={verifiedMatch} showSourceNote={false} />}
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Return date
                  </Typography>
                  <Typography>{returnDate}</Typography>
                  <Divider />
                  <Typography variant="subtitle2" color="text.secondary">
                    Release document
                  </Typography>
                  <Typography>{releaseDoc?.name ?? '—'}</Typography>
                  <Divider />
                  <Typography variant="subtitle2" color="text.secondary">
                    Photos
                  </Typography>
                  <Typography>
                    {photoCount} of {CONTAINER_PHOTO_CATEGORIES.length} required views attached
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="outlined" onClick={() => setActiveStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={pfSubmitting || !readyToSubmit}
                    onClick={() => void handleSubmit()}
                  >
                    {pfSubmitting ? 'Submitting…' : 'Submit pre-forecast'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2.5,
            position: { lg: 'sticky' },
            top: { lg: 88 },
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            {isSubmitted ? 'Submitted' : 'Submission checklist'}
          </Typography>
          <Stack spacing={1.25} mb={2.5}>
            <ChecklistRow done={hasVerifiedEdo || isSubmitted} label="CRO/eDO verified by QR" />
            <ChecklistRow done={hasRelease || isSubmitted} label="Return date & release document" />
            <ChecklistRow
              done={allRequiredPhotos || isSubmitted}
              label={`${CONTAINER_PHOTO_CATEGORIES.length} identity photos`}
            />
            {isSubmitted && <ChecklistRow done label="Sent to terminal team" />}
          </Stack>
          <LinearProgress variant="determinate" value={completionPct} sx={{ mb: 1, height: 4, borderRadius: 2 }} />
          <Typography variant="caption" color="text.secondary">
            {completionPct}% complete
          </Typography>
          {verifiedMatch && (
            <Box mt={2.5} pt={2.5} borderTop={1} borderColor="divider">
              <VerifiedContainerDetailsCard match={verifiedMatch} compact showSourceNote={false} />
            </Box>
          )}
        </Paper>
      </Box>
    </Stack>
  );
}
