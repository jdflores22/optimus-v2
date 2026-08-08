import { Box, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type {
  PartnerContainerListItemDto,
  PartnerEdoListItemDto,
  PartnerManifestListItemDto,
  PartnerNoaListItemDto,
} from '../../shared/shippingAdminTypes';
import { edoStatusChipColor, formatEdoStatus } from '../../shared/formatEdoStatus';
import { formatWorkflowState } from '../../shared/formatWorkflowState';
import { TABLE_ACTIONS_HEADER, TableViewLink } from '../shared/TableViewLink';
import { WorkflowSection } from '../shared/WorkflowPage';

export function PartnerDetailTabLabel({
  text,
  count,
  badgeText,
  badgeTone = 'count',
}: {
  text: string;
  count?: number;
  badgeText?: string;
  badgeTone?: 'count' | 'success';
}) {
  const label = badgeText ?? (count !== undefined ? String(count) : undefined);
  if (!label) return <span>{text}</span>;

  const isSuccess = badgeTone === 'success';
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" component="span">
      <span>{text}</span>
      <Box
        component="span"
        sx={{
          minWidth: 20,
          height: 20,
          px: badgeText ? 0.75 : 0,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: badgeText ? '0.02em' : 0,
          fontVariantNumeric: 'tabular-nums',
          bgcolor: (theme) =>
            isSuccess ? theme.palette.success.main : alpha(theme.palette.primary.main, 0.12),
          color: (theme) => (isSuccess ? theme.palette.success.contrastText : theme.palette.primary.main),
        }}
      >
        {label}
      </Box>
    </Stack>
  );
}

