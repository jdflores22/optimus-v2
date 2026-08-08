import { useEffect, useState } from 'react';
import { Alert, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import {
  useDeleteShippingLineLogoMutation,
  useGetShippingLinesQuery,
  useUpdateShippingLineMutation,
  useUploadShippingLineLogoMutation,
} from '../../app/api';
import { ShippingLineLogoAvatar } from '../../shared/ShippingLineLogoAvatar';
import { validateShippingLineLogoFile } from '../../shared/shippingLineLogoUtils';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { ShippingLineLogoField } from './ShippingLineLogoField';

/** Single shipping line brand settings (multi-line create/switch removed). */
export function ShippingLinesPage() {
  const { data = [], refetch, isFetching } = useGetShippingLinesQuery();
  const [updateLine, { isLoading: savingBrand }] = useUpdateShippingLineMutation();
  const [uploadLogo, { isLoading: uploadingLogo }] = useUploadShippingLineLogoMutation();
  const [deleteLogo, { isLoading: deletingLogo }] = useDeleteShippingLineLogoMutation();
  const line = data[0];
  const [brandName, setBrandName] = useState('');
  const [brandColor, setBrandColor] = useState('#0B3D5C');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoMarkedForRemoval, setLogoMarkedForRemoval] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (line) {
      setBrandName(line.brandName);
      setBrandColor(line.brandColor || '#0B3D5C');
    }
  }, [line]);

  useEffect(
    () => () => {
      if (logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    },
    [logoPreview],
  );

  const resetLogoDraft = () => {
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setLogoMarkedForRemoval(false);
    setLogoError(null);
  };

  const onLogoSelect = (file: File | null) => {
    setLogoError(null);
    setLogoMarkedForRemoval(false);
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const onLogoClear = () => {
    onLogoSelect(null);
    setLogoMarkedForRemoval(true);
  };

  const onSave = async () => {
    if (!line) return;
    setError(null);
    setMessage(null);
    setLogoError(null);

    if (logoFile) {
      const validationError = validateShippingLineLogoFile(logoFile);
      if (validationError) {
        setLogoError(validationError);
        return;
      }
    }

    try {
      await updateLine({
        id: line.id,
        brandName,
        brandColor,
        isActive: true,
      }).unwrap();

      if (logoMarkedForRemoval && line.logoPath) {
        await deleteLogo(line.id).unwrap();
      } else if (logoFile) {
        await uploadLogo({ id: line.id, file: logoFile }).unwrap();
      }

      resetLogoDraft();
      setMessage('Brand settings saved.');
      refetch();
    } catch {
      setError('Failed to update brand settings.');
    }
  };

  const isSaving = savingBrand || uploadingLogo || deletingLogo;
  const displayLogoPath = logoMarkedForRemoval ? null : line?.logoPath;

  return (
    <WorkflowPage
      eyebrow="Administration"
      title="Brand settings"
      subtitle="Maintain the single shipping-line identity used throughout the portal, documents, and shared operator views."
      chips={
        <>
          {line && (
            <ShippingLineLogoAvatar
              src={logoPreview ?? undefined}
              logoPath={displayLogoPath}
              brandName={brandName}
              brandColor={brandColor}
              size={28}
            />
          )}
          <Chip size="small" label={line?.brandName ?? 'No line configured'} color="primary" />
          <Chip size="small" label={line?.isActive ? 'Active' : 'Setup required'} color={line?.isActive ? 'success' : 'warning'} />
        </>
      }
      stats={[
        { label: 'Shipping lines', value: data.length, hint: 'Single-line deployment', tone: 'primary' },
        { label: 'Brand color', value: brandColor, hint: 'Current theme accent', tone: 'info' },
        { label: 'Logo', value: displayLogoPath || logoPreview ? 'Uploaded' : 'Not set', hint: 'Portal & document branding', tone: 'default' },
      ]}
    >
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {!line && !isFetching && (
        <Alert severity="warning">
          No shipping line configured. Seed the database or create one via migration/seed.
        </Alert>
      )}
      {line && (
        <Stack spacing={2.5}>
          <WorkflowSection
            title="Shipping line logo"
            subtitle="Upload a recognizable logo for this shipping line."
          >
            <ShippingLineLogoField
              brandName={brandName}
              brandColor={brandColor}
              existingLogoPath={displayLogoPath}
              previewUrl={logoPreview}
              onFileSelect={onLogoSelect}
              onClear={displayLogoPath || logoPreview ? onLogoClear : undefined}
              error={logoError}
            />
          </WorkflowSection>

          <WorkflowSection title="Visual identity" subtitle="Update the shipping line name and color used across the Shipping portal.">
            <Typography variant="body2" color="text.secondary" mb={2}>
              OPTIMUS uses a single shipping line. Update brand details here only.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
              <TextField
                label="Brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Brand color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <Button variant="contained" onClick={onSave} disabled={isSaving || !brandName}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </Stack>
          </WorkflowSection>
        </Stack>
      )}
    </WorkflowPage>
  );
}
