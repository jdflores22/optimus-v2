import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { TerminalLogoAvatar } from '../../shared/TerminalLogoAvatar';

export type ContractTeuLocationCardProps = {
  name: string;
  subtitle?: string;
  code: string;
  logoPath?: string | null;
  kind: 'port' | 'cy';
  usedTeu: number;
  capacityTeu: number;
  capacity20: number;
  capacity40: number;
  allocated20: number;
  allocated40: number;
  pending20?: number;
  pending40?: number;
  footerAction?: { label: string; to: string };
  unitLimit20Label?: string;
  unitLimit40Label?: string;
  typeLabel?: string;
};

function utilizationTone(pct: number): 'success.main' | 'warning.main' | 'error.main' {
  if (pct >= 100) return 'error.main';
  if (pct >= 90) return 'warning.main';
  return 'success.main';
}

function UtilizationBar({ pct }: { pct: number }) {
  const clamped = Math.max(Math.min(pct, 100), 0);
  return (
    <Box sx={{ height: 10, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
      <Box
        sx={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 999,
          bgcolor: utilizationTone(pct),
          transition: 'width 0.2s ease',
        }}
      />
    </Box>
  );
}

function UnitLimitRow({
  label,
  used,
  limit,
  pending,
}: {
  label: string;
  used: number;
  limit: number;
  pending?: number;
}) {
  const pct = limit ? Math.round((used / limit) * 1000) / 10 : 0;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {pct}%
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="baseline" spacing={0.5} mb={0.75}>
        <Typography fontWeight={800} fontSize="1.05rem">
          {used}
        </Typography>
        {pending != null && pending > 0 && (
          <Typography fontWeight={700} fontSize="0.95rem" color="warning.main">
            +{pending} pending
          </Typography>
        )}
        <Typography color="text.secondary" fontWeight={600}>
          / {limit}
        </Typography>
      </Stack>
      <UtilizationBar pct={pct} />
    </Box>
  );
}

export function ContractTeuLocationCard({
  name,
  subtitle,
  code,
  logoPath,
  kind,
  usedTeu,
  capacityTeu,
  capacity20,
  capacity40,
  allocated20,
  allocated40,
  pending20,
  pending40,
  footerAction,
  unitLimit20Label = '20ft Returns',
  unitLimit40Label = '40ft Returns',
  typeLabel,
}: ContractTeuLocationCardProps) {
  const utilizationPct = capacityTeu ? Math.round((usedTeu / capacityTeu) * 1000) / 10 : 0;

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2.5, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5} mb={2}>
        <Box minWidth={0} flex={1}>
          <Typography fontWeight={800} fontSize="1.2rem" lineHeight={1.2} noWrap title={code || name}>
            {code || name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }} noWrap title={subtitle ?? name}>
            {subtitle ?? name}
          </Typography>
          {typeLabel && (
            <Chip
              size="small"
              label={typeLabel}
              sx={{
                mt: 0.75,
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: kind === 'port' ? 'primary.main' : 'text.primary',
                color: kind === 'port' ? 'primary.contrastText' : 'background.paper',
              }}
            />
          )}
        </Box>
        <TerminalLogoAvatar logoPath={logoPath} code={code} kind={kind} size={52} />
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          TEU Capacity
        </Typography>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {utilizationPct}%
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={0.5} mb={1}>
        <Typography fontWeight={800} fontSize="1.65rem" lineHeight={1}>
          {usedTeu}
        </Typography>
        <Typography color="text.secondary" fontWeight={600} fontSize="1.05rem">
          / {capacityTeu} TEUs
        </Typography>
      </Stack>

      <UtilizationBar pct={utilizationPct} />

      <Stack direction="row" spacing={2} mt={1.25} mb={1.5}>
        <Typography variant="body2" color="text.secondary">
          20ft:{' '}
          <Typography component="span" fontWeight={700} color="text.primary">
            {allocated20}
          </Typography>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          40ft:{' '}
          <Typography component="span" fontWeight={700} color="text.primary">
            {allocated40}
          </Typography>
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.25 }} />

      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        letterSpacing={0.6}
        display="block"
        mb={1}
      >
        UNIT LIMITS
      </Typography>

      <UnitLimitRow label={unitLimit20Label} used={allocated20} limit={capacity20} pending={pending20} />
      <UnitLimitRow label={unitLimit40Label} used={allocated40} limit={capacity40} pending={pending40} />

      {footerAction && (
        <Button
          component={RouterLink}
          to={footerAction.to}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mt: 1.5 }}
        >
          {footerAction.label}
        </Button>
      )}
    </Paper>
  );
}
