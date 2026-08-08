import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { Button, type ButtonProps } from '@mui/material';
import { useLazyGetAccreditationCertificateQuery } from '../../app/api';
import { API_BASE_URL } from '../../shared/types';

type AccreditationCertificateButtonProps = {
  submissionId: string;
  label?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
};

export function AccreditationCertificateButton({
  submissionId,
  label = 'Download certificate',
  size = 'small',
  variant = 'contained',
}: AccreditationCertificateButtonProps) {
  const [fetchCertificate, { isFetching }] = useLazyGetAccreditationCertificateQuery();

  const openCertificate = async () => {
    const { path } = await fetchCertificate(submissionId).unwrap();
    window.open(`${API_BASE_URL}${path}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant}
      color="success"
      size={size}
      startIcon={<DownloadOutlinedIcon />}
      onClick={() => void openCertificate().catch(() => undefined)}
      disabled={isFetching}
    >
      {isFetching ? 'Preparing…' : label}
    </Button>
  );
}
