import type { PaymentChannelId, PaymentReceiptInsights } from './paymentReceiptInsights.types';

export type { PaymentChannelId, PaymentReceiptInsights } from './paymentReceiptInsights.types';

const CHANNEL_RULES: { id: PaymentChannelId; label: string; patterns: RegExp[] }[] = [
  { id: 'gcash', label: 'GCash', patterns: [/gcash/i, /g[\s-]?cash/i] },
  { id: 'maya', label: 'Maya', patterns: [/\bmaya\b/i, /paymaya/i] },
  { id: 'grabpay', label: 'GrabPay', patterns: [/grabpay/i, /grab pay/i] },
  { id: 'shopeepay', label: 'ShopeePay', patterns: [/shopeepay/i, /shopee pay/i] },
  { id: 'bpi', label: 'BPI', patterns: [/\bbpi\b/i, /bank of the philippine islands/i] },
  { id: 'bdo', label: 'BDO', patterns: [/\bbdo\b/i, /banco de oro/i] },
  { id: 'metrobank', label: 'Metrobank', patterns: [/metrobank/i, /metro bank/i] },
  { id: 'unionbank', label: 'UnionBank', patterns: [/unionbank/i, /union bank/i] },
  { id: 'landbank', label: 'Landbank', patterns: [/landbank/i, /land bank/i] },
  { id: 'pnb', label: 'PNB', patterns: [/\bpnb\b/i, /philippine national bank/i] },
  { id: 'instapay', label: 'InstaPay', patterns: [/instapay/i, /insta pay/i] },
  { id: 'pesonet', label: 'PESONet', patterns: [/pesonet/i, /peso net/i] },
];

