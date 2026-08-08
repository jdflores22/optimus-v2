import { API_BASE_URL } from './types';

export function resolveTerminalLogoUrl(logoPath?: string | null): string | undefined {
  if (!logoPath) return undefined;
  if (/^https?:\/\//i.test(logoPath)) return logoPath;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
  return `${base}${path}`;
}

export const TERMINAL_LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';

export function validateTerminalLogoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file (PNG, JPG, WEBP, GIF, or SVG).';
  }
  if (file.size > 2 * 1024 * 1024) {
    return 'Logo must be 2 MB or smaller.';
  }
  return null;
}
