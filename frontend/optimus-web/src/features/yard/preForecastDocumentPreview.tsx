import { Alert, Box, Button, Stack } from '@mui/material';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { API_BASE_URL } from '../../shared/types';

export function preForecastFileUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function isImagePath(path: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}

export function PreForecastDocumentPreview({
  url,
  title,
  emptyMessage,
}: {
  url: string | null;
  title: string;
  emptyMessage: string;
}) {
  if (!url) {
    return (
      <Alert severity="info" variant="outlined">
        {emptyMessage}
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          minHeight: { xs: 360, md: 520 },
        }}
      >
        {isImagePath(url) ? (
          <Box
            component="img"
            src={url}
            alt={title}
            sx={{
              display: 'block',
              width: '100%',
              height: { xs: 360, md: 520 },
              objectFit: 'contain',
              bgcolor: 'grey.50',
            }}
          />
        ) : (
          <Box
            component="iframe"
            title={title}
            src={url}
            sx={{ width: '100%', height: { xs: 360, md: 520 }, border: 0, display: 'block' }}
          />
        )}
      </Box>
      <Button
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        size="small"
        startIcon={<OpenInNewOutlinedIcon />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Open in new tab
      </Button>
    </Stack>
  );
}
