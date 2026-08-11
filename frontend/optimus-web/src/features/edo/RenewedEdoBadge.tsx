import { Chip } from '@mui/material';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';

type Props = {
  variant?: 'filled' | 'outlined';
};

/** Badge for CRO/eDO documents issued from a pre-forecast or renewal request. */
export function RenewedEdoBadge({ variant = 'filled' }: Props) {
  return (
    <Chip
      size="small"
      color="secondary"
      variant={variant}
      icon={<AutorenewOutlinedIcon sx={{ fontSize: '16px !important' }} />}
      label="Renewed eDO"
      sx={{ fontWeight: 700 }}
    />
  );
}
