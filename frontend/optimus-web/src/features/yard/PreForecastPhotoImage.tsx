import { useEffect, useState } from 'react';
import { Box, Skeleton, Typography, type BoxProps } from '@mui/material';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { fetchPreForecastPhotoBlob } from '../../shared/preForecastPhoto';

type Props = {
  submissionId: string;
  photoId: string;
  alt: string;
} & BoxProps;

export function PreForecastPhotoImage({ submissionId, photoId, alt, sx, ...rest }: Props) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setFailed(true);
      return undefined;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void fetchPreForecastPhotoBlob(submissionId, photoId, accessToken)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [submissionId, photoId, accessToken]);

  if (failed) {
    return (
      <Box
        sx={{
          width: '100%',
          aspectRatio: '4/3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          bgcolor: 'grey.100',
          color: 'text.secondary',
          ...sx,
        }}
        {...rest}
      >
        <BrokenImageOutlinedIcon fontSize="small" />
        <Typography variant="caption">Photo unavailable</Typography>
      </Box>
    );
  }

  if (!src) {
    return <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '4/3', ...sx }} />;
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', bgcolor: '#0a1628', ...sx }}
      {...rest}
    />
  );
}
