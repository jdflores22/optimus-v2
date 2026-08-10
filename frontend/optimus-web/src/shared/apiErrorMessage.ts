type ApiErrorPayload = {
  error?: string;
  title?: string;
  detail?: string;
  message?: string;
};

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err && 'data' in err) {
    const data = (err as { data?: ApiErrorPayload }).data;
    return data?.error || data?.detail || data?.message || data?.title || fallback;
  }

  return fallback;
}
