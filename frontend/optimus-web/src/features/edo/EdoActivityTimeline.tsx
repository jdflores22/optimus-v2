import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import type { AuditTrailDto } from '../../shared/types';
import { formatEdoStatus } from '../../shared/formatEdoStatus';

type FilterKey = 'all' | 'release' | 'payment' | 'access' | 'system';

type EventMeta = {
  title: string;
  subtitle?: string;
  category: FilterKey;
  tone: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  icon: ReactNode;
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatStatusLabel(value?: string | null) {
  if (!value) return '—';
  return formatEdoStatus(value);
}

function categorize(entry: AuditTrailDto): FilterKey {
  if (entry.source === 'release') return 'release';
  if (entry.source === 'access') return 'access';
  if (/payment/i.test(entry.event)) return 'payment';
  return 'system';
}

function resolveEventMeta(entry: AuditTrailDto): EventMeta {
  const event = entry.event.toLowerCase();

  if (entry.source === 'release') {
    const rejected = /reject/i.test(entry.to ?? '') || Boolean(entry.notes?.trim());
    return {
      title: rejected ? 'Release rejected' : 'Status updated',
      subtitle:
        entry.from || entry.to
          ? `${formatStatusLabel(entry.from)} → ${formatStatusLabel(entry.to)}`
          : undefined,
      category: 'release',
      tone: rejected ? 'error' : /released/i.test(entry.to ?? '') ? 'success' : 'primary',
      icon: rejected ? <BlockOutlinedIcon fontSize="small" /> : <SendOutlinedIcon fontSize="small" />,
    };
  }

  if (entry.source === 'access') {
    const denied = /denied|fail|block/i.test(entry.event);
    return {
      title: denied ? 'Access denied' : 'Document accessed',
      subtitle: entry.event.replace(/_/g, ' '),
      category: 'access',
      tone: denied ? 'warning' : 'info',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
    };
  }

  if (event === 'edo.generate') {
    return {
      title: 'eDO / CRO generated',
      subtitle: entry.notes ?? undefined,
      category: 'system',
      tone: 'primary',
      icon: <AutoAwesomeOutlinedIcon fontSize="small" />,
    };
  }

  if (event === 'edo.release') {
    return {
      title: 'Released to broker workflow',
      subtitle: entry.notes ?? undefined,
      category: 'release',
      tone: 'success',
      icon: <CheckCircleOutlineOutlinedIcon fontSize="small" />,
    };
  }

  if (event === 'edo.reject') {
    return {
      title: 'Release rejected',
      subtitle: entry.notes ?? undefined,
      category: 'release',
      tone: 'error',
      icon: <BlockOutlinedIcon fontSize="small" />,
    };
  }

  if (event === 'edo.unlock') {
    return {
      title: 'eDO unlocked',
      subtitle: entry.notes ?? undefined,
      category: 'release',
      tone: 'warning',
      icon: <LockOpenOutlinedIcon fontSize="small" />,
    };
  }

  if (event === 'edo_payment.submit') {
    return {
      title: 'Payment receipt submitted',
      subtitle: entry.notes ? `Amount ${entry.notes}` : undefined,
      category: 'payment',
      tone: 'warning',
      icon: <CreditCardOutlinedIcon fontSize="small" />,
    };
  }

  if (event === 'edo_payment.verify') {
    return {
      title: 'Payment verified',
      subtitle: entry.notes ?? undefined,
      category: 'payment',
      tone: 'success',
      icon: <CheckCircleOutlineOutlinedIcon fontSize="small" />,
    };
  }

  if (event === 'edo_payment.reject') {
    return {
      title: 'Payment rejected',
      subtitle: entry.notes ?? undefined,
      category: 'payment',
      tone: 'error',
      icon: <BlockOutlinedIcon fontSize="small" />,
    };
  }

  return {
    title: entry.event.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: entry.notes ?? undefined,
    category: 'system',
    tone: 'default',
    icon: <HistoryOutlinedIcon fontSize="small" />,
  };
}

const TONE_COLORS = {
  primary: { dot: 'primary.main', border: 'rgba(11,61,92,0.28)', bg: 'rgba(11,61,92,0.03)', iconBg: 'rgba(11,61,92,0.1)' },
  success: { dot: 'success.main', border: 'rgba(46,125,50,0.28)', bg: 'rgba(46,125,50,0.04)', iconBg: 'rgba(46,125,50,0.12)' },
  warning: { dot: 'warning.main', border: 'rgba(237,108,0,0.28)', bg: 'rgba(237,108,0,0.04)', iconBg: 'rgba(237,108,0,0.12)' },
  error: { dot: 'error.main', border: 'rgba(211,47,47,0.28)', bg: 'rgba(211,47,47,0.04)', iconBg: 'rgba(211,47,47,0.1)' },
  info: { dot: 'info.main', border: 'rgba(2,119,189,0.28)', bg: 'rgba(2,119,189,0.04)', iconBg: 'rgba(2,119,189,0.1)' },
  default: { dot: 'text.secondary', border: 'divider', bg: 'background.default', iconBg: 'action.hover' },
} as const;

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  release: 'Release',
  payment: 'Payment',
  access: 'Access',
  system: 'System',
};

