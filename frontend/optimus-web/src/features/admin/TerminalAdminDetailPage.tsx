import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useGetTerminalDetailQuery } from '../../app/api';
import {
  portOperatorLabel,
  terminalOperatorForDisplay,
  terminalTypeLabel,
} from '../../shared/terminalAdminHelpers';
import { resolveTerminalLogoUrl } from '../../shared/terminalLogoUtils';
import { formatTerminalAddressSummary } from '../../shared/terminalAddressHelpers';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

function utilizationTone(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 90) return 'error';
  if (pct >= 70) return 'warning';
  return 'success';
}

export function TerminalAdminDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetTerminalDetailQuery(id, { skip: !id });

  const terminal = data?.terminal;
  const utilization = data?.utilizationPercent ?? 0;
  const totalUsed = data?.allocations.reduce((sum, a) => sum + a.usedTeu, 0) ?? 0;
  const tone = utilizationTone(Number(utilization));

  return (
    <WorkflowPage
      eyebrow="Terminals and Container Yard"
      title={terminal?.name ?? 'Location details'}
      subtitle={
        terminal
          ? `${terminalTypeLabel(terminal.identity)} — shipping line contract overview for this location.`
          : 'Port terminal or container yard profile and contract utilization.'
      }
      chips={
        terminal ? (
          <>
            <Chip size="small" label={terminalTypeLabel(terminal.identity)} color="primary" variant="outlined" />
            {terminalOperatorForDisplay(terminal) && (
              <Chip size="small" label={portOperatorLabel(terminal.kind)} variant="outlined" />
            )}
            <Chip
              size="small"
              label={terminal.isActive ? 'Active' : 'Inactive'}
              color={terminal.isActive ? 'success' : 'error'}
            />
          </>
        ) : undefined
      }
      actions={
        <Stack direction="row" spacing={1}>
          <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/admin/terminals" variant="outlined">
            Back
          </Button>
          {terminal && (
            <Button
              component={RouterLink}
              to={`/admin/teu-contracts?terminalId=${terminal.id}`}
              startIcon={<AssignmentOutlinedIcon />}
              variant="outlined"
            >
              Manage contract TEU
            </Button>
          )}
          {terminal && (
            <Button
              startIcon={<EditOutlinedIcon />}
              variant="contained"
              onClick={() => navigate('/admin/terminals', { state: { editId: terminal.id } })}
            >
              Edit
            </Button>
          )}
        </Stack>
      }
      stats={
        data
          ? [
              { label: 'Contract TEU', value: `${data.totalAllocatedTeu} TEU`, tone: 'primary' },
              { label: 'Used TEU', value: `${totalUsed} TEU`, tone: 'info' },
              { label: 'Available TEU', value: `${data.availableCapacityTeu} TEU`, tone: 'success' },
              { label: 'Utilization', value: `${utilization}%`, tone },
            ]
          : undefined
      }
    >
      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">Terminal not found or could not be loaded.</Alert>}

      {terminal && data && (
        <>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Avatar
              src={resolveTerminalLogoUrl(terminal.logoPath)}
              variant="rounded"
              sx={{ width: 72, height: 72, fontWeight: 700, fontSize: 24 }}
            >
              {terminal.code.slice(0, 2)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {terminal.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {terminal.code} · {terminalTypeLabel(terminal.identity)}
                {terminalOperatorForDisplay(terminal) ? ` · ${terminalOperatorForDisplay(terminal)}` : ''}
              </Typography>
            </Box>
          </Paper>

          <WorkflowSection title="Terminal information">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography fontWeight={600}>
                  {formatTerminalAddressSummary(terminal.location) ||
                    [terminal.city, terminal.region].filter(Boolean).join(', ') ||
                    '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Typography fontWeight={600}>{terminalTypeLabel(terminal.identity)}</Typography>
              </Grid>
              {terminalOperatorForDisplay(terminal) && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" color="text.secondary">
                    Operator
                  </Typography>
                  <Typography fontWeight={600}>{portOperatorLabel(terminal.kind)}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">
                  Code
                </Typography>
                <Typography fontWeight={600}>{terminal.code}</Typography>
              </Grid>
            </Grid>
          </WorkflowSection>

          <WorkflowSection title="Contract utilization">
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Based on shipping line contracts at this location. Configure contracts under Master Data →
              Contract TEU.
            </Typography>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {totalUsed} / {data.totalAllocatedTeu} TEU used
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {utilization}% utilization
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Number(utilization))}
              color={tone}
              sx={{ height: 10, borderRadius: 1 }}
            />
          </WorkflowSection>

          <WorkflowSection
            title="Shipping line contracts"
            subtitle="Contractual TEU per shipping line at this terminal or CY."
          >
            {data.allocations.length === 0 ? (
              <Alert severity="info" variant="outlined">
                No contract TEU allocations for this location yet.{' '}
                <Box
                  component={RouterLink}
                  to={`/admin/teu-contracts?terminalId=${terminal.id}`}
                  sx={{ fontWeight: 600 }}
                >
                  Add a contract allocation
                </Box>
              </Alert>
            ) : (
              <Stack spacing={2}>
                {data.allocations.map((a) => {
                  const pct = a.allocatedCapacityTeu
                    ? Math.round((a.usedTeu / a.allocatedCapacityTeu) * 1000) / 10
                    : 0;
                  const cardTone = utilizationTone(pct);
                  return (
                    <Paper key={a.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography fontWeight={700}>{a.shippingLineName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Contract since {new Date(a.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Contract TEU
                            </Typography>
                            <Typography fontWeight={700}>{a.allocatedCapacityTeu}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Used TEU
                            </Typography>
                            <Typography fontWeight={700}>{a.usedTeu}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              20ft / 40ft TEU
                            </Typography>
                            <Typography fontWeight={700}>
                              {a.capacity20Ft} / {a.capacity40Ft * 2}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {a.capacity20Ft}×20ft · {a.capacity40Ft}×40ft
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Utilization
                            </Typography>
                            <Typography fontWeight={700}>{pct}%</Typography>
                          </Grid>
                        </Grid>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, pct)}
                          color={cardTone}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </WorkflowSection>
        </>
      )}
    </WorkflowPage>
  );
}
