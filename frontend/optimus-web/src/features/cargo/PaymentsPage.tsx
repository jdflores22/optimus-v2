import { Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { WorkflowPage } from '../shared/WorkflowPage';
import { AccountingFinalPaymentsPage } from './AccountingFinalPaymentsPage';
import { DetentionBillingsPage } from './DetentionBillingsPage';

/** Route shell: accounting validation queue vs broker/consignee detention billings. */
export function PaymentsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isBrokerSide = ['Broker', 'Consignee'].includes(user?.role ?? '');

  if (user?.role === 'Accounting') {
    return <AccountingFinalPaymentsPage />;
  }

  if (isBrokerSide) {
    return <DetentionBillingsPage />;
  }

  return (
    <WorkflowPage eyebrow="Payments" title="Payments" subtitle="No payment queue is available for your role.">
      <Typography color="text.secondary">Use manifests or eDO screens for role-specific payment actions.</Typography>
    </WorkflowPage>
  );
}
