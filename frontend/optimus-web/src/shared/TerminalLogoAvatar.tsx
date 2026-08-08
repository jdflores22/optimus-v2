import { Avatar } from '@mui/material';
import DirectionsBoatOutlinedIcon from '@mui/icons-material/DirectionsBoatOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { resolveTerminalLogoUrl } from './terminalLogoUtils';

type TerminalLogoAvatarProps = {
  logoPath?: string | null;
  code?: string;
  kind?: 'port' | 'cy';
  size?: number;
};

export function TerminalLogoAvatar({
  logoPath,
  code,
  kind = 'cy',
  size = 40,
}: TerminalLogoAvatarProps) {
  const initials = code?.trim().slice(0, 2).toUpperCase();
  const isPort = kind === 'port';

  return (
    <Avatar
      src={resolveTerminalLogoUrl(logoPath)}
      alt={code ? `${code} logo` : undefined}
      variant="rounded"
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        fontWeight: 700,
        flexShrink: 0,
        bgcolor: isPort ? 'rgba(103, 80, 164, 0.10)' : 'rgba(55, 71, 79, 0.08)',
        color: isPort ? 'primary.main' : 'text.secondary',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {initials ||
        (isPort ? <DirectionsBoatOutlinedIcon fontSize="small" /> : <WarehouseOutlinedIcon fontSize="small" />)}
    </Avatar>
  );
}
