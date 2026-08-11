import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { OptimusLogo } from '../../shared/OptimusLogo';
import {
  CURRENT_APP_VERSION,
  countRoadmapItems,
  formatRoadmapHours,
  RELEASE_CHANGE_COLORS,
  RELEASE_CHANGE_LABELS,
  RELEASE_NOTES,
  ROADMAP_ITEMS,
  ROADMAP_STATUS_COLORS,
  ROADMAP_STATUS_LABELS,
  sumRoadmapHours,
  UPCOMING_APP_VERSION,
  type ReleaseChangeType,
  type RoadmapItemStatus,
} from '../../shared/releaseNotes';
import { postAuthHomePath } from '../../shared/postAuthHomePath';

const ALL_FILTER = 'all' as const;
type FilterType = ReleaseChangeType | typeof ALL_FILTER;

const ROADMAP_FILTER_ALL = 'all' as const;
type RoadmapFilter = RoadmapItemStatus | typeof ROADMAP_FILTER_ALL;

export function VersionsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [filter, setFilter] = useState<FilterType>(ALL_FILTER);
  const [roadmapFilter, setRoadmapFilter] = useState<RoadmapFilter>(ROADMAP_FILTER_ALL);

  const filteredNotes = useMemo(() => {
    if (filter === ALL_FILTER) {
      return RELEASE_NOTES;
    }

    return RELEASE_NOTES.map((release) => ({
      ...release,
      changes: release.changes.filter((change) => change.type === filter),
    })).filter((release) => release.changes.length > 0);
  }, [filter]);

  const filteredRoadmap = useMemo(() => {
    if (roadmapFilter === ROADMAP_FILTER_ALL) {
      return ROADMAP_ITEMS;
    }
    return ROADMAP_ITEMS.filter((item) => item.status === roadmapFilter);
  }, [roadmapFilter]);

  const shippedChangeCount = RELEASE_NOTES.reduce((sum, release) => sum + release.changes.length, 0);
  const inProgressCount = countRoadmapItems('in_progress');
  const queuedCount = countRoadmapItems('queued');
  const totalRoadmapHours = sumRoadmapHours();
  const inProgressHours = sumRoadmapHours('in_progress');
  const queuedHours = sumRoadmapHours('queued');
  const releasedCount = RELEASE_NOTES.length;
  const latestLiveVersion = RELEASE_NOTES[0]?.version;

  return (
    <Box
      minHeight="100vh"
      sx={{
        bgcolor: 'background.default',
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Stack spacing={3} maxWidth={960} mx="auto">
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Stack spacing={1.5}>
            <OptimusLogo size="sm" />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <HistoryOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="h4" fontWeight={700}>
                Release notes
              </Typography>
              <Chip
                icon={<NewReleasesOutlinedIcon />}
                label={`Live v${CURRENT_APP_VERSION}`}
                color="primary"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            <Typography color="text.secondary" maxWidth={640}>
              Shipped version history and a manual v{UPCOMING_APP_VERSION} progress report. Edit{' '}
              <Typography component="span" variant="body2" fontFamily="monospace" color="text.secondary">
                releaseNotes.ts
              </Typography>{' '}
              to update status and hour estimates.
            </Typography>
          </Stack>
          <Button
            component={RouterLink}
            to={user ? postAuthHomePath(user.role) : '/login'}
            variant={user ? 'contained' : 'outlined'}
          >
            {user ? 'Back to dashboard' : 'Sign in'}
          </Button>
        </Stack>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: 1, borderColor: 'warning.main' }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <AssignmentOutlinedIcon color="warning" fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>
                    v{UPCOMING_APP_VERSION} — Progress report
                  </Typography>
                  <Chip label="Manual tracker" size="small" color="warning" variant="outlined" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  OPTIMUS = Enterprise · ICS = Lite
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${inProgressCount} in progress`} size="small" color="warning" variant="outlined" />
                <Chip label={`${queuedCount} queued`} size="small" variant="outlined" />
                <Chip
                  label={`Total est. ${formatRoadmapHours(totalRoadmapHours)}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={roadmapFilter}
                onChange={(_, value: RoadmapFilter | null) => {
                  if (value) setRoadmapFilter(value);
                }}
              >
                <ToggleButton value={ROADMAP_FILTER_ALL}>All</ToggleButton>
                <ToggleButton value="in_progress">In progress</ToggleButton>
                <ToggleButton value="queued">Queued</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" alignSelf="center">
                In progress: {formatRoadmapHours(inProgressHours)} · Queued: {formatRoadmapHours(queuedHours)}
              </Typography>
            </Stack>

            <TableContainer>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Scope</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 88 }} align="right">
                      Est. (h)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoadmap.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.product}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" lineHeight={1.6}>
                          {item.scope}
                          {item.route && (
                            <Typography component="span" variant="caption" color="text.secondary" display="block">
                              {item.route}
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ROADMAP_STATUS_LABELS[item.status]}
                          color={ROADMAP_STATUS_COLORS[item.status]}
                          size="small"
                          variant={item.status === 'queued' ? 'outlined' : 'filled'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {formatRoadmapHours(item.estimatedHours)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${releasedCount} shipped versions`} size="small" />
              <Chip label={`${shippedChangeCount} changelog items`} size="small" variant="outlined" />
            </Stack>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={filter}
              onChange={(_, value: FilterType | null) => {
                if (value) setFilter(value);
              }}
              sx={{ flexWrap: 'wrap' }}
            >
              <ToggleButton value={ALL_FILTER}>All</ToggleButton>
              {(Object.keys(RELEASE_CHANGE_LABELS) as ReleaseChangeType[]).map((type) => (
                <ToggleButton key={type} value={type}>
                  {RELEASE_CHANGE_LABELS[type]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        <Stack spacing={2.5}>
          {filteredNotes.map((release, index) => {
            const highlight = index === 0 && filter === ALL_FILTER;

            return (
              <Paper
                key={release.version}
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  border: 1,
                  borderColor: highlight ? 'primary.main' : 'divider',
                  boxShadow: highlight ? 2 : 0,
                }}
              >
                <Stack spacing={2}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h5" fontWeight={700}>
                        v{release.version}
                      </Typography>
                      {release.version === latestLiveVersion && (
                        <Chip label="Latest live" color="primary" size="small" sx={{ fontWeight: 600 }} />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {release.date}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {release.title}
                    </Typography>
                  </Stack>

                  <Typography color="text.secondary" variant="body2">
                    {release.summary}
                  </Typography>

                  <Divider />

                  <Stack spacing={1.25} component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
                    {release.changes.map((change) => (
                      <Stack
                        key={`${release.version}-${change.text}`}
                        component="li"
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <Chip
                          label={RELEASE_CHANGE_LABELS[change.type]}
                          color={RELEASE_CHANGE_COLORS[change.type]}
                          size="small"
                          sx={{ minWidth: 96, fontWeight: 600, mt: 0.15 }}
                        />
                        <Typography variant="body2" lineHeight={1.65} pt={0.35}>
                          {change.text}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Typography variant="caption" color="text.secondary" textAlign="center" pt={1}>
          Frontend package v{CURRENT_APP_VERSION} · API deployed via Railway · Frontend on Hostinger
        </Typography>
        {!user && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            <Link component={RouterLink} to="/login">
              Sign in
            </Link>{' '}
            to access the operational workspace.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
