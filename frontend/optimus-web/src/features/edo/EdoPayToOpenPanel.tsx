import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import {
  useGetActivePaymentFeeQuery,
  useSubmitEdoPaymentMutation,
} from '../../app/api';
import type { EdoDto } from '../../shared/types';
import {
  EDO_PAYMENT_RECEIPT_ACCEPT,
  isEdoPaymentReceiptFile,
} from '../../shared/edoPaymentReceipt';
import { paymentFeeDocUrl, resolveEdoFeeAmount } from '../../shared/paymentFees';
import { edoPaymentRejected, edoPaymentSubmitted } from '../../shared/formatEdoStatus';
import { canSubmitEdoPayToOpen } from '../../shared/edoPayToOpen';
import { dialogActionsSx } from '../../shared/responsiveLayout';

type Props = {
  edo: EdoDto;
  role: string;
  onSubmitted?: () => void;
};

function money(amount: number, currency = 'PHP') {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function EdoPayToOpenPanel({ edo, role, onSubmitted }: Props) {
  const { data: edoFee } = useGetActivePaymentFeeQuery('edo');
  const [submitPayment, { isLoading: submitting }] = useSubmitEdoPaymentMutation();
  const [receipt, setReceipt] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const paymentSubmitted = edoPaymentSubmitted(edo.currentPaymentStatus);
  const paymentRejected = edoPaymentRejected(edo.currentPaymentStatus);
  const canSubmit = canSubmitEdoPayToOpen(role, edo);

  if (!canSubmit && !paymentSubmitted) {
    return null;
  }

  const amount = resolveEdoFeeAmount(edoFee, edo.feeAmount, {
    lockSnapshot: paymentSubmitted,
  });
  const paymentQrUrl = paymentFeeDocUrl(edoFee?.qrCodePath);
  const currency = 'PHP';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!receipt) {
      setFormError('Please upload a payment receipt before submitting.');
      return;
    }
    if (!isEdoPaymentReceiptFile(receipt)) {
      setFormError('Receipt must be a PDF or image file (PNG, JPG).');
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!receipt) return;
    setFormError(null);
    try {
      await submitPayment({
        edoId: edo.id,
        amount,
        currency,
        receipt,
      }).unwrap();
      setConfirmOpen(false);
      setReceipt(null);
      onSubmitted?.();
    } catch (err: unknown) {
      setConfirmOpen(false);
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String(
              (err as { data?: { message?: string; error?: string } }).data?.message ??
                (err as { data?: { error?: string } }).data?.error ??
                'Failed to submit payment.',
            )
          : 'Failed to submit payment.';
      setFormError(msg);
    }
  };

  if (paymentSubmitted) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Payment receipt submitted — waiting for accounting validation. Download will be available after
        verification and release.
      </Alert>
    );
  }

  return (
    <Box mt={2}>
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}
      {paymentRejected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your previous payment was rejected. Upload a new receipt to resubmit.
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Payment amount"
            value={money(amount, currency)}
            InputProps={{ readOnly: true }}
            helperText="Pay the exact eDO access fee in Philippine Pesos."
            fullWidth
          />

          {paymentQrUrl && (
            <Box>
              <Typography variant="body2" fontWeight={700} mb={1}>
                Payment QR / instructions
              </Typography>
              <Box
                component="img"
                src={paymentQrUrl}
                alt="Payment QR"
                sx={{ maxWidth: 200, borderRadius: 1, border: 1, borderColor: 'divider' }}
              />
            </Box>
          )}

          <Box>
            <Typography variant="body2" fontWeight={700} mb={1}>
              Payment receipt (PDF or image) *
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.75,
                px: 2,
                py: 2.25,
                border: 1,
                borderStyle: 'dashed',
                borderColor: receipt ? 'success.main' : 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: receipt ? 'success.main' : 'action.selected',
                  color: receipt ? 'success.contrastText' : 'text.secondary',
                }}
              >
                {receipt ? <InsertDriveFileOutlinedIcon /> : <UploadFileOutlinedIcon />}
              </Box>
              <Box minWidth={0}>
                <Typography variant="body2" fontWeight={700}>
                  {receipt ? receipt.name : 'Upload receipt'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {EDO_PAYMENT_RECEIPT_ACCEPT}
                </Typography>
              </Box>
              <input
                type="file"
                hidden
                accept={EDO_PAYMENT_RECEIPT_ACCEPT}
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
            </Box>
          </Box>

          <Button type="submit" variant="contained" color="warning" disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
            Submit payment receipt
          </Button>
        </Stack>
      </Box>

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Submit eDO payment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Submit <strong>{money(amount, currency)}</strong> receipt for <strong>{edo.edoNumber}</strong>? Accounting
            will validate before the document can be opened.
          </Typography>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button disabled={submitting} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={submitting} onClick={() => void onConfirm()}>
            {submitting ? 'Submitting…' : 'Confirm submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
