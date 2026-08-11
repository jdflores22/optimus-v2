import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import { PreForecastAccountingPanel } from './PreForecastAccountingPanel';

type Props = {
  submission: TruckerPreForecastSubmissionDto | null;
  open: boolean;
  onClose: () => void;
  onFinalized?: (message: string) => void;
};

export function PreForecastAccountingDialog({ submission, open, onClose, onFinalized }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Finalize detention billing</DialogTitle>
      <DialogContent>
        {submission && (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Container <strong>{submission.containerNumber}</strong> · expired CRO/eDO{' '}
              <strong>{submission.expiredEdoNumber}</strong>
            </Typography>
            <PreForecastAccountingPanel
              submission={submission}
              layout="compact"
              onFinalized={(msg) => {
                onFinalized?.(msg);
                onClose();
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
