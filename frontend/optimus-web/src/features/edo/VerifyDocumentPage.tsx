import { Alert, Paper, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useVerifyDocumentQuery } from '../../app/api';

export function VerifyDocumentPage() {
  const params = useParams();
  const token = params.token ?? '';
  const { data, error, isLoading } = useVerifyDocumentQuery(token, { skip: !token });

  if (isLoading) return <Typography>Verifying...</Typography>;
  if (error || !data) return <Alert severity="error">Unable to verify document.</Alert>;

  return (
    <Stack spacing={2} maxWidth={560} mx="auto" mt={{ xs: 3, sm: 6 }} px={{ xs: 2, sm: 0 }}>
      <Typography variant="h4">Document verification</Typography>
      <Alert severity={data.valid ? 'success' : 'error'}>{data.message}</Alert>
      {data.valid && (
        <Paper sx={{ p: 2 }}>
          <Typography>Type: {data.documentType}</Typography>
          <Typography>Number: {data.documentNumber}</Typography>
          <Typography>Status: {data.status ?? '—'}</Typography>
          <Typography>
            Expires: {data.expiresAt ? new Date(data.expiresAt).toLocaleString() : '—'}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}
