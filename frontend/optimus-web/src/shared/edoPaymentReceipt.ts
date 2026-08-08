import { API_BASE_URL } from './types';

export const EDO_PAYMENT_RECEIPT_ACCEPT =
  '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';

export function isEdoPaymentReceiptFile(file: File): boolean {
  if (/\.(pdf|png|jpe?g)$/i.test(file.name)) return true;
  return /^(application\/pdf|image\/(png|jpeg|jpg))$/i.test(file.type);
}

export async function loadEdoPaymentReceiptBlob(
  paymentId: string,
  accessToken: string,
): Promise<{ url: string; contentType: string }> {
  const res = await fetch(`${API_BASE_URL}/api/edo-payments/${paymentId}/receipt`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Could not load payment receipt.');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { url, contentType: blob.type || res.headers.get('content-type') || 'application/pdf' };
}
