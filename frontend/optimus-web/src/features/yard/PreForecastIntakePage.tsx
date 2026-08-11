import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Stack, Tab, Tabs } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useGetTruckerIntakeSubmissionsQuery } from '../../app/api';
import type { RootState } from '../../app/store';
import { WorkflowPage } from '../shared/WorkflowPage';
import { PreForecastTruckerFlow } from './PreForecastTruckerFlow';
import { PreForecastIntakeQueue } from './PreForecastIntakeQueue';
import { PreForecastSubmissionsList } from './PreForecastSubmissionsList';
import { filterPreForecastQueue } from './preForecastIntakeFilters';

type TabKey = 'submit' | 'queue' | 'submissions';

function resolveTab(role: string, param: string | null): TabKey {
  if (role === 'Trucker') {
    return param === 'submissions' ? 'submissions' : 'submit';
  }
  return param === 'submissions' ? 'submissions' : 'queue';
}

export function PreForecastIntakePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? '';
  const isTrucker = role === 'Trucker';
  const isTerminalOps = ['TerminalTeam', 'ShippingLinesAdmin'].includes(role);
  const isSlStaff = role === 'SlStaff';
  const isCy = role === 'CyStaff';
  const isAccounting = role === 'Accounting';
  const showIntakeQueue = isTerminalOps || isCy || isAccounting || isSlStaff;

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveTab(role, searchParams.get('tab'));
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);

  const { data: list = [], isLoading, isError, error, refetch } = useGetTruckerIntakeSubmissionsQuery(undefined, {
    pollingInterval: isTrucker ? 30_000 : 0,
  });

  const queueItems = useMemo(() => filterPreForecastQueue(list, role), [list, role]);
  const inProgressCount = list.filter((x) => !['Completed', 'Cancelled'].includes(x.status)).length;
  const completedCount = list.filter((x) => x.status === 'Completed').length;

  useEffect(() => {
    if (!isTrucker || isLoading || searchParams.get('tab')) return;
    if (list.length > 0) {
      setSearchParams({ tab: 'submissions' }, { replace: true });
    }
  }, [isTrucker, isLoading, list.length, searchParams, setSearchParams]);

  const setTab = (next: TabKey) => {
    setSearchParams(next === 'queue' || (isTrucker && next === 'submit') ? {} : { tab: next }, { replace: true });
  };

  const pageTitle = isTrucker
    ? tab === 'submissions'
      ? 'My submissions'
      : 'Empty return pre-forecast'
    : isSlStaff
      ? tab === 'submissions'
        ? 'All pre-forecast submissions'
        : 'Renewed CRO/eDO queue'
      : tab === 'submissions'
        ? 'All intake submissions'
        : 'Pre-forecast queue';

  const pageSubtitle = isTrucker
    ? tab === 'submissions'
      ? 'Track your QR-verified empty return pre-forecasts through CY assignment, billing, and renewed CRO/eDO.'
      : 'Upload the CRO/eDO with QR code — we verify the document and auto-fill the container so details cannot be mistyped.'
    : isSlStaff
      ? tab === 'submissions'
        ? 'Browse every trucker pre-forecast — open a record to generate a renewed CRO/eDO after accounting validates detention.'
        : 'After accounting validates detention payment, generate a new CRO/eDO to replace the expired release.'
      : tab === 'submissions'
      ? 'Every trucker intake submission — open a record for full details and workflow actions.'
      : isCy
        ? 'Confirm free-day return schedules for trucker pre-forecast submissions assigned to your CY.'
        : isAccounting
          ? 'Finalize detention billing after CY confirmation; validate broker payments and renewed CRO/eDO pay-to-open.'
          : 'Assign container yards and slots for trucker intake; detention billing follows CY schedule confirmation.';

  return (
    <WorkflowPage
      eyebrow={isTrucker ? 'Trucker intake' : 'Pre-forecast intake'}
      title={pageTitle}
      subtitle={pageSubtitle}
      chips={
        <>
          <Chip
            size="small"
            icon={isTrucker ? <LocalShippingOutlinedIcon /> : <StorefrontOutlinedIcon />}
            label={isTrucker ? 'QR-verified intake' : role || 'Operations'}
            color="primary"
            variant="outlined"
          />
          {isTrucker && tab === 'submit' && (
            <Chip size="small" label="CRO/eDO QR · 7 container photos" variant="outlined" />
          )}
          {isTrucker && user?.email && (
            <Chip size="small" label={`Signed in as ${user.email}`} variant="outlined" />
          )}
        </>
      }
      stats={[
        { label: 'Total', value: list.length, hint: 'All submissions', tone: 'primary' as const },
        {
          label: showIntakeQueue ? 'In queue' : 'In progress',
          value: showIntakeQueue ? queueItems.length : inProgressCount,
          hint: showIntakeQueue ? 'Needs your action now' : 'Not yet completed',
          tone: (showIntakeQueue ? queueItems.length : inProgressCount) ? ('warning' as const) : ('success' as const),
        },
        {
          label: 'Completed',
          value: completedCount,
          hint: 'Finished',
          tone: 'success' as const,
        },
      ]}
    >
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load your pre-forecast submissions.
          {(error as { data?: { message?: string } })?.data?.message
            ? ` ${(error as { data?: { message?: string } }).data?.message}`
            : ' Refresh the page or sign in again as the trucker who submitted the intake.'}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => setTab(value)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {isTrucker && <Tab value="submit" label="New submission" />}
        {showIntakeQueue && <Tab value="queue" label={isSlStaff ? `Renewal queue${queueItems.length ? ` (${queueItems.length})` : ''}` : `Action queue${queueItems.length ? ` (${queueItems.length})` : ''}`} />}
        <Tab
          value="submissions"
          label={
            isTrucker
              ? `My submissions${list.length ? ` (${list.length})` : ''}`
              : 'All submissions'
          }
        />
      </Tabs>

      {isTrucker && tab === 'submit' && (
        <>
          <PreForecastTruckerFlow
            onSubmitted={() => {
              void refetch();
            }}
          />
          {list.length > 0 && (
            <Box mt={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Chip size="small" color="primary" label={`${inProgressCount} in progress`} />
                <Button size="small" onClick={() => setTab('submissions')}>
                  View all submissions
                </Button>
              </Stack>
              <PreForecastSubmissionsList
                list={list}
                isLoading={isLoading}
                limit={5}
                emptyMessage="Submit a pre-forecast above to track it here."
              />
            </Box>
          )}
        </>
      )}

      {showIntakeQueue && tab === 'queue' && (
        <>
          <PreForecastIntakeQueue
            onMessage={(msg) => {
              setTerminalMessage(msg);
            }}
          />
          {terminalMessage && (
            <Chip label={terminalMessage} color="success" onDelete={() => setTerminalMessage(null)} sx={{ mt: 1 }} />
          )}
        </>
      )}

      {tab === 'submissions' && (
        <PreForecastSubmissionsList
          list={list}
          isLoading={isLoading}
          emptyMessage={
            isTrucker
              ? 'Submit a pre-forecast from the New submission tab to see it here.'
              : 'Trucker intake submissions will appear here when submitted.'
          }
        />
      )}
    </WorkflowPage>
  );
}
