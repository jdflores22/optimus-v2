import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import {
  buildMonthCalendarGrid,
  formatMonthYearLabel,
  parseDateKey,
  shiftMonth,
  todayDateKey,
  weekdayLabels,
} from '../yard/cyIntakeSchedule';

type Props = {
  intake: TruckerPreForecastSubmissionDto[];
  year: number;
  month: number;
  selectedDate: string;
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (dateKey: string) => void;
};

function DayCountDot({ value, tone }: { value: number; tone: 'confirmed' | 'pending' }) {
  if (value <= 0) return null;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        px: 0.5,
        borderRadius: '50%',
        bgcolor: tone === 'confirmed' ? 'success.light' : 'warning.light',
        color: tone === 'confirmed' ? 'success.dark' : 'warning.dark',
        fontWeight: 800,
        fontSize: '0.7rem',
        lineHeight: 1,
      }}
    >
      {value}
    </Box>
  );
}

export function CyMonthScheduleCalendar({
  intake,
  year,
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: Props) {
  const cells = buildMonthCalendarGrid(intake, year, month);
  const today = todayDateKey();

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}
      >
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={() => {
            const next = shiftMonth(year, month, -1);
            onMonthChange(next.year, next.month);
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography fontWeight={800} fontSize="1.05rem">
          {formatMonthYearLabel(year, month)}
        </Typography>
        <IconButton
          size="small"
          aria-label="Next month"
          onClick={() => {
            const next = shiftMonth(year, month, 1);
            onMonthChange(next.year, next.month);
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        {weekdayLabels().map((label) => (
          <Box
            key={label}
            sx={{
              py: 1,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: 'text.secondary',
              borderRight: 1,
              borderColor: 'divider',
              '&:last-of-type': { borderRight: 0 },
            }}
          >
            {label}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        }}
      >
        {cells.map((cell) => {
          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === today;
          const hasActivity = cell.confirmed > 0 || cell.pending > 0;

          return (
            <Box
              key={cell.dateKey}
              component="button"
              type="button"
              onClick={() => onSelectDate(cell.dateKey)}
              sx={{
                minHeight: { xs: 72, sm: 88 },
                p: 1,
                border: 0,
                borderRight: 1,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: isSelected ? 'primary.50' : 'background.paper',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                opacity: cell.inMonth ? 1 : 0.45,
                transition: 'background-color 120ms ease, box-shadow 120ms ease',
                '&:nth-of-type(7n)': { borderRight: 0 },
                '&:hover': {
                  bgcolor: isSelected ? 'primary.100' : 'action.hover',
                },
                ...(isToday && {
                  boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}`,
                }),
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
                <Typography
                  variant="body2"
                  fontWeight={isToday || isSelected ? 800 : 600}
                  color={cell.inMonth ? 'text.primary' : 'text.disabled'}
                >
                  {cell.day}
                </Typography>
                {isToday && (
                  <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                    Today
                  </Typography>
                )}
              </Stack>

              {hasActivity && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  <DayCountDot value={cell.confirmed} tone="confirmed" />
                  <DayCountDot value={cell.pending} tone="pending" />
                </Stack>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export function calendarMonthFromDateKey(dateKey: string): { year: number; month: number } {
  const { year, month } = parseDateKey(dateKey);
  return { year, month };
}
