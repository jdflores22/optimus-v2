import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { TruckerPreForecastSearchResultDto, TruckerPreForecastSubmissionDto } from '../../shared/types';
import { CONTAINER_PHOTO_CATEGORIES } from '../../shared/containerPhotoCategories';
import { VerifiedContainerDetailsCard } from './VerifiedContainerDetailsCard';
import { preForecastDetailPath } from './preForecastPaths';

type Props = {
  submission: TruckerPreForecastSubmissionDto;
  verifiedMatch: TruckerPreForecastSearchResultDto | null;
  returnDate: string;
  releaseDocName?: string | null;
  photoCount: number;
  preferredTerminalName?: string | null;
  onStartAnother: () => void;
};

function NextStepRow({
  icon,
  title,
  detail,
  active,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: active ? 'primary.main' : 'action.hover',
          color: active ? 'primary.contrastText' : 'text.secondary',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography variant="body2" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {detail}
        </Typography>
      </Box>
    </Stack>
  );
}

export function PreForecastSubmittedPanel({
  submission,
  verifiedMatch,
  returnDate,
  releaseDocName,
  photoCount,
  preferredTerminalName,
  onStartAnother,
}: Props) {
  const cyLabel =
    submission.preferredTerminalName ??
    preferredTerminalName ??
    submission.assignedTerminalName ??
    null;

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 2,
          bgcolor: (theme) => `${theme.palette.success.main}14`,
          border: 1,
          borderColor: 'success.light',
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
          <Box flex={1}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Pre-forecast submitted
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={1.5}>
              {submission.message}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: 'center', sm: 'flex-start' }}>
              <Chip size="small" label={submission.status} color="success" variant="outlined" />
              {cyLabel && (
                <Chip
                  size="small"
                  icon={<StorefrontOutlinedIcon />}
                  label={cyLabel}
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {verifiedMatch && <VerifiedContainerDetailsCard match={verifiedMatch} showSourceNote={false} />}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2}>
          Submission summary
        </Typography>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              Return date
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {returnDate}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              Preferred CY
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {cyLabel ?? 'No preference — terminal will assign'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              Release document
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {releaseDocName ?? '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              Identity photos
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {photoCount} of {CONTAINER_PHOTO_CATEGORIES.length} views
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2}>
          What happens next
        </Typography>
        <Stack spacing={2}>
          <NextStepRow
            active
            icon={<LocalShippingOutlinedIcon fontSize="small" />}
            title="Terminal team assigns CY"
            detail="Shipping line / terminal staff pick a container yard with available allocation or slot."
          />
          <NextStepRow
            icon={<StorefrontOutlinedIcon fontSize="small" />}
            title="CY confirms free-day schedule"
            detail="Your assigned CY confirms they can accept the empty return on the agreed date."
          />
          <NextStepRow
            icon={<AccountBalanceOutlinedIcon fontSize="small" />}
            title="Accounting & detention (if applicable)"
            detail="If the CRO/eDO is past free time, detention is billed to broker/consignee after CY confirmation."
          />
          <NextStepRow
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            title="New CRO/eDO (pay to open)"
            detail="After payment is validated, a renewed CRO/eDO is issued — same pay-to-open rules as a new release."
          />
        </Stack>
      </Paper>

      <Divider />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" onClick={onStartAnother}>
          Submit another pre-forecast
        </Button>
        <Button
          component={RouterLink}
          to={preForecastDetailPath(submission.id)}
          variant="outlined"
        >
          View submission details
        </Button>
        <Typography variant="caption" color="text.secondary" alignSelf="center">
          Or track status in My submissions.
        </Typography>
      </Stack>
    </Stack>
  );
}
