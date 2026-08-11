import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import type { TruckerPreForecastSearchResultDto } from '../../shared/types';
import { extractEdoTokenFromFile, extractEdoTokenFromText } from '../../shared/edoDocumentQr';
import { VerifiedContainerDetailsCard } from './VerifiedContainerDetailsCard';

export type CroEdoAttachSuccess = {
  token: string;
  file: File | null;
  match: TruckerPreForecastSearchResultDto;
};

type Props = {
  onLinked: (payload: CroEdoAttachSuccess) => void;
  onCleared: () => void;
  verifyToken: (token: string) => Promise<{ valid: boolean; message: string; verificationToken?: string | null; match?: TruckerPreForecastSearchResultDto | null }>;
  disabled?: boolean;
};

export function CroEdoAttachPanel({ onLinked, onCleared, verifyToken, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [linked, setLinked] = useState<CroEdoAttachSuccess | null>(null);
  const [pasteToken, setPasteToken] = useState('');

  const reset = () => {
    setError('');
    setFileName('');
    setLinked(null);
    setPasteToken('');
    onCleared();
  };

  const applyVerified = (token: string, file: File | null, match: TruckerPreForecastSearchResultDto) => {
    const payload: CroEdoAttachSuccess = { token, file, match };
    setLinked(payload);
    onLinked(payload);
  };

  const runVerify = async (rawToken: string, file: File | null) => {
    setBusy(true);
    setError('');
    try {
      const result = await verifyToken(rawToken);
      if (!result.valid || !result.match || !result.verificationToken) {
        setError(result.message || 'CRO/eDO could not be verified.');
        setLinked(null);
        onCleared();
        return;
      }
      applyVerified(result.verificationToken, file, result.match);
    } catch {
      setError('Unable to verify this CRO/eDO. Check your connection and try again.');
      setLinked(null);
      onCleared();
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setFileName(file.name);
    try {
      const decoded = await extractEdoTokenFromFile(file);
      if (!decoded) {
        setError('Could not read a QR code from that file. Use a clear photo or PDF showing the CRO/eDO QR.');
        onCleared();
        return;
      }
      await runVerify(decoded, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read CRO/eDO file.');
      onCleared();
    } finally {
      setBusy(false);
    }
  };

  const onPasteVerify = async () => {
    const decoded = extractEdoTokenFromText(pasteToken);
    if (!decoded) {
      setError('Paste a valid verification URL or token from the CRO/eDO QR.');
      return;
    }
    await runVerify(decoded, null);
  };

  if (linked) {
    return (
      <Stack spacing={1.5}>
        <VerifiedContainerDetailsCard match={linked.match} />
        <Stack direction="row" justifyContent="flex-end">
          <Button size="small" onClick={reset} disabled={disabled}>
            Change document
          </Button>
        </Stack>
        {linked.file && (
          <Typography variant="caption" color="text.secondary">
            Document: {linked.file.name}
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderStyle: 'dashed',
          borderRadius: 2,
          textAlign: 'center',
          bgcolor: 'action.hover',
        }}
      >
        <QrCodeScannerOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Upload CRO/eDO with QR code
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2} maxWidth={420} mx="auto">
          We read the QR on the document and auto-fill the container — you cannot edit these details manually.
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlinedIcon />}
          disabled={disabled || busy}
        >
          {fileName || 'Choose PDF or photo'}
          <input
            type="file"
            hidden
            accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
            onChange={(e) => void onFileChange(e.target.files)}
          />
        </Button>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
        <TextField
          label="Or paste verification URL / token"
          value={pasteToken}
          onChange={(e) => setPasteToken(e.target.value)}
          fullWidth
          size="small"
          disabled={disabled || busy}
        />
        <Button variant="outlined" onClick={() => void onPasteVerify()} disabled={disabled || busy || !pasteToken.trim()}>
          Verify
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