export function formatPartnerCreatedAt(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export function formatPartnerLastUpdated(createdAt: string, updatedAt?: string | null): string {
  if (!updatedAt) return '—';
  const createdMs = new Date(createdAt).getTime();
  const updatedMs = new Date(updatedAt).getTime();
  if (!Number.isFinite(updatedMs) || updatedMs <= createdMs + 1000) return '—';
  return new Date(updatedAt).toLocaleString();
}

function formatContainerStatus(status: string): string {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function containerStatusColor(status: string): 'success' | 'warning' | 'info' | 'default' {
  if (/available/i.test(status)) return 'success';
  if (/allocated|pending/i.test(status)) return 'info';
  if (/return/i.test(status)) return 'warning';
  return 'default';
}

function PartnerStatusChip({ label, color }: { label: string; color: 'success' | 'warning' | 'info' | 'default' | 'error' }) {
  return (
    <Chip
      size="small"
      label={label}
      color={color === 'default' ? undefined : color}
      variant={color === 'default' ? 'outlined' : 'filled'}
      sx={{ height: 22, fontWeight: 600, fontSize: 11 }}
    />
  );
}

function CreatedUpdatedCells({ createdAt, updatedAt }: { createdAt: string; updatedAt?: string | null }) {
  const lastUpdated = formatPartnerLastUpdated(createdAt, updatedAt);
  return (
    <>
      <TableCell>{formatPartnerCreatedAt(createdAt)}</TableCell>
      <TableCell>
        {lastUpdated === '—' ? (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ) : (
          <Typography variant="body2" fontWeight={600}>
            {lastUpdated}
          </Typography>
        )}
      </TableCell>
    </>
  );
}

export function NoasTable({ items }: { items: PartnerNoaListItemDto[] }) {
  return (
    <WorkflowSection title="NOAs" subtitle="Notice of Arrival documents on your shipping line.">
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No NOAs yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>NOA</TableCell>
              <TableCell>Manifest</TableCell>
              <TableCell>Vessel</TableCell>
              <TableCell>ETA</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last update</TableCell>
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((n) => (
              <TableRow key={n.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{n.noaNumber}</Typography>
                </TableCell>
                <TableCell>{n.manifestNumber}</TableCell>
                <TableCell>{n.vesselName || '—'}</TableCell>
                <TableCell>{n.eta ? new Date(n.eta).toLocaleDateString() : '—'}</TableCell>
                <CreatedUpdatedCells createdAt={n.createdAt} updatedAt={n.updatedAt} />
                <TableCell align="right">
                  <TableViewLink to={`/manifests/${n.manifestId}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WorkflowSection>
  );
}

function isEdoWorkflowState(state: string): boolean {
  return /EdoGenerated|EdoReleased/i.test(state);
}

function ManifestEdoReleaseBadge({
  workflowState,
  released,
  total,
}: {
  workflowState: string;
  released: number;
  total: number;
}) {
  if (!isEdoWorkflowState(workflowState)) return null;
  if (total === 0) {
    return (
      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
        No eDOs yet
      </Typography>
    );
  }

  const complete = released >= total;
  return (
    <Chip
      size="small"
      label={`${released} / ${total} eDO${total === 1 ? '' : 's'} released`}
      color={complete ? 'success' : 'warning'}
      variant="outlined"
      sx={{ height: 22, fontWeight: 700, fontSize: 11, mt: 0.5 }}
    />
  );
}

export function ManifestsTable({
  items,
  subtitle = 'Cargo manifests on your shipping line.',
}: {
  items: PartnerManifestListItemDto[];
  subtitle?: string;
}) {
  return (
    <WorkflowSection title="Manifests" subtitle={subtitle}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No manifests yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Manifest</TableCell>
              <TableCell>NOA</TableCell>
              <TableCell>BL</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last update</TableCell>
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{m.manifestNumber}</Typography>
                </TableCell>
                <TableCell>{m.noaNumber || '—'}</TableCell>
                <TableCell>{m.blNumber || '—'}</TableCell>
                <TableCell>
                  <Stack spacing={0.25} alignItems="flex-start">
                    <PartnerStatusChip label={formatWorkflowState(m.workflowState)} color="info" />
                    <ManifestEdoReleaseBadge
                      workflowState={m.workflowState}
                      released={m.edoReleasedCount}
                      total={m.edoTotalCount}
                    />
                  </Stack>
                </TableCell>
                <CreatedUpdatedCells createdAt={m.createdAt} updatedAt={m.updatedAt} />
                <TableCell align="right">
                  <TableViewLink to={`/manifests/${m.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WorkflowSection>
  );
}

export function ContainersTable({
  items,
  subtitle = 'Containers on manifests for this partner.',
}: {
  items: PartnerContainerListItemDto[];
  subtitle?: string;
}) {
  return (
    <WorkflowSection title="Containers" subtitle={subtitle}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No containers yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Container</TableCell>
              <TableCell>Size / Type</TableCell>
              <TableCell>Manifest</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last update</TableCell>
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    {c.containerNumber}
                  </Typography>
                </TableCell>
                <TableCell>{[c.sizeCode, c.typeCode].filter(Boolean).join(' / ') || '—'}</TableCell>
                <TableCell>{c.manifestNumber || '—'}</TableCell>
                <TableCell>
                  <PartnerStatusChip
                    label={formatContainerStatus(c.status)}
                    color={containerStatusColor(c.status)}
                  />
                </TableCell>
                <CreatedUpdatedCells createdAt={c.createdAt} updatedAt={c.updatedAt} />
                <TableCell align="right">
                  {c.manifestId ? <TableViewLink to={`/manifests/${c.manifestId}`} /> : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WorkflowSection>
  );
}

export function EdosTable({
  items,
  subtitle = 'Electronic delivery orders on your shipping line.',
}: {
  items: PartnerEdoListItemDto[];
  subtitle?: string;
}) {
  return (
    <WorkflowSection title="eDOs" subtitle={subtitle}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No eDOs yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>eDO</TableCell>
              <TableCell>Container</TableCell>
              <TableCell>Manifest</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last update</TableCell>
              <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{e.edoNumber}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{e.containerNumber || '—'}</TableCell>
                <TableCell>{e.manifestNumber}</TableCell>
                <TableCell>
                  <PartnerStatusChip
                    label={formatEdoStatus(e.status)}
                    color={edoStatusChipColor(e.status)}
                  />
                </TableCell>
                <CreatedUpdatedCells createdAt={e.generatedAt} updatedAt={e.updatedAt} />
                <TableCell align="right">
                  <TableViewLink to={`/edo/${e.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WorkflowSection>
  );
}
