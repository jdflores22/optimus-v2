import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';

type Props = {
  open: boolean;
  containerNumber: string;
  totalLabel: string;
  brokerName?: string | null;
  consigneeName?: string | null;
  onBackToQueue: () => void;
  onOpenPdf?: () => void;
};

function partyLabel(brokerName?: string | null, consigneeName?: string | null) {
  const broker = brokerName?.trim();
  const consignee = consigneeName?.trim();
  if (broker && consignee) {
    if (broker === consignee) return broker;
    return `${broker} and ${consignee}`;
  }
  return broker ?? consignee ?? 'the broker and consignee';
}

export function PreForecastBillingSuccessDialog({
  open,
  containerNumber,
  totalLabel,
  brokerName,
  consigneeName,
  onBackToQueue,
  onOpenPdf,
}: Props) {
  const notified = partyLabel(brokerName, consigneeName);

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
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
            bgcolor: (theme) => `${theme.palette.success.main}18`,
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'success.main' }} />
        </Box>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          Detention billing generated
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          Container <strong>{containerNumber}</strong> · Total <strong>{totalLabel}</strong>
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            textAlign: 'left',
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
            mb: 1,
          }}
        >
          <NotificationsActiveOutlinedIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />
          <Typography variant="body2" color="text.secondary">
            <strong>{notified}</strong> have been notified in Optimus to review the detention statement and submit
            payment.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
        {onOpenPdf && (
          <Button variant="contained" fullWidth startIcon={<OpenInNewOutlinedIcon />} onClick={onOpenPdf}>
            Open billing PDF
          </Button>
        )}
        <Button variant={onOpenPdf ? 'outlined' : 'contained'} fullWidth onClick={onBackToQueue}>
          Back to pre-forecast queue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
