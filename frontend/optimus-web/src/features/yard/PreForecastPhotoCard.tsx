import { Box, Stack, Typography } from '@mui/material';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { useSelector } from 'react-redux';
import type { TruckerPreForecastPhotoDto } from '../../shared/types';
import type { RootState } from '../../app/store';
import { openPreForecastPhoto } from '../../shared/preForecastPhoto';
import { PreForecastPhotoImage } from './PreForecastPhotoImage';

type Props = {
  submissionId: string;
  photo: TruckerPreForecastPhotoDto;
};

export function PreForecastPhotoCard({ submissionId, photo }: Props) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  return (
    <Box
      component="button"
      type="button"
      onClick={() => {
        if (!accessToken) return;
        void openPreForecastPhoto(submissionId, photo.id, accessToken);
      }}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        p: 0,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <PreForecastPhotoImage submissionId={submissionId} photoId={photo.id} alt={photo.label} />
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={1.25} py={1}>
        <Typography variant="caption" fontWeight={700}>
          {photo.label}
        </Typography>
        <OpenInNewOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
      </Stack>
    </Box>
  );
}
