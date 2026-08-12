import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { Link as RouterLink } from 'react-router-dom';
import type { ContainerDto, ShippingLineDto, TruckerPreForecastSubmissionDto } from '../../shared/types';
import { ShippingLineLogoAvatar } from '../../shared/ShippingLineLogoAvatar';
import { WorkflowSection } from '../shared/WorkflowPage';
import {
  CONTAINER_SIZE_COLUMNS,
  buildDailyConfirmedSummary,
  buildUpcomingDayTotals,
  columnGrandTotals,
  containerSizeColumnLabel,
  formatScheduleDateLabel,
  todayDateKey,
} from '../yard/cyIntakeSchedule';

type Props = {
  intake: TruckerPreForecastSubmissionDto[];
  shippingLines: ShippingLineDto[];
  containers: ContainerDto[];
};

function CountBadge({ value }: { value: number }) {
  if (value <= 0) {
    return (
      <Typography component="span" color="text.disabled" sx={{ px: 0.5 }}>
        —
      </Typography>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 28,
        height: 28,
        px: 0.75,
        borderRadius: '50%',
        bgcolor: 'success.light',
        color: 'success.dark',
        fontWeight: 800,
        fontSize: '0.8rem',
      }}
    >
      {value}
    </Box>
  );
}

export function CyDailyBookingSummary({ intake, shippingLines, containers }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayDateKey);
  const [tab, setTab] = useState<'overview' | 'upcoming'>('overview');

  const containerById = useMemo(
    () => new Map(containers.map((container) => [container.id, container])),
    [containers],
  );

  const dailyRows = useMemo(
    () => buildDailyConfirmedSummary(intake, selectedDate, containerById, shippingLines),
    [intake, selectedDate, containerById, shippingLines],
  );

  const grandTotals = useMemo(() => columnGrandTotals(dailyRows), [dailyRows]);

  const upcomingDays = useMemo(
    () => buildUpcomingDayTotals(intake, todayDateKey(), 14),
    [intake],
  );

  const isToday = selectedDate === todayDateKey();
  const hasConfirmedOnDay = dailyRows.length > 0;

  return (
    <WorkflowSection
      title="Daily booking summary"
      subtitle="Confirmed empty returns scheduled at your depot — grouped by shipping line and container size."
      actions={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <Button
            size="small"
            variant={isToday ? 'contained' : 'outlined'}
            onClick={() => setSelectedDate(todayDateKey())}
          >
            Today
          </Button>
        </Stack>
      }
    >
      <Tabs
        value={tab}
        onChange={(_, value: 'overview' | 'upcoming') => setTab(value)}
        sx={{
          mb: 2,
          minHeight: 40,
          '& .MuiTab-root': { minHeight: 40, fontWeight: 700, textTransform: 'none' },
          '& .MuiTabs-indicator': { height: 3, borderRadius: 999 },
        }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Upcoming schedule" value="upcoming" />
      </Tabs>

      {tab === 'overview' ? (
        <>
          <Alert severity="info" variant="outlined" sx={{ mb: 2, bgcolor: 'success.50', borderColor: 'success.light' }}>
            {hasConfirmedOnDay
              ? `Showing confirmed empty returns scheduled for ${formatScheduleDateLabel(selectedDate)}.`
              : isToday
                ? 'No confirmed empty returns scheduled for today yet.'
                : `No confirmed empty returns on ${formatScheduleDateLabel(selectedDate)}.`}
          </Alert>

          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Typography fontWeight={800} fontSize="1.05rem">
                Empty return summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmed units to be received on {formatScheduleDateLabel(selectedDate)}.
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Shipping line</TableCell>
                    {CONTAINER_SIZE_COLUMNS.map((column) => (
                      <TableCell key={column} align="center" sx={{ fontWeight: 800, minWidth: 52 }}>
                        {containerSizeColumnLabel(column)}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 800, minWidth: 72 }}>
                      Total units
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={CONTAINER_SIZE_COLUMNS.length + 2} align="center" sx={{ py: 4 }}>
                        <Stack spacing={0.5} alignItems="center">
                          <EventOutlinedIcon color="disabled" />
                          <Typography color="text.secondary">
                            No confirmed pre-forecasts on this date.
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Check the upcoming schedule tab or confirm pending requests in the pre-forecast queue.
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailyRows.map((row) => (
                      <TableRow key={row.shippingLineKey} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <ShippingLineLogoAvatar
                              logoPath={row.shippingLine?.logoPath}
                              brandName={row.shippingLineName}
                              brandColor={row.shippingLine?.brandColor}
                              size={36}
                              variant="rounded"
                            />
                            <Box minWidth={0}>
                              <Typography fontWeight={800} noWrap title={row.shippingLineName}>
                                {row.shippingLineName}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        {CONTAINER_SIZE_COLUMNS.map((column) => (
                          <TableCell key={column} align="center">
                            <CountBadge value={row.counts[column]} />
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <CountBadge value={row.total} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {dailyRows.length > 0 && (
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 800 }}>Grand total</TableCell>
                      {CONTAINER_SIZE_COLUMNS.map((column) => (
                        <TableCell key={column} align="center">
                          <CountBadge value={grandTotals[column]} />
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <CountBadge value={grandTotals.total} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ mt: 1.5, textAlign: 'right' }}>
            <Button component={RouterLink} to="/pre-forecast?tab=submissions" size="small">
              View all submissions
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Alert severity="info" variant="outlined" sx={{ mb: 2, bgcolor: 'success.50', borderColor: 'success.light' }}>
            Next 14 days — confirmed empty returns (green) and terminal-assigned requests still awaiting your date
            confirmation (amber).
          </Alert>

          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      Confirmed
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      Awaiting CY confirm
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingDays.map((day) => {
                    const hasActivity = day.confirmed > 0 || day.pending > 0;
                    const isSelected = day.dateKey === selectedDate;
                    return (
                      <TableRow
                        key={day.dateKey}
                        hover={hasActivity}
                        sx={isSelected ? { bgcolor: 'action.selected' } : undefined}
                      >
                        <TableCell>
                          <Typography fontWeight={isSelected ? 800 : 600}>
                            {formatScheduleDateLabel(day.dateKey)}
                            {day.dateKey === todayDateKey() ? (
                              <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
                                Today
                              </Typography>
                            ) : null}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <CountBadge value={day.confirmed} />
                        </TableCell>
                        <TableCell align="center">
                          {day.pending > 0 ? (
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 28,
                                height: 28,
                                px: 0.75,
                                borderRadius: '50%',
                                bgcolor: 'warning.light',
                                color: 'warning.dark',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                              }}
                            >
                              {day.pending}
                            </Box>
                          ) : (
                            <CountBadge value={0} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={isSelected ? 'contained' : 'text'}
                            onClick={() => {
                              setSelectedDate(day.dateKey);
                              setTab('overview');
                            }}
                            disabled={!hasActivity && day.dateKey !== todayDateKey()}
                          >
                            {isSelected ? 'Viewing' : 'View day'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {intake.some((s) => s.status === 'PendingCySchedule') && (
            <Box sx={{ mt: 1.5, textAlign: 'right' }}>
              <Button component={RouterLink} to="/pre-forecast" size="small" variant="outlined">
                Open pre-forecast queue
              </Button>
            </Box>
          )}
        </>
      )}
    </WorkflowSection>
  );
}