const REF_LABEL_PATTERN =
  /(?:ref\.?\s*(?:no\.?|number|#)|reference\s*(?:no\.?|number|#)|transaction\s*(?:id|no\.?|number|#)|confirmation\s*(?:no\.?|number|#)|trace\s*(?:no\.?|number|#)|control\s*(?:no\.?|number|#))[\s:.-]*([A-Z0-9-]{6,24})/gi;

const INVALID_QRPH_VALUES = new Set([
  'INVOICE',
  'NUMBER',
  'NO',
  'REF',
  'REFERENCE',
  'ID',
  'PAYMENT',
  'QR',
  'QRPH',
  'PH',
]);

const QRPH_PATTERNS = [
  /qr[\s-]?ph[\s-]*invoice[\s-]*no\.?[\s:.-]*(\d{4,20})/i,
  /qr[\s-]?ph[\s-]*(?:invoice[\s-]*)?(?:no\.?|number|#)[\s:.-]*(\d{4,20})/i,
  /qr[\s-]?ph(?:\s*(?:no\.?|number|#|id|ref(?:erence)?))?[\s:.-]+(\d{4,20})/i,
  /qr[\s-]?payment[\s-]?(?:ref(?:erence)?|no\.?)[\s:.-]*(\d{4,20})/i,
];

const AMOUNT_PATTERN = /(?:PHP|₱|\bP\b)\s*([\d,]+\.\d{2})/gi;

const MONTH_NAME =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

const TRANSACTION_DATE_PATTERNS = [
  new RegExp(
    `(?:transaction\\s*date|date\\s*(?:&\\s*time)?|transacted\\s*on|paid\\s*on)[\\s:.-]+(${MONTH_NAME}\\s+\\d{1,2},?\\s+\\d{4}(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?\\s*(?:am|pm)?)?|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?\\s*(?:am|pm)?)?)`,
    'i',
  ),
  new RegExp(
    `\\b(${MONTH_NAME}\\s+\\d{1,2},\\s+\\d{4}\\s+\\d{1,2}:\\d{2}\\s*(?:am|pm))\\b`,
    'i',
  ),
  new RegExp(`\\b(${MONTH_NAME}\\s+\\d{1,2},\\s+\\d{4})\\b`, 'i'),
  /\b(\d{1,2}[/-]\d{1,2}[/-]\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  /\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/,
];

function normalizeOcrText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[|]/g, 'I')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectChannel(text: string): { id: PaymentChannelId; label: string } | null {
  for (const rule of CHANNEL_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { id: rule.id, label: rule.label };
    }
  }
  return null;
}

function isLikelyPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^09\d{9}$/.test(digits) || /^639\d{9}$/.test(digits);
}

function isLikelyDate(value: string): boolean {
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(value);
}

function isValidQrphValue(value: string): boolean {
  const upper = value.trim().toUpperCase();
  if (!upper || INVALID_QRPH_VALUES.has(upper)) return false;
  if (/^(NO|REF|ID)\.?$/i.test(upper)) return false;

  const digits = upper.replace(/\D/g, '');
  if (digits.length >= 4) return true;

  return /^[A-Z0-9-]{8,40}$/.test(upper) && /\d/.test(upper);
}

function collectQrphNumber(text: string): string | null {
  for (const pattern of QRPH_PATTERNS) {
    const match = pattern.exec(text);
    const value = match?.[1]?.trim();
    if (value && isValidQrphValue(value)) {
      return value;
    }
  }

  const fallback =
    /(?:qr[\s-]?ph|qrph)[\s\S]{0,48}?[\s:.-]+([A-Z0-9-]{4,40})/i.exec(text);
  const candidate = fallback?.[1]?.trim();
  if (candidate && isValidQrphValue(candidate)) {
    return candidate;
  }

  return null;
}

function collectReferenceNumbers(text: string, qrphNumber: string | null): string[] {
  const found = new Set<string>();

  for (const match of text.matchAll(REF_LABEL_PATTERN)) {
    const value = match[1]?.trim().toUpperCase();
    if (value && value !== qrphNumber && !isLikelyPhone(value) && !isLikelyDate(value)) {
      found.add(value);
    }
  }

  // GCash and Maya often show a standalone 13-digit reference.
  for (const match of text.matchAll(/\b(\d{13})\b/g)) {
    const value = match[1];
    if (value !== qrphNumber && !isLikelyPhone(value)) found.add(value);
  }

  // Alphanumeric refs common on bank / e-wallet receipts.
  for (const match of text.matchAll(/\b([A-Z]{2,5}\d{8,16})\b/g)) {
    const candidate = match[1];
    if (candidate !== qrphNumber) found.add(candidate);
  }

  return [...found];
}

function collectAmounts(text: string): string[] {
  const amounts = new Set<string>();
  for (const match of text.matchAll(AMOUNT_PATTERN)) {
    const value = match[1]?.replace(/,/g, '');
    if (value) amounts.add(value);
  }
  return [...amounts];
}

function parseDetectedDate(raw: string): Date | null {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  const timestamp = Date.parse(cleaned);
  if (Number.isNaN(timestamp)) return null;

  const parsed = new Date(timestamp);
  const year = parsed.getFullYear();
  if (year < 2000 || year > 2100) return null;
  return parsed;
}

function collectTransactionDate(text: string): { at: string; label: string } | null {
  for (const pattern of TRANSACTION_DATE_PATTERNS) {
    const match = pattern.exec(text);
    const label = match?.[1]?.trim();
    if (!label) continue;

    const parsed = parseDetectedDate(label);
    if (parsed) {
      return { at: parsed.toISOString(), label };
    }
  }

  return null;
}

export function parsePaymentReceiptText(rawText: string): PaymentReceiptInsights {
  const text = normalizeOcrText(rawText);
  const channel = detectChannel(text);
  const qrphNumber = collectQrphNumber(text);
  const transaction = collectTransactionDate(text);

  return {
    channel: channel?.id ?? null,
    channelLabel: channel?.label ?? null,
    referenceNumbers: collectReferenceNumbers(text, qrphNumber),
    qrphNumber,
    transactionAt: transaction?.at ?? null,
    transactionLabel: transaction?.label ?? null,
    amounts: collectAmounts(text),
    rawText: text,
  };
}

export function buildEdoPaymentReceiptInsightsPayload(insights: PaymentReceiptInsights) {
  const paymentReference =
    insights.referenceNumbers.find((ref) => ref !== insights.qrphNumber) ??
    insights.referenceNumbers[0] ??
    null;

  return {
    paymentChannel: insights.channelLabel,
    paymentReference,
    qrphNumber: insights.qrphNumber,
    transactionAt: insights.transactionAt,
  };
}

export async function extractPaymentReceiptInsightsFromImage(
  imageUrl: string,
  onProgress?: (progress: number) => void,
): Promise<PaymentReceiptInsights> {
  const { default: Tesseract } = await import('tesseract.js');
  const result = await Tesseract.recognize(imageUrl, 'eng', {
    logger: (message) => {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') {
        onProgress?.(message.progress);
      }
    },
  });

  return parsePaymentReceiptText(result.data.text ?? '');
}
