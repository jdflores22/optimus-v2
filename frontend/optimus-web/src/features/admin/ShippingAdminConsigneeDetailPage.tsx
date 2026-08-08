import { useEffect, useMemo } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { useGetShippingAdminConsigneeQuery } from '../../app/api';
import { parseFormFields, parseSubmittedValues } from '../../shared/formSchema';
import { SubmissionDetailsPreview } from '../ops/SubmissionDetailsPreview';
import { TABLE_ACTIONS_HEADER, TableViewLink } from '../shared/TableViewLink';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import {
  ContainersTable,
  EdosTable,
  ManifestsTable,
  NoasTable,
  PartnerDetailTabLabel,
} from './ShippingAdminPartnerDetailUi';
import { AccreditationCertificateButton } from '../ops/AccreditationCertificateButton';

type TabKey = 'overview' | 'noas' | 'manifests' | 'containers' | 'edos' | 'accreditation';

function parseTab(raw: string | null): TabKey {
  if (
    raw === 'noas' ||
    raw === 'manifests' ||
    raw === 'containers' ||
    raw === 'edos' ||
    raw === 'accreditation'
  ) {
    return raw;
  }
  return 'overview';
}

export function ShippingAdminConsigneeDetailPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const { data, isLoading, isError } = useGetShippingAdminConsigneeQuery(id, { skip: !id });

  const fields = useMemo(
    () => parseFormFields(data?.accreditation?.fieldsJson),
    [data?.accreditation?.fieldsJson],
  );
  const values = useMemo(
    () => parseSubmittedValues(data?.accreditation?.submittedDataJson),
    [data?.accreditation?.submittedDataJson],
  );

  useEffect(() => {
    if (!searchParams.get('tab')) {
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'overview');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  if (isLoading) return <Typography sx={{ py: 4 }}>Loading...</Typography>;
  if (isError || !data) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Consignee not found or not on your shipping line.</Alert>
        <Button component={RouterLink} to="/shipping-admin/consignees" startIcon={<ArrowBackOutlinedIcon />}>
          Back
        </Button>
      </Stack>
    );
  }

  const c = data.consignee;
  const accreditation = data.accreditation;

  return (
    <WorkflowPage
      eyebrow="Consignee detail"
      title={c.businessName || c.fullName}
      subtitle={c.email}
      chips={
        <>
          <Chip size="small" label={c.isActive ? 'Active' : 'Inactive'} color={c.isActive ? 'success' : 'default'} />
          {accreditation && (
            <Chip size="small" color="success" variant="outlined" label={`Accredited · v${accreditation.formVersion}`} />
          )}
          {accreditation?.sasIdNumber && (
            <Chip
              size="small"
              color="success"
              label={accreditation.sasIdNumber}
              sx={{ fontFamily: 'monospace', fontWeight: 700 }}
            />
          )}
        </>
      }
      actions={
        <Button component={RouterLink} to="/shipping-admin/consignees" startIcon={<ArrowBackOutlinedIcon />}>
          Back to consignees
        </Button>
      }
      stats={[
        {
          label: 'NOAs',
          value: c.noaCount,
          hint: 'On your line · click to view',
          tone: 'info',
          onClick: () => setTab('noas'),
          active: tab === 'noas',
        },
        {
          label: 'Manifests',
          value: c.manifestCount,
          hint: 'On your line · click to view',
          tone: 'primary',
          onClick: () => setTab('manifests'),
          active: tab === 'manifests',
        },
        {
          label: 'Containers',
          value: c.containerCount,
          hint: 'On your line · click to view',
          tone: 'warning',
          onClick: () => setTab('containers'),
          active: tab === 'containers',
        },
        {
          label: 'eDOs',
          value: data.edoCount,
          hint: 'On your line · click to view',
          tone: 'success',
          onClick: () => setTab('edos'),
          active: tab === 'edos',
        },
      ]}
    >
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, value: TabKey) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 44,
            '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab value="overview" label="Overview" />
          <Tab value="noas" label={<PartnerDetailTabLabel text="NOAs" count={data.noas.length} />} />
          <Tab value="manifests" label={<PartnerDetailTabLabel text="Manifests" count={data.manifests.length} />} />
          <Tab value="containers" label={<PartnerDetailTabLabel text="Containers" count={data.containers.length} />} />
          <Tab value="edos" label={<PartnerDetailTabLabel text="eDOs" count={data.edos.length} />} />
          <Tab
            value="accreditation"
            label={
              accreditation ? (
                <PartnerDetailTabLabel text="Accreditation" badgeText="Approved" badgeTone="success" />
              ) : (
                'Accreditation'
              )
            }
          />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          {tab === 'overview' && (
            <Stack spacing={2}>
              <WorkflowSection title="Account" subtitle="Registered consignee profile.">
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  }}
                >
                  <DetailItem label="Business" value={c.businessName || '—'} />
                  <DetailItem label="Contact" value={c.fullName} />
                  <DetailItem label="Email" value={c.email} />
                  <DetailItem label="Status" value={c.status} />
                </Box>
              </WorkflowSection>

              <WorkflowSection title="Linked brokers" subtitle="Active relationships accredited to your line.">
                {c.linkedBrokers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No linked brokers.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Broker</TableCell>
                        <TableCell align="right">{TABLE_ACTIONS_HEADER}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {c.linkedBrokers.map((b) => (
                        <TableRow key={b.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 12 }}>
                                {b.name.slice(0, 2).toUpperCase()}
                              </Avatar>
                              <Box minWidth={0}>
                                <Typography fontWeight={600}>{b.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {b.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <TableViewLink to={`/shipping-admin/brokers/${b.id}`} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </WorkflowSection>

              {(c.noaCount > 0 || c.manifestCount > 0 || c.containerCount > 0 || data.edoCount > 0) && (
                <WorkflowSection title="Cargo summary" subtitle="Click a stat card above or open a tab to browse records.">
                  <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
                    {c.noaCount > 0 && (
                      <Button size="small" variant="outlined" onClick={() => setTab('noas')}>
                        View {c.noaCount} NOA{c.noaCount === 1 ? '' : 's'}
                      </Button>
                    )}
                    {c.manifestCount > 0 && (
                      <Button size="small" variant="outlined" onClick={() => setTab('manifests')}>
                        View {c.manifestCount} manifest{c.manifestCount === 1 ? '' : 's'}
                      </Button>
                    )}
                    {c.containerCount > 0 && (
                      <Button size="small" variant="outlined" onClick={() => setTab('containers')}>
                        View {c.containerCount} container{c.containerCount === 1 ? '' : 's'}
                      </Button>
                    )}
                    {data.edoCount > 0 && (
                      <Button size="small" variant="outlined" onClick={() => setTab('edos')}>
                        View {data.edoCount} eDO{data.edoCount === 1 ? '' : 's'}
                      </Button>
                    )}
                  </Stack>
                </WorkflowSection>
              )}
            </Stack>
          )}

          {tab === 'noas' && <NoasTable items={data.noas} />}
          {tab === 'manifests' && (
            <ManifestsTable items={data.manifests} subtitle="Cargo manifests linked to this consignee." />
          )}
          {tab === 'containers' && (
            <ContainersTable items={data.containers} subtitle="Containers on manifests for this consignee." />
          )}
          {tab === 'edos' && (
            <EdosTable items={data.edos} subtitle="Electronic delivery orders for this consignee." />
          )}

          {tab === 'accreditation' && (
            <WorkflowSection
              title="Accreditation form"
              subtitle={
                accreditation
                  ? `${accreditation.formName} · submitted ${new Date(accreditation.submittedAt).toLocaleString()}`
                  : 'Approved accreditation submission for your shipping line.'
              }
              actions={
                accreditation?.approvedAt ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {accreditation.status === 'Approved' && (
                      <AccreditationCertificateButton
                        submissionId={accreditation.id}
                      />
                    )}
                    <Chip
                      size="small"
                      color="success"
                      label={`Approved ${new Date(accreditation.approvedAt).toLocaleDateString()}`}
                    />
                  </Stack>
                ) : undefined
              }
            >
              {!accreditation ? (
                <Alert severity="info" variant="outlined">
                  No approved accreditation form is on file for this consignee.
                </Alert>
              ) : fields.length === 0 ? (
                <Alert severity="warning" variant="outlined">
                  Accreditation exists, but the form definition could not be loaded.
                </Alert>
              ) : (
                <SubmissionDetailsPreview fields={fields} values={values} />
              )}
            </WorkflowSection>
          )}
        </Box>
      </Paper>
    </WorkflowPage>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}
