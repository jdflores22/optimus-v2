import { useEffect, useMemo, useRef, useState } from 'react';
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
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import {
  useGetActivePaymentFeeQuery,
  useGetPaymentFeesQuery,
  useUpsertPaymentFeeMutation,
} from '../../app/api';
import { formatPhp, formatWhen, paymentFeeDocUrl } from '../../shared/paymentFees';
import { dialogActionsSx } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const FEE_TYPE = 'edo' as const;
const FEE_LABEL = 'eDO access fee';

export function PaymentFeesAdminPage() {
  const { data: allFees = [], refetch: refetchAll } = useGetPaymentFeesQuery();
  const { data: activeFee, refetch: refetchActive } = useGetActivePaymentFeeQuery(FEE_TYPE);
  const [upsertFee, { isLoading: saving }] = useUpsertPaymentFeeMutation();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = useMemo(
    () => allFees.filter((f) => f.feeType === FEE_TYPE),
    [allFees],
  );

  useEffect(() => {
    setAmountInput(activeFee?.amount != null ? String(activeFee.amount) : '');
  }, [activeFee?.amount]);

  useEffect(() => {
    return () => {
      if (qrPreview?.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
    };
  }, [qrPreview]);

  const stats = useMemo(
    () => ({
      activeAmount: activeFee?.amount ?? 0,
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
      setMessage(`${FEE_LABEL} updated to ${formatPhp(value)}`);
      setError(null);
      setFeeDialogOpen(false);
      refetchAll();
      refetchActive();
    } catch {
      setError('Could not save payment fee.');
    }
  };

  const onSaveQr = async () => {
    if (!qrFile) {
      setError('Select a QR code image.');
      return;
    }
    const amount = activeFee?.amount ?? Number(amountInput) ?? 0;
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Set a valid fee amount before uploading a QR code.');
      return;
    }
    try {
      await upsertFee({ feeType: FEE_TYPE, amount, qrCode: qrFile }).unwrap();
      setMessage('Payment QR code uploaded.');
      setError(null);
      setQrDialogOpen(false);
      setQrFile(null);
      if (qrPreview?.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
      setQrPreview(null);
      refetchAll();
      refetchActive();
    } catch {
      setError('Could not upload QR code.');
    }
  };

  const onPickQrFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('QR image must be 2MB or smaller.');
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    setError(null);
    setQrFile(file);
    if (qrPreview?.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
    setQrPreview(URL.createObjectURL(file));
  };

  const qrImageUrl = paymentFeeDocUrl(activeFee?.qrCodePath);

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Payment Fee Configuration"
      subtitle="Manage the eDO access fee and QR payment code shown to brokers and consignees."
      stats={[
        { label: 'Active fee', value: formatPhp(stats.activeAmount), tone: 'primary' },
        { label: 'History', value: stats.historyCount, hint: FEE_LABEL, tone: 'info' },
        { label: 'QR code', value: qrImageUrl ? 'Uploaded' : 'Missing', tone: qrImageUrl ? 'success' : 'warning' },
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
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
              Current fee
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {FEE_LABEL}
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              color="primary.main"
              sx={{ fontVariantNumeric: 'tabular-nums', mb: 2 }}
            >
              {formatPhp(activeFee?.amount ?? 0)}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setFeeDialogOpen(true)}
            >
              Update fee amount
            </Button>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <QrCode2OutlinedIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700}>
                Payment QR code
              </Typography>
            </Stack>
            {qrImageUrl ? (
              <Box
                component="img"
                src={qrImageUrl}
                alt="Payment QR code"
                sx={{
                  width: '100%',
                  maxHeight: 260,
                  objectFit: 'contain',
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  mb: 2,
                  bgcolor: 'background.default',
                }}
              />
            ) : (
              <Box
                sx={{
                  py: 5,
                  mb: 2,
                  textAlign: 'center',
                  borderRadius: 1.5,
                  border: '2px dashed',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <QrCode2OutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No QR code uploaded
                </Typography>
              </Box>
            )}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CloudUploadOutlinedIcon />}
              onClick={() => setQrDialogOpen(true)}
            >
              {qrImageUrl ? 'Update QR code' : 'Upload QR code'}
            </Button>
          </Paper>
        </Stack>

        <WorkflowSection
          title="Configuration history"
          subtitle={`All changes for ${FEE_LABEL.toLowerCase()}`}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Previous</TableCell>
                <TableCell>New amount</TableCell>
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
                          {formatPhp(row.previousAmount)}
                        </Typography>
                      ) : (
                        <Chip size="small" label="Initial" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPhp(row.amount)}
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
        <DialogTitle>Update payment fee</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {FEE_LABEL}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Amount (PHP)"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            inputProps={{ min: 0.01, step: 0.01 }}
            size="small"
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            This change does not affect existing pending or completed payment transactions.
          </Alert>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setFeeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSaveFee} disabled={saving}>
            {saving ? 'Saving…' : 'Update fee'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload payment QR code</DialogTitle>
        <DialogContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => onPickQrFile(e.target.files?.[0] ?? null)}
          />
          {!qrPreview ? (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                py: 6,
                textAlign: 'center',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2">Click to upload JPG, PNG, or WebP (max 2MB)</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5} alignItems="center">
              <Box
                component="img"
                src={qrPreview}
                alt="QR preview"
                sx={{ maxWidth: '100%', maxHeight: 220, borderRadius: 1.5, border: 1, borderColor: 'divider' }}
              />
              <Button size="small" onClick={() => fileInputRef.current?.click()}>
                Choose another file
              </Button>
            </Stack>
          )}
          <Alert severity="info" sx={{ mt: 2 }}>
            This QR code is shown when users pay the {FEE_LABEL.toLowerCase()}.
          </Alert>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setQrDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSaveQr} disabled={saving || !qrFile}>
            {saving ? 'Uploading…' : 'Upload QR code'}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkflowPage>
  );
}
