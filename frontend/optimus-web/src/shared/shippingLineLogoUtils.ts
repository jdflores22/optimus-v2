export const SHIPPING_LINE_LOGO_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';

export function validateShippingLineLogoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file (PNG, JPG, WEBP, GIF, or SVG).';
  }
  if (file.size > 2 * 1024 * 1024) {
    return 'Logo must be 2 MB or smaller.';
  }
  return null;
}
