import { ChangeEvent, useEffect, useMemo, useRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { ShippingLineLogoAvatar } from '../../shared/ShippingLineLogoAvatar';

type ShippingLineLogoFieldProps = {
  brandName?: string;
  brandColor?: string | null;
  existingLogoPath?: string | null;
  previewUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onClear?: () => void;
  error?: string | null;
};

export function ShippingLineLogoField({
  brandName,
  brandColor,
  existingLogoPath,
  previewUrl,
  onFileSelect,
  onClear,
  error,
}: ShippingLineLogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = previewUrl ?? existingLogoPath ?? undefined;
  const label = useMemo(() => brandName?.trim() || 'Shipping line', [brandName]);

  useEffect(
    () => () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const onChooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
    event.target.value = '';
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: error ? 'error.main' : 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <ShippingLineLogoAvatar
          src={previewUrl ?? undefined}
          logoPath={existingLogoPath}
          brandName={brandName}
          brandColor={brandColor}
          size={72}
        />
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700}>
            Shipping line logo
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.35} mb={1.25}>
            Upload a logo for {label}. Used in the portal header, documents, and admin views.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PhotoCameraOutlinedIcon />}
              onClick={() => inputRef.current?.click()}
            >
              {displayUrl ? 'Change logo' : 'Upload logo'}
            </Button>
            {displayUrl && onClear && (
              <Button size="small" color="inherit" onClick={onClear}>
                Remove
              </Button>
            )}
          </Stack>
          {error && (
            <Typography variant="caption" color="error.main" display="block" mt={0.75}>
              {error}
            </Typography>
          )}
        </Box>
      </Stack>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={onChooseFile}
      />
    </Box>
  );
}
