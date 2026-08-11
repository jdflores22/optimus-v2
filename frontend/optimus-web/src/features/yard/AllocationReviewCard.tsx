import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { TerminalLogoAvatar } from '../../shared/TerminalLogoAvatar';
import type { ContractAvailabilityCard } from './contractAvailabilityCards';

function utilizationTone(pct: number): string {
  if (pct >= 100) return 'error.main';
  if (pct >= 90) return 'warning.main';
  return 'success.main';
}

function MetricBar({ pct }: { pct: number }) {
  const clamped = Math.max(Math.min(pct, 100), 0);
  return (
    <Box sx={{ height: 6, borderRadius: 99, bgcolor: 'action.hover', overflow: 'hidden' }}>
      <Box
        sx={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 99,
          bgcolor: utilizationTone(pct),
          transition: 'width 0.2s ease',
        }}
      />
    </Box>
  );
}

function SizeMetric({
  label,
  used,
  limit,
  available,
  pending,
}: {
  label: string;
  used: number;
  limit: number;
  available: number;
  pending?: number;
}) {
  const pct = limit ? Math.round((used / limit) * 1000) / 10 : 0;

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.4}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={0.5} mt={0.35} mb={0.75}>
        <Typography fontWeight={800} fontSize="1.1rem" lineHeight={1}>
          {used}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          / {limit}
        </Typography>
      </Stack>
      <MetricBar pct={pct} />
      <Stack direction="row" justifyContent="space-between" mt={0.75}>
        <Typography variant="caption" color="text.secondary">
          {available} available
        </Typography>
        {pending != null && pending > 0 && (
          <Typography variant="caption" color="warning.main" fontWeight={700}>
            +{pending} pending
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

type Props = {
  card: ContractAvailabilityCard;
  selected?: boolean;
  selectable?: boolean;
  preferred?: boolean;
  referenceOnly?: boolean;
  onSelect?: () => void;
};

export function AllocationReviewCard({
  card,
  selected = false,
  selectable = false,
  preferred = false,
  referenceOnly = false,
  onSelect,
}: Props) {
  const teuPct = card.capacityTeu ? Math.round((card.usedTeu / card.capacityTeu) * 1000) / 10 : 0;
  const atCapacity = card.capacityTeu > 0 && card.usedTeu >= card.capacityTeu;

  return (
    <Paper
      elevation={0}
      onClick={selectable && !referenceOnly ? onSelect : undefined}
      sx={{
        p: 2,
        borderRadius: 2,
        border: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? (theme) => `${theme.palette.primary.main}06` : 'background.paper',
        cursor: selectable && !referenceOnly ? 'pointer' : 'default',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
        '&:hover': selectable && !referenceOnly
          ? { borderColor: 'primary.light', boxShadow: 1 }
          : undefined,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.75}>
        <TerminalLogoAvatar logoPath={card.logoPath} code={card.code} kind={card.kind} size={44} />
        <Box minWidth={0} flex={1}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap mb={0.35}>
            <Typography fontWeight={800} fontSize="1.05rem" lineHeight={1.2} noWrap title={card.code}>
              {card.code}
            </Typography>
            <Chip
              size="small"
              label={card.kind === 'port' ? 'Port' : 'CY'}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
            />
            {selected && (
              <Chip
                size="small"
                icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                label="Selected"
                color="primary"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" noWrap title={card.name}>
            {card.name}
          </Typography>
          {card.subtitle && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
              {card.subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      <Box
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 1.5,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
            TEU UTILIZATION
          </Typography>
          <Typography variant="caption" fontWeight={800} color={utilizationTone(teuPct)}>
            {teuPct}%
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={0.5} mb={0.75}>
          <Typography fontWeight={800} fontSize="1.35rem" lineHeight={1}>
            {card.usedTeu}
          </Typography>
          <Typography color="text.secondary" fontWeight={600}>
            / {card.capacityTeu} TEU
          </Typography>
        </Stack>
        <MetricBar pct={teuPct} />
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={1} mb={1.5} flex={1}>
        <SizeMetric
          label="20ft capacity"
          used={card.allocated20}
          limit={card.capacity20}
          available={card.available20}
          pending={card.pending20}
        />
        <SizeMetric
          label="40ft capacity"
          used={card.allocated40}
          limit={card.capacity40}
          available={card.available40}
          pending={card.pending40}
        />
      </Box>

      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mb={selectable && !referenceOnly ? 1.25 : 0}>
        {preferred && (
          <Chip size="small" label="Trucker preference" color="info" variant="outlined" sx={{ height: 22 }} />
        )}
        {atCapacity && (
          <Chip size="small" label="At capacity" color="warning" variant="outlined" sx={{ height: 22 }} />
        )}
        {referenceOnly && (
          <Chip size="small" label="Reference only" variant="outlined" sx={{ height: 22 }} />
        )}
      </Stack>

      {selectable && !referenceOnly && (
        <Button
          fullWidth
          size="small"
          variant={selected ? 'contained' : 'outlined'}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
        >
          {selected ? 'Selected for assignment' : 'Select this CY'}
        </Button>
      )}
    </Paper>
  );
}

export function AllocationReviewGrid({
  cards,
  selectedTerminalId,
  preferredTerminalId,
  preferredTerminalName,
  selectable = false,
  referenceOnly = false,
  onSelect,
}: {
  cards: ContractAvailabilityCard[];
  selectedTerminalId?: string;
  preferredTerminalId?: string | null;
  preferredTerminalName?: string | null;
  selectable?: boolean;
  referenceOnly?: boolean;
  onSelect?: (terminalId: string) => void;
}) {
  if (cards.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No active contracts found for your shipping line.
      </Typography>
    );
  }

  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        lg: 'repeat(3, minmax(0, 1fr))',
      }}
      gap={1.5}
    >
      {cards.map((card) => {
        const isPreferred =
          card.terminalId === preferredTerminalId || card.name === preferredTerminalName;
        return (
          <AllocationReviewCard
            key={card.allocationId}
            card={card}
            selected={selectedTerminalId === card.terminalId}
            selectable={selectable}
            preferred={isPreferred}
            referenceOnly={referenceOnly}
            onSelect={() => onSelect?.(card.terminalId)}
          />
        );
      })}
    </Box>
  );
}
