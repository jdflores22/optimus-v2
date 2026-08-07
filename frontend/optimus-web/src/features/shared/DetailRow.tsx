import { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      spacing={{ xs: 0.25, sm: 2 }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      py={0.75}
    >
      <Typography variant="body2" color="text.secondary" component="span">
        {label}
      </Typography>
      <Box
        sx={{
          typography: 'body2',
          fontWeight: 600,
          textAlign: { xs: 'left', sm: 'right' },
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Box>
    </Stack>
  );
}

export function SectionPanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1.5}
      px={{ xs: 1.5, sm: 2.5 }}
      py={2}
    >
      <Stack spacing={0.25} minWidth={0}>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {action}
    </Stack>
  );
}
