import { Avatar } from '@mui/material';
import DirectionsBoatOutlinedIcon from '@mui/icons-material/DirectionsBoatOutlined';
import { resolveUploadUrl } from './types';

type ShippingLineLogoAvatarProps = {
  logoPath?: string | null;
  src?: string | null;
  brandName?: string | null;
  brandColor?: string | null;
  size?: number;
  variant?: 'circular' | 'rounded' | 'square';
};

function buildInitials(brandName?: string | null): string {
  const source = brandName?.trim() || 'SL';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function ShippingLineLogoAvatar({
  logoPath,
  src,
  brandName,
  brandColor,
  size = 40,
  variant = 'rounded',
}: ShippingLineLogoAvatarProps) {
  const initials = buildInitials(brandName);
  const accent = brandColor && /^#[0-9A-Fa-f]{6}$/.test(brandColor) ? brandColor : undefined;

  return (
    <Avatar
      src={src ?? resolveUploadUrl(logoPath)}
      alt={brandName ? `${brandName} logo` : 'Shipping line logo'}
      variant={variant}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        fontWeight: 700,
        flexShrink: 0,
        bgcolor: accent ? `${accent}22` : 'primary.main',
        color: accent ?? 'primary.contrastText',
        border: 1,
        borderColor: accent ? `${accent}55` : 'divider',
      }}
    >
      {initials || <DirectionsBoatOutlinedIcon sx={{ fontSize: size * 0.45 }} />}
    </Avatar>
  );
}
