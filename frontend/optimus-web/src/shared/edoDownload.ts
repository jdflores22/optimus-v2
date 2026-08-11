import { API_BASE_URL } from './types';

export async function openEdoFile(
  edoId: string,
  kind: 'download' | 'qr',
  accessToken: string,
  cacheKey?: string | null,
): Promise<void> {
  const bust = encodeURIComponent(cacheKey ?? String(Date.now()));
  const res = await fetch(`${API_BASE_URL}/api/edo/${edoId}/${kind}?v=${bust}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    let message = 'Could not open eDO file.';
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
