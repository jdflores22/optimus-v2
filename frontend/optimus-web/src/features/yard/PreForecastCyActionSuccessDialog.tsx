import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

type Props = {
  open: boolean;
  variant: 'confirmed' | 'declined';
  title: string;
  message: string;
  containerNumber?: string;
  confirmedDate?: string;
  onClose: () => void;
  onBackToQueue?: () => void;
};

export function PreForecastCyActionSuccessDialog({
  open,
  variant,
  title,
  message,
  containerNumber,
  confirmedDate,
  onClose,
  onBackToQueue,
}: Props) {
  const isSuccess = variant === 'confirmed';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ pt: 3, pb: 1, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            mx: 'auto',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) =>
              isSuccess ? `${theme.palette.success.main}18` : `${theme.palette.error.main}12`,
          }}
        >
          {isSuccess ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'success.main' }} />
          ) : (
            <CancelOutlinedIcon sx={{ fontSize: 40, color: 'error.main' }} />
          )}
        </Box>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          {title}
        </Typography>
        {containerNumber && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            Container <strong>{containerNumber}</strong>
            {confirmedDate ? (
              <>
                {' '}
                · return <strong>{confirmedDate}</strong>
              </>
            ) : null}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
        {onBackToQueue && (
          <Button variant="contained" fullWidth onClick={onBackToQueue}>
            Back to pre-forecast queue
          </Button>
        )}
        <Button variant="outlined" fullWidth onClick={onClose}>
          Stay on this page
        </Button>
      </DialogActions>
    </Dialog>
  );
}
