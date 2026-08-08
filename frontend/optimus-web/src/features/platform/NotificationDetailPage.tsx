import { Alert, Box, Button, Chip, Link, Stack, Typography } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetEdoPaymentQuery,
  useGetEdoQuery,
  useGetEdosQuery,
  useGetManifestQuery,
  useGetNotificationQuery,
  useGetPaymentsByManifestQuery,
  useGetPendingEdoPaymentsQuery,
  useMarkNotificationsReadMutation,
} from '../../app/api';
import type { RootState } from '../../app/store';
import type { NotificationDto } from '../../shared/types';
import { API_BASE_URL } from '../../shared/types';
import {
  isBillingNotification,
  isEdoPaymentNotification,
  isFinalPaymentRejectedNotification,
  manifestIdFromNotification,
  resolveNotificationPaymentState,
  type NotificationPaymentAction,
  type NotificationPaymentState,
} from '../../shared/notificationPaymentActions';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

function fileUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function money(amount: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function paymentStatusAlertSeverity(
  tone: NotificationPaymentState['statusTone'],
): 'success' | 'warning' | 'error' | 'info' {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'error') return 'error';
  return 'info';
}

function PaymentActionButtons({
  primary,
  secondary,
}: {
  primary: NotificationPaymentAction | null;
  secondary?: NotificationPaymentAction | null;
}) {
  if (!primary && !secondary) return null;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
      {primary && (
        <Button
          component={RouterLink}
          to={primary.path}
          variant={primary.variant ?? 'contained'}
          color={primary.variant === 'contained' ? 'success' : 'inherit'}
          startIcon={<PaymentsOutlinedIcon />}
        >
          {primary.label}
        </Button>
      )}
      {secondary && (
        <Button
          component={RouterLink}
          to={secondary.path}
          variant={secondary.variant ?? 'outlined'}
          startIcon={<PaymentsOutlinedIcon />}
        >
          {secondary.label}
        </Button>
      )}
    </Stack>
  );
}

function relatedPath(n: NotificationDto): string | null {
  const manifestId = manifestIdFromNotification(n);
  if (manifestId) return `/manifests/${manifestId}`;

  switch (n.category) {
    case 'sas':
      return n.title.toLowerCase().includes('final approval') ? '/approvals' : '/sas';
    case 'transfer':
    case 'suspension':
      return '/transfers';
    case 'appeal':
      return '/appeals';
    case 'dwell':
      return '/dwell';
    case 'pre_advice':
      return '/pre-advice';
    default:
      return null;
  }
}

