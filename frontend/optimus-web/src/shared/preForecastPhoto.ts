import { API_BASE_URL } from './types';

export function preForecastPhotoApiPath(submissionId: string, photoId: string): string {
  return `/api/v1/pre-forecast/intake/${submissionId}/photos/${photoId}`;
}

export async function fetchPreForecastPhotoBlob(
  submissionId: string,
  photoId: string,
  accessToken: string,
): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}${preForecastPhotoApiPath(submissionId, photoId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Photo not found or access denied.');
  }

  return res.blob();
}

export async function openPreForecastPhoto(
  submissionId: string,
  photoId: string,
  accessToken: string,
): Promise<void> {
  const blob = await fetchPreForecastPhotoBlob(submissionId, photoId, accessToken);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
