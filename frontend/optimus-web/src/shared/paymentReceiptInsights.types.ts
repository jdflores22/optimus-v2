export type PaymentChannelId =
  | 'gcash'
  | 'maya'
  | 'grabpay'
  | 'shopeepay'
  | 'bpi'
  | 'bdo'
  | 'metrobank'
  | 'unionbank'
  | 'landbank'
  | 'pnb'
  | 'instapay'
  | 'pesonet'
  | 'unknown';

export type PaymentReceiptInsights = {
  channel: PaymentChannelId | null;
  channelLabel: string | null;
  referenceNumbers: string[];
  qrphNumber: string | null;
  transactionAt: string | null;
  transactionLabel: string | null;
  amounts: string[];
  rawText: string;
};

export type SaveEdoPaymentReceiptInsightsRequest = {
  paymentChannel?: string | null;
  paymentReference?: string | null;
  qrphNumber?: string | null;
  transactionAt?: string | null;
};
