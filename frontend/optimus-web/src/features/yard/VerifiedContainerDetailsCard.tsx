import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import type { TruckerPreForecastSearchResultDto } from '../../shared/types';

type Props = {
  match: TruckerPreForecastSearchResultDto;
  compact?: boolean;
  showSourceNote?: boolean;
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function VerifiedContainerDetailsCard({ match, compact, showSourceNote = true }: Props) {
  const vesselVoyage = [match.vesselName, match.voyageNumber].filter(Boolean).join(' / ') || null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 2 : 2.5,
        borderColor: 'success.main',
        borderWidth: compact ? 1 : 2,
        borderRadius: 2,
        bgcolor: 'action.hover',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <VerifiedOutlinedIcon color="success" sx={{ mt: 0.25 }} />
          <Box flex={1} minWidth={0}>
            <Typography variant="overline" color="success.main" fontWeight={700} lineHeight={1.2}>
              Verified from QR
            </Typography>
            <Typography fontWeight={800} letterSpacing="0.04em" fontSize={compact ? '1.05rem' : '1.25rem'}>
              {match.containerNumber}
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.75}>
              {match.containerSize && <Chip size="small" label={match.containerSize} variant="outlined" />}
              {match.containerType && <Chip size="small" label={match.containerType} variant="outlined" />}
              {match.edoStatus && (
                <Chip size="small" label={match.edoStatus} color={match.edoExpired ? 'warning' : 'default'} />
              )}
            </Stack>
          </Box>
        </Stack>

        <Box
          display="grid"
          gridTemplateColumns={compact ? '1fr' : { xs: '1fr', sm: '1fr 1fr' }}
          gap={1.75}
        >
          <DetailRow label="CRO / eDO" value={match.edoNumber} />
          <DetailRow label="Shipping line" value={match.shippingLineName} />
          <DetailRow label="Manifest" value={match.manifestNumber} />
          <DetailRow label="B/L" value={match.blNumber} />
          <DetailRow label="Vessel / voyage" value={vesselVoyage} />
          <DetailRow label="Consignee" value={match.consigneeName} />
          <DetailRow label="Broker" value={match.brokerName} />
          <DetailRow label="Return empty to" value={match.cyLocation} />
          <DetailRow label="Free time until" value={formatDate(match.edoExpiresAt)} />
          <DetailRow label="Container status" value={match.containerStatus} />
        </Box>

        {match.edoExpired && (
          <Alert severity="warning" sx={{ py: 0.5 }}>
            CRO/eDO expired — renewal may require detention payment before a new release.
          </Alert>
        )}
        {match.estimatedDetention > 0 && (
          <Alert severity="error" sx={{ py: 0.5 }}>
            Past free time — est. detention ₱{match.estimatedDetention.toLocaleString()}
            {match.overdueDays > 0 ? ` (${match.overdueDays} day${match.overdueDays === 1 ? '' : 's'} overdue)` : ''}
          </Alert>
        )}

        {showSourceNote && (
          <Typography variant="caption" color="text.secondary">
            These details were loaded from the CRO/eDO QR and cannot be edited manually.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