export function NotificationDetailPage() {
  const { id = '' } = useParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data, error, isLoading } = useGetNotificationQuery(id, { skip: !id });
  const [markRead, { isLoading: marking }] = useMarkNotificationsReadMutation();

  const manifestIdFromSubject = data ? manifestIdFromNotification(data) : null;
  const edoIdFromSubject =
    data?.subjectType === 'ElectronicDeliveryOrder' && data.subjectId ? data.subjectId : null;
  const edoPaymentIdFromSubject =
    data?.subjectType === 'EdoPayment' && data.subjectId ? data.subjectId : null;

  const { data: edoFromSubject } = useGetEdoQuery(edoIdFromSubject ?? '', { skip: !edoIdFromSubject });
  const { data: edoPaymentFromSubject } = useGetEdoPaymentQuery(edoPaymentIdFromSubject ?? '', {
    skip: !edoPaymentIdFromSubject,
  });

  const resolvedManifestId =
    manifestIdFromSubject ?? edoFromSubject?.manifestId ?? edoPaymentFromSubject?.manifestId ?? null;

  const isEdoPayment = data ? isEdoPaymentNotification(data) : false;
  const isBilling = data ? isBillingNotification(data) : false;
  const isPaymentRejected = data ? isFinalPaymentRejectedNotification(data) : false;
  const isAdmin = user?.role === 'SystemAdmin';
  const needsManifestPayments = Boolean(resolvedManifestId && (isBilling || isPaymentRejected));

  const { data: edos = [] } = useGetEdosQuery(
    { manifestId: resolvedManifestId! },
    { skip: !resolvedManifestId || !isEdoPayment },
  );
  const { data: pendingEdoPayments = [] } = useGetPendingEdoPaymentsQuery(undefined, {
    skip: !isAdmin || !isEdoPayment,
  });
  const { data: payments = [] } = useGetPaymentsByManifestQuery(resolvedManifestId ?? '', {
    skip: !needsManifestPayments,
  });

  const { data: manifest } = useGetManifestQuery(resolvedManifestId ?? '', { skip: !resolvedManifestId });

  const paymentState = data
    ? resolveNotificationPaymentState({
        notification: data,
        role: user?.role ?? '',
        manifestId: resolvedManifestId,
        manifest,
        payments,
        edos,
        edoFromSubject,
        edoPaymentFromSubject,
        pendingEdoPayments,
      })
    : null;

  const paymentAction = paymentState?.primaryAction ?? null;
  const secondaryPaymentAction = paymentState?.secondaryAction ?? null;

  const billingUrl = manifest?.billingPdfPath ? fileUrl(manifest.billingPdfPath) : null;
  const manifestPath = resolvedManifestId ? `/manifests/${resolvedManifestId}` : null;

  if (error) {
    return (
      <Stack spacing={2}>
        <Button component={RouterLink} to="/notifications" sx={{ alignSelf: 'flex-start' }}>
          Back to alerts
        </Button>
        <Alert severity="error">Alert not found.</Alert>
      </Stack>
    );
  }

  if (isLoading || !data) {
    return <Typography>Loading...</Typography>;
  }

  const related = relatedPath(data);

  return (
    <WorkflowPage
      eyebrow="Alert detail"
      title={data.title}
      subtitle={
        manifest?.manifestNumber
          ? `Manifest ${manifest.manifestNumber} · ${data.message}`
          : 'Review the full alert context, confirm ownership, and jump back into the related queue.'
      }
      chips={
        <>
          <Chip size="small" label={data.category} />
          <Chip size="small" color={data.isRead ? 'default' : 'primary'} label={data.isRead ? 'Read' : 'Unread'} />
          {manifest?.manifestNumber && (
            <Chip size="small" color="info" variant="outlined" label={manifest.manifestNumber} />
          )}
          {paymentState && (
            <Chip
              size="small"
              color={paymentState.statusTone === 'default' ? 'default' : paymentState.statusTone}
              label={paymentState.statusLabel}
            />
          )}
        </>
      }
      actions={
        <>
          <Button component={RouterLink} to="/notifications">
            Back to alerts
          </Button>
          {!data.isRead && (
            <Button
              variant="outlined"
              disabled={marking}
              onClick={async () => {
                await markRead({ notificationId: data.id }).unwrap();
              }}
            >
              Mark as read
            </Button>
          )}
          {paymentAction && (
            <Button
              component={RouterLink}
              to={paymentAction.path}
              variant={paymentAction.variant ?? 'contained'}
              color={paymentAction.variant === 'contained' ? 'success' : 'inherit'}
              startIcon={<PaymentsOutlinedIcon />}
            >
              {paymentAction.label}
            </Button>
          )}
          {secondaryPaymentAction && (
            <Button
              component={RouterLink}
              to={secondaryPaymentAction.path}
              variant={secondaryPaymentAction.variant ?? 'outlined'}
              startIcon={<PaymentsOutlinedIcon />}
            >
              {secondaryPaymentAction.label}
            </Button>
          )}
          {manifestPath && (
            <Button
              component={RouterLink}
              to={manifestPath}
              variant={paymentAction ? 'outlined' : 'contained'}
              startIcon={<DescriptionOutlinedIcon />}
            >
              Open manifest{manifest?.manifestNumber ? ` · ${manifest.manifestNumber}` : ''}
            </Button>
          )}
          {!manifestPath && related && (
            <Button component={RouterLink} to={related} variant="outlined">
              Open related page
            </Button>
          )}
        </>
      }
      stats={[
        { label: 'Status', value: data.isRead ? 'Read' : 'Unread', hint: 'Current acknowledgment state', tone: data.isRead ? 'success' : 'warning' },
        { label: 'Category', value: data.category, hint: 'Workflow source', tone: 'info' },
        {
          label: 'Manifest',
          value: manifest?.manifestNumber ?? '—',
          hint: manifest?.blNumber ? `BL ${manifest.blNumber}` : 'Linked shipment',
          tone: manifest ? 'primary' : 'default',
        },
        { label: 'Created', value: new Date(data.createdAt).toLocaleDateString(), hint: new Date(data.createdAt).toLocaleTimeString(), tone: 'default' },
      ]}
    >
      <WorkflowSection title="Message" subtitle="This is the full body delivered to the user.">
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {data.message}
        </Typography>
      </WorkflowSection>

      {isBilling && manifest && (
        <WorkflowSection
          title="Generated billing"
          subtitle="Review the billing PDF and payment status from the live manifest record."
        >
          <Stack spacing={2}>
            {paymentState && (
              <Alert severity={paymentStatusAlertSeverity(paymentState.statusTone)}>
                {paymentState.statusLabel}
                {paymentState.isPaid && ' · No further payment is required.'}
                {paymentState.isPending && ' · Accounting is reviewing your submission.'}
                {paymentState.needsPayment && ' · Upload your payment receipt to continue.'}
              </Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
              <Chip label={`Manifest ${manifest.manifestNumber}`} color="primary" />
              {manifest.blNumber && <Chip label={`BL ${manifest.blNumber}`} variant="outlined" />}
              {manifest.billingTotal != null && manifest.billingCurrency && (
                <Chip
                  label={`${money(manifest.billingTotal, manifest.billingCurrency)} ${manifest.billingCurrency}`}
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>

            {billingUrl ? (
              <>
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    minHeight: { xs: 360, md: 520 },
                  }}
                >
                  <Box
                    component="iframe"
                    title={`Billing PDF · ${manifest.manifestNumber}`}
                    src={billingUrl}
                    sx={{ width: '100%', height: { xs: 360, md: 520 }, border: 0, display: 'block' }}
                  />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
                  <PaymentActionButtons primary={paymentAction} secondary={secondaryPaymentAction} />
                  <Button
                    component={RouterLink}
                    to={manifestPath!}
                    variant="outlined"
                    startIcon={<DescriptionOutlinedIcon />}
                  >
                    Open manifest {manifest.manifestNumber}
                  </Button>
                  <Button
                    component="a"
                    href={billingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    startIcon={<OpenInNewOutlinedIcon />}
                  >
                    Open PDF in new tab
                  </Button>
                </Stack>
              </>
            ) : (
              <Stack spacing={2}>
                <Alert severity="info">
                  Billing PDF is not available yet for manifest{' '}
                  <Link component={RouterLink} to={manifestPath!} fontWeight={600}>
                    {manifest.manifestNumber}
                  </Link>
                  .
                </Alert>
                <PaymentActionButtons primary={paymentAction} secondary={secondaryPaymentAction} />
              </Stack>
            )}
          </Stack>
        </WorkflowSection>
      )}

      {isEdoPayment && !isBilling && (
        <WorkflowSection
          title="eDO payment"
          subtitle="Status is synced from the linked eDO and payment records."
        >
          <Stack spacing={2}>
            {paymentState && (
              <Alert severity={paymentStatusAlertSeverity(paymentState.statusTone)}>
                {paymentState.statusLabel}
                {paymentState.isPaid && ' · No further payment is required.'}
                {paymentState.isPending && ' · Waiting for admin validation.'}
                {paymentState.needsPayment && ' · Upload your eDO payment receipt to continue.'}
              </Alert>
            )}
            {manifest && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
                <Chip label={`Manifest ${manifest.manifestNumber}`} color="primary" />
                {edoFromSubject?.edoNumber && (
                  <Chip label={`eDO ${edoFromSubject.edoNumber}`} variant="outlined" />
                )}
              </Stack>
            )}
            <PaymentActionButtons primary={paymentAction} secondary={secondaryPaymentAction} />
          </Stack>
        </WorkflowSection>
      )}

      <WorkflowSection title="Context" subtitle="Use the related subject to navigate back into the owning workflow.">
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Logged at {new Date(data.createdAt).toLocaleString()}
          </Typography>
          {manifest && (
            <Typography variant="body2" color="text.secondary">
              Manifest:{' '}
              <Link component={RouterLink} to={manifestPath!} fontWeight={600}>
                {manifest.manifestNumber}
              </Link>
              {manifest.consigneeName ? ` · Consignee ${manifest.consigneeName}` : ''}
              {manifest.brokerName ? ` · Broker ${manifest.brokerName}` : ''}
            </Typography>
          )}
          {data.subjectType && !manifest && (
            <Typography variant="body2" color="text.secondary">
              Related subject: {data.subjectType}
              {data.subjectId ? ` · ${data.subjectId}` : ''}
            </Typography>
          )}
        </Stack>
      </WorkflowSection>
    </WorkflowPage>
  );
}
