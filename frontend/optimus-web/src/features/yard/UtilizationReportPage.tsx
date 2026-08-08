import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { useMemo, useState } from 'react';
import {
  useExportUtilizationMutation,
  useGetTerminalsQuery,
  useGetUtilizationQuery,
} from '../../app/api';
import { portOperatorLabel } from '../../shared/terminalTaxonomy';
import { API_BASE_URL } from '../../shared/types';
import { AdminFilterBar, AdminSearchField, AdminSelectField } from '../shared/AdminFilterBar';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

type UtilizationReportPageProps = {
  terminalKind?: 'Cy' | 'Port';
  title?: string;
  subtitle?: string;
};

type SortKey = 'terminal' | 'utilization';

function utilizationTone(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 90) return 'error';
  if (pct >= 70) return 'warning';
  return 'success';
}

function terminalIdentityParam(kind?: 'Cy' | 'Port'): string | undefined {
  if (kind === 'Cy') return 'ContainerYard';
  if (kind === 'Port') return 'PortTerminal';
  return undefined;
}

export function UtilizationReportPage({
  terminalKind,
  title = 'Port and CY utilization',
  subtitle = 'Review capacity pressure across terminals before yard congestion creates downstream release delays.',
}: UtilizationReportPageProps = {}) {
  const identityParam = terminalIdentityParam(terminalKind);
  const {
    data: utilization = [],
    isLoading,
    isError,
    refetch,
  } = useGetUtilizationQuery(identityParam ? { terminalIdentity: identityParam } : undefined);
  const { data: terminals = [] } = useGetTerminalsQuery({ activeOnly: true });
  const [exportReport, { isLoading: exporting }] = useExportUtilizationMutation();

  const [terminalFilter, setTerminalFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('utilization');
  const [pdf, setPdf] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const terminalOptions = useMemo(() => {
    const ids = new Set(utilization.map((r) => r.terminalId));
    return terminals.filter((t) => ids.has(t.id));
  }, [terminals, utilization]);

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = utilization.filter((row) => {
      const matchesTerminal = !terminalFilter || row.terminalId === terminalFilter;
      const matchesSearch = !q || row.terminalName.toLowerCase().includes(q);
      return matchesTerminal && matchesSearch;
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === 'terminal') return a.terminalName.localeCompare(b.terminalName);
      return b.utilizationPercent - a.utilizationPercent;
    });

    return rows;
  }, [utilization, terminalFilter, search, sortBy]);

  const totalAllocated = data.reduce((sum, row) => sum + row.allocatedTeu, 0);
  const totalUsed = data.reduce((sum, row) => sum + row.usedTeu, 0);
  const totalPending = data.reduce((sum, row) => sum + row.pendingPreAdvice, 0);
  const overallPct = totalAllocated ? Math.round((totalUsed / totalAllocated) * 100) : 0;

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const r = await exportReport(identityParam ? { terminalIdentity: identityParam } : undefined).unwrap();
      if (format === 'pdf') {
        setPdf(r.pdfPath);
        setExportMessage('PDF export ready.');
      } else {
        const blob = new Blob([r.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${terminalKind === 'Cy' ? 'cy' : terminalKind === 'Port' ? 'port' : 'terminal'}-utilization.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setExportMessage('CSV downloaded.');
      }
    } catch {
      setExportMessage('Export failed.');
    }
  };

  return (
    <WorkflowPage
      eyebrow="Reports"
      title={title}
      subtitle={subtitle}
      chips={
        <>
          <Chip size="small" label={`${data.length} terminals`} color="primary" />
          {terminalKind === 'Cy' && <Chip size="small" label="Container Yard" variant="outlined" />}
          {terminalKind === 'Port' && <Chip size="small" label="Port Terminal" variant="outlined" />}
        </>
      }
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            disabled={exporting || data.length === 0}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfOutlinedIcon />}
            disabled={exporting || data.length === 0}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
          {pdf && (
            <Button href={`${API_BASE_URL}${pdf}`} target="_blank" rel="noopener noreferrer">
              Open PDF
            </Button>
          )}
        </Stack>
      }
      stats={[
        { label: 'Allocated TEU', value: totalAllocated, hint: 'Capacity assigned', tone: 'primary' },
        { label: 'Used TEU', value: totalUsed, hint: 'Current occupancy', tone: 'info' },
        {
          label: 'Utilization',
          value: `${overallPct}%`,
          hint: 'Overall load factor',
          tone: utilizationTone(overallPct),
        },
        { label: 'Pending pre-advice', value: totalPending, hint: 'Upcoming intake', tone: 'warning' },
      ]}
    >
      {exportMessage && (
        <Alert severity="info" onClose={() => setExportMessage(null)}>
          {exportMessage}
        </Alert>
      )}


      <WorkflowSection title="Utilization by location" subtitle="Per-terminal capacity and occupancy breakdown.">
        <AdminFilterBar>
          <AdminSearchField
            placeholder="Search terminal…"
            value={search}
            onValueChange={setSearch}
          />
          <AdminSelectField
            value={terminalFilter}
            onChange={(e) => setTerminalFilter(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All terminals</MenuItem>
            {terminalOptions.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </AdminSelectField>
          <AdminSelectField
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <MenuItem value="utilization">Utilization ↓</MenuItem>
            <MenuItem value="terminal">Terminal A–Z</MenuItem>
          </AdminSelectField>
        </AdminFilterBar>
        {isLoading && <LinearProgress />}
        {isError && <Alert severity="error">Could not load utilization data.</Alert>}

        {!isLoading && data.length === 0 ? (
          <Alert severity="info" variant="outlined">
            No utilization data for the selected {terminalKind === 'Cy' ? 'container yard' : terminalKind === 'Port' ? 'port terminal' : 'terminal'} filters.
          </Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Terminal</TableCell>
                {terminalKind === 'Port' && <TableCell>Operator</TableCell>}
                <TableCell align="right">Allocated</TableCell>
                <TableCell align="right">Used</TableCell>
                <TableCell>Utilization</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">At terminal</TableCell>
                <TableCell align="right">Pending PA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((r) => {
                const tone = utilizationTone(Number(r.utilizationPercent));
                return (
                  <TableRow key={r.terminalId} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{r.terminalName}</Typography>
                    </TableCell>
                    {terminalKind === 'Port' && (
                      <TableCell>
                        {r.terminalOperator ? portOperatorLabel(r.terminalOperator) : '—'}
                      </TableCell>
                    )}
                    <TableCell align="right">{r.allocatedTeu} TEU</TableCell>
                    <TableCell align="right">{r.usedTeu} TEU</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={600}>
                          {r.utilizationPercent}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Number(r.utilizationPercent))}
                          color={tone}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{r.availableForReturn}</TableCell>
                    <TableCell align="right">{r.atTerminal}</TableCell>
                    <TableCell align="right">{r.pendingPreAdvice}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </WorkflowSection>

      {data.length > 0 && (
        <WorkflowSection title="Capacity overview">
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {totalUsed} / {totalAllocated} TEU used across filtered terminals
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {overallPct}% overall
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, overallPct)}
            color={utilizationTone(overallPct)}
            sx={{ height: 10, borderRadius: 1 }}
          />
        </WorkflowSection>
      )}
    </WorkflowPage>
  );
}
