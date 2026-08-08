import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TagOutlinedIcon from '@mui/icons-material/TagOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { useSaveEdoPaymentReceiptInsightsMutation } from '../../app/api';
import {
  buildEdoPaymentReceiptInsightsPayload,
  extractPaymentReceiptInsightsFromImage,
  type PaymentReceiptInsights,
} from '../../shared/paymentReceiptInsights';
import { WorkflowSection } from '../shared/WorkflowPage';

type Props = {
  paymentId: string;
  receiptUrl: string | null;
  contentType: string | null;
  expectedAmount?: number;
  currency?: string;
  savedChannel?: string | null;
  savedReference?: string | null;
  savedQrphNumber?: string | null;
  savedTransactionAt?: string | null;
};

function money(amount: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function channelColor(channel: string | null): 'primary' | 'success' | 'info' | 'warning' | 'default' {
  if (!channel) return 'default';
  if (/gcash/i.test(channel)) return 'primary';
  if (/maya/i.test(channel)) return 'success';
  return 'info';
}

function formatTransactionDate(value: string | null | undefined, fallbackLabel?: string | null): string | null {
  if (fallbackLabel?.trim()) return fallbackLabel.trim();
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PaymentReceiptInsightsPanel({
  paymentId,
  receiptUrl,
  contentType,
  expectedAmount,
  currency = 'PHP',
  savedChannel,
  savedReference,
  savedQrphNumber,
  savedTransactionAt,
}: Props) {
  const [saveInsights] = useSaveEdoPaymentReceiptInsightsMutation();
  const [insights, setInsights] = useState<PaymentReceiptInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isImage = contentType?.startsWith('image/') ?? false;
  const displayChannel = insights?.channelLabel ?? savedChannel ?? null;
  const displayReference =
    insights?.referenceNumbers[0] ?? savedReference ?? null;
  const displayQrph = insights?.qrphNumber ?? savedQrphNumber ?? null;
  const displayTransaction = formatTransactionDate(
    insights?.transactionAt ?? savedTransactionAt,
    insights?.transactionLabel,
  );
  const extraReferences =
    insights?.referenceNumbers.filter((ref) => ref !== displayReference && ref !== displayQrph) ?? [];

  useEffect(() => {
    if (!receiptUrl || !isImage) {
      setInsights(null);
      setError(null);
      setProgress(0);
      setSaved(false);
      return;
    }

    let active = true;
    setLoading(true);
    setSaving(false);
    setError(null);
    setInsights(null);
    setProgress(0);
    setSaved(false);

    void extractPaymentReceiptInsightsFromImage(receiptUrl, (value) => {
      if (active) setProgress(Math.round(value * 100));
    })
      .then(async (result) => {
        if (!active) return;
        setInsights(result);

        const payload = buildEdoPaymentReceiptInsightsPayload(result);
        if (
          !payload.paymentChannel &&
          !payload.paymentReference &&
          !payload.qrphNumber &&
          !payload.transactionAt
        ) {
          return;
        }

        setSaving(true);
        try {
          await saveInsights({ id: paymentId, ...payload }).unwrap();
          if (active) setSaved(true);
        } catch {
          if (active) setError('Detected payment details but could not save them to the payment record.');
        } finally {
          if (active) setSaving(false);
        }
      })
      .catch(() => {
        if (active) setError('Could not scan receipt image for payment details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paymentId, receiptUrl, isImage, saveInsights]);

  if (!receiptUrl) return null;

  if (!isImage) {
    return (
      <WorkflowSection
        title="Receipt scan"
        subtitle="Automatic detection works on image receipts (GCash, Maya, QR Ph, bank transfer screenshots)."
      >
        <Alert severity="info" icon={<AutoAwesomeOutlinedIcon />}>
          This receipt is a PDF. Open it above and verify the reference number, QR Ph no., and payment channel
          manually.
        </Alert>
        {(savedChannel || savedReference || savedQrphNumber || savedTransactionAt) && (
          <Stack spacing={1.25} mt={2}>
            {savedChannel && <SavedRow label="Payment channel" value={savedChannel} />}
            {savedReference && <SavedRow label="Payment reference" value={savedReference} mono />}
            {savedQrphNumber && <SavedRow label="QR Ph no." value={savedQrphNumber} mono />}
            {formatTransactionDate(savedTransactionAt) && (
              <SavedRow label="Transaction date" value={formatTransactionDate(savedTransactionAt)!} />
            )}
          </Stack>
        )}
      </WorkflowSection>
    );
  }

  const matchedAmount =
    expectedAmount != null &&
    insights?.amounts.some((amount) => Math.abs(parseFloat(amount) - expectedAmount) <= 0.01);

  return (
    <WorkflowSection
      title="Receipt scan"
      subtitle="Detected payment channel, reference numbers, QR Ph no., and transaction date. Saved automatically to this payment."
    >
      {loading && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Scanning receipt… {progress > 0 ? `${progress}%` : ''}
            </Typography>
          </Stack>
          <LinearProgress variant={progress > 0 ? 'determinate' : 'indeterminate'} value={progress} />
        </Stack>
      )}

      {saving && !loading && (
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Saving detected payment details…
          </Typography>
        </Stack>
      )}

      {saved && !loading && !saving && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment channel, reference, QR Ph no., and transaction date were saved to this payment record.
        </Alert>
      )}

      {error && <Alert severity="warning">{error}</Alert>}

      {!loading && (insights || savedChannel || savedReference || savedQrphNumber || savedTransactionAt) && (
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <EventOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={700}>
                Transaction date
              </Typography>
            </Stack>
            {displayTransaction ? (
              <Chip size="small" label={displayTransaction} variant="outlined" sx={{ fontWeight: 600 }} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No transaction date detected on this receipt image.
              </Typography>
            )}
          </Box>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <AccountBalanceWalletOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={700}>
                Payment channel
              </Typography>
            </Stack>
            {displayChannel ? (
              <Chip
                size="small"
                label={displayChannel}
                color={channelColor(displayChannel)}
                sx={{ fontWeight: 700 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Could not identify channel (GCash, Maya, bank, etc.). Check the receipt manually.
              </Typography>
            )}
          </Box>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <TagOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={700}>
                Payment reference
              </Typography>
            </Stack>
            {displayReference ? (
              <Chip
                size="small"
                label={displayReference}
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No reference number detected. Verify Ref No. / Transaction ID on the receipt image.
              </Typography>
            )}
            {extraReferences.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                {extraReferences.map((ref) => (
                  <Chip
                    key={ref}
                    size="small"
                    label={ref}
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <QrCode2OutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={700}>
                QR Ph no.
              </Typography>
            </Stack>
            {displayQrph ? (
              <Chip
                size="small"
                label={displayQrph}
                color="info"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No QR Ph number detected on this receipt image.
              </Typography>
            )}
          </Box>

          {insights && insights.amounts.length > 0 && (
            <Box>
              <Typography variant="body2" fontWeight={700} mb={1}>
                Amounts detected
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {insights.amounts.map((amount) => {
                  const numeric = parseFloat(amount);
                  const matchesExpected =
                    expectedAmount != null && Math.abs(numeric - expectedAmount) <= 0.01;
                  return (
                    <Chip
                      key={amount}
                      size="small"
                      label={money(numeric, currency)}
                      color={matchesExpected ? 'success' : 'default'}
                      variant={matchesExpected ? 'filled' : 'outlined'}
                    />
                  );
                })}
              </Stack>
              {expectedAmount != null && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Expected fee: {money(expectedAmount, currency)}
                  {matchedAmount ? ' · amount matches' : ' · compare with receipt'}
                </Typography>
              )}
            </Box>
          )}

          {insights &&
            !displayChannel &&
            !displayReference &&
            !displayQrph &&
            !displayTransaction &&
            insights.amounts.length === 0 && (
              <Alert severity="info">
                OCR completed but no payment details were found. The image may be blurry or use an unsupported
                layout.
              </Alert>
            )}
        </Stack>
      )}
    </WorkflowSection>
  );
}

function SavedRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Typography variant="body2">
      <strong>{label}:</strong>{' '}
      <Typography component="span" fontFamily={mono ? 'monospace' : undefined} fontWeight={mono ? 700 : 400}>
        {value}
      </Typography>
    </Typography>
  );
}
