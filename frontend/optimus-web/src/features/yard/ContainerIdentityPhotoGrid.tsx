import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { CONTAINER_PHOTO_CATEGORIES, OTHERS_PHOTO } from '../../shared/containerPhotoCategories';

type Props = {
  photos: Partial<Record<string, File>>;
  onChange: (category: string, file: File | null) => void;
};

type PhotoSlotProps = {
  label: string;
  required?: boolean;
  file?: File;
  onChange: (file: File | null) => void;
};

function PhotoSlot({ label, required, file, onChange }: PhotoSlotProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Box
      sx={{
        border: 2,
        borderColor: file ? 'success.main' : 'divider',
        borderStyle: file ? 'solid' : 'dashed',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: file ? 'background.paper' : 'action.hover',
        transition: 'border-color 160ms ease',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '4 / 3',
          bgcolor: '#0a1628',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {preview ? (
          <>
            <Box
              component="img"
              src={preview}
              alt={label}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={() => onChange(null)}
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
              aria-label={`Remove ${label}`}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <CheckCircleIcon
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                color: 'success.light',
                fontSize: 22,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
              }}
            />
          </>
        ) : (
          <PhotoCameraOutlinedIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.35)' }} />
        )}
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={1.25} py={1}>
        <Typography variant="caption" fontWeight={700}>
          {label}
          {required && ' *'}
        </Typography>
        <Button variant="text" size="small" component="label" sx={{ minWidth: 0, px: 1 }}>
          {file ? 'Replace' : 'Add'}
          <input
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </Button>
      </Stack>
    </Box>
  );
}

export function ContainerIdentityPhotoGrid({ photos, onChange }: Props) {
  const requiredCount = CONTAINER_PHOTO_CATEGORIES.filter((c) => photos[c.field]).length;
  const progress = (requiredCount / CONTAINER_PHOTO_CATEGORIES.length) * 100;

  const slots = useMemo(
    () => [...CONTAINER_PHOTO_CATEGORIES.map((c) => ({ ...c, required: true })), { ...OTHERS_PHOTO, required: false }],
    [],
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="subtitle2" fontWeight={700}>
          Identity views
        </Typography>
        <Chip
          size="small"
          label={`${requiredCount}/${CONTAINER_PHOTO_CATEGORIES.length} required`}
          color={requiredCount === CONTAINER_PHOTO_CATEGORIES.length ? 'success' : 'warning'}
        />
      </Stack>
      <LinearProgress variant="determinate" value={progress} sx={{ height: 4, borderRadius: 2 }} />
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={1.5}
      >
        {slots.map((cat) => (
          <PhotoSlot
            key={cat.field}
            label={cat.label}
            required={cat.required}
            file={photos[cat.field]}
            onChange={(file) => onChange(cat.field, file)}
          />
        ))}
      </Box>
    </Stack>
  );
}