export function EdoActivityTimeline({
  audit,
  isLoading,
}: {
  audit: AuditTrailDto[];
  isLoading?: boolean;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: audit.length,
      release: 0,
      payment: 0,
      access: 0,
      system: 0,
    };
    for (const entry of audit) {
      base[categorize(entry)] += 1;
    }
    return base;
  }, [audit]);

  const filtered = useMemo(() => {
    if (filter === 'all') return audit;
    return audit.filter((entry) => categorize(entry) === filter);
  }, [audit, filter]);

  if (isLoading && audit.length === 0) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading activity trail…
        </Typography>
      </Box>
    );
  }

  if (audit.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          py: 6,
          px: 3,
          textAlign: 'center',
          border: 1,
          borderStyle: 'dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <HistoryOutlinedIcon color="disabled" sx={{ fontSize: 42, mb: 1 }} />
        <Typography fontWeight={700}>No activity recorded yet</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.75}>
          Generation, payment, access, and release events will appear here as this eDO moves through the workflow.
        </Typography>
      </Paper>
    );
  }

  const latestIndex = filtered.length - 1;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => {
          const count = counts[key];
          if (key !== 'all' && count === 0) return null;
          return (
            <Chip
              key={key}
              size="small"
              label={`${FILTER_LABELS[key]} (${count})`}
              color={filter === key ? 'primary' : 'default'}
              variant={filter === key ? 'filled' : 'outlined'}
              onClick={() => setFilter(key)}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
          );
        })}
      </Stack>

      {filtered.length === 0 ? (
        <Alert severity="info" variant="outlined">
          No {FILTER_LABELS[filter].toLowerCase()} events for this eDO.
        </Alert>
      ) : (
        <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {filtered.map((entry, index) => {
            const meta = resolveEventMeta(entry);
            const colors = TONE_COLORS[meta.tone];
            const isLatest = index === latestIndex;
            const isFirst = index === 0;
            const isRejection = meta.tone === 'error' && Boolean(entry.notes?.trim());

            return (
              <Box
                key={`${entry.at}-${entry.event}-${index}`}
                component="li"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '36px minmax(0, 1fr)', sm: '44px minmax(0, 1fr)' },
                  columnGap: 1.5,
                  opacity: 0,
                  animation: 'edoActivityIn 320ms ease forwards',
                  animationDelay: `${Math.min(index, 10) * 35}ms`,
                  '@keyframes edoActivityIn': {
                    from: { opacity: 0, transform: 'translateY(6px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  {!isFirst && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: '50%',
                        width: 2,
                        bgcolor: 'rgba(11,61,92,0.14)',
                      }}
                    />
                  )}
                  {!isLatest && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        bottom: 0,
                        width: 2,
                        bgcolor: 'rgba(11,61,92,0.14)',
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      mt: 1.5,
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: colors.iconBg,
                      color: colors.dot,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      border: 2,
                      borderColor: isLatest ? colors.dot : 'background.paper',
                      boxShadow: isLatest ? `0 0 0 4px ${colors.iconBg}` : 'none',
                    }}
                  >
                    {meta.icon}
                  </Box>
                </Box>

                <Box
                  sx={{
                    mb: isLatest ? 0 : 1.75,
                    px: 2,
                    py: 1.5,
                    border: 1,
                    borderColor: isLatest ? colors.border : 'divider',
                    borderRadius: 2,
                    bgcolor: isLatest ? colors.bg : 'background.paper',
                    transition: 'border-color 160ms ease, background-color 160ms ease',
                  }}
                >
                  <Stack spacing={0.75}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ sm: 'flex-start' }}
                      spacing={1}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography fontWeight={700} sx={{ fontSize: 15, lineHeight: 1.3 }}>
                          {meta.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={FILTER_LABELS[meta.category]}
                          variant="outlined"
                          sx={{ height: 20, fontWeight: 600, fontSize: 11 }}
                        />
                        {isLatest && (
                          <Chip size="small" label="Latest" color="primary" sx={{ height: 20, fontWeight: 700 }} />
                        )}
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
                      >
                        {formatWhen(entry.at)}
                      </Typography>
                    </Stack>

                    {meta.subtitle && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                        {meta.subtitle}
                      </Typography>
                    )}

                    {entry.actor && (
                      <Typography variant="caption" color="text.secondary">
                        By <strong>{entry.actor}</strong>
                        {entry.source === 'access' && entry.notes ? ` · IP ${entry.notes}` : ''}
                      </Typography>
                    )}

                    {isRejection && entry.notes && entry.source !== 'access' && (
                      <Alert severity="error" variant="outlined" sx={{ mt: 0.5, py: 0 }}>
                        {entry.notes}
                      </Alert>
                    )}

                    {entry.notes && entry.source === 'release' && !isRejection && entry.notes.trim() && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Note: {entry.notes}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
