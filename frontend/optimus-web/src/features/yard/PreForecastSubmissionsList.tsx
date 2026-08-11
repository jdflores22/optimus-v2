import { useNavigate } from 'react-router-dom';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import { preForecastDisplayStatus, preForecastDisplayStatusColor } from './preForecastStatus';
import { preForecastDetailPath } from './preForecastPaths';

type Props = {
  list: TruckerPreForecastSubmissionDto[];
  isLoading?: boolean;
  emptyMessage?: string;
  limit?: number;
};

export function PreForecastSubmissionsList({ list, isLoading, emptyMessage, limit }: Props) {
  const navigate = useNavigate();
  const visible = limit ? list.slice(0, limit) : list;

  if (isLoading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading submissions…
      </Typography>
    );
  }

  if (list.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          No submissions yet
        </Typography>
        <Typography color="text.secondary">{emptyMessage ?? 'Submissions will appear here when available.'}</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      {visible.map((p) => (
        <Paper
          key={p.id}
          elevation={0}
          onClick={() => navigate(preForecastDetailPath(p.id))}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            cursor: 'pointer',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: 1,
            },
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
            <Box minWidth={0} flex={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mb={0.5}>
                <Typography fontWeight={800}>{p.containerNumber}</Typography>
                <Chip
                  size="small"
                  label={preForecastDisplayStatus(p)}
                  color={preForecastDisplayStatusColor(p)}
                  variant="outlined"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {p.expiredEdoNumber}
                {p.assignedTerminalName
                  ? ` · ${p.assignedTerminalName}`
                  : p.preferredTerminalName
                    ? ` · pref. ${p.preferredTerminalName}`
                    : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                Return {p.returnDate.slice(0, 10)}
                {p.detentionAmount > 0 ? ` · Est. detention ₱${p.detentionAmount.toLocaleString()}` : ''}
              </Typography>
            </Box>
            <ChevronRightOutlinedIcon sx={{ color: 'text.secondary', mt: 0.5 }} />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
