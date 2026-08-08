import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useSelector } from 'react-redux';
import {
  useGetManifestsQuery,
  useSubmitPaymentMutation,
  useGetExchangeRateQuery,
} from '../../app/api';
import type { RootState } from '../../app/store';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';
import { AccountingFinalPaymentsPage } from './AccountingFinalPaymentsPage';

export function PaymentsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isBroker = ['Broker', 'Consignee'].includes(user?.role ?? '');
  const isAccounting = user?.role === 'Accounting';

  const { data: manifests = [], refetch: refetchManifests } = useGetManifestsQuery(undefined, {
    skip: isAccounting,
  });
  const { data: fx } = useGetExchangeRateQuery(undefined, { skip: isAccounting });
  const [submitPayment] = useSubmitPaymentMutation();

  const [submit, setSubmit] = useState({
    manifestId: '',
    amount: 1250,
    currency: 'USD',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isAccounting) {
    return <AccountingFinalPaymentsPage />;
  }

  const payableManifests = manifests.filter((m) => /billing|payment|generated/i.test(m.workflowState));

  return (
    <WorkflowPage
      eyebrow="Payment Workflow"
      title="Payments"
      subtitle="Submit receipts for manifest final payment after billing is generated."
      chips={<Chip size="small" color="info" label={`FX ${fx?.rate ?? '-'}`} />}
      actions={
        <Button variant="outlined" startIcon={<ReceiptLongOutlinedIcon />} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Submit payment below
        </Button>
      }
      stats={[
        { label: 'Payable Manifests', value: payableManifests.length, hint: 'Billing generated', tone: 'info' },
        { label: 'FX Rate', value: fx?.rate ?? '-', hint: fx?.fromCache ? 'Cached' : 'Live', tone: 'success' },
      ]}
    >
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {isBroker && (
        <WorkflowSection
          title="Submit final payment"
          subtitle="Upload a PDF receipt for the manifest final payment. eDO access fees are paid separately from the manifest documents tab."
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Manifest"
              value={submit.manifestId}
              onChange={(e) => setSubmit({ ...submit, manifestId: e.target.value })}
              sx={{ minWidth: 180 }}
            >
              {manifests.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.manifestNumber} ({m.workflowState})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Amount"
              type="number"
              value={submit.amount}
              onChange={(e) => setSubmit({ ...submit, amount: Number(e.target.value) })}
              helperText="Final payment amount is validated against billing on submit."
            />
            <Button variant="contained" component="label">
              Submit + receipt
              <input
                hidden
                type="file"
                accept="application/pdf,.pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  setError(null);
                  try {
                    await submitPayment({
                      manifestId: submit.manifestId,
                      paymentType: 'FinalPayment',
                      amount: submit.amount,
                      currency: submit.currency,
                      receipt: file ?? undefined,
                    }).unwrap();
                    setMessage('Final payment submitted.');
                    refetchManifests();
                  } catch {
                    setError('Submit failed. Final payment needs BillingGenerated state.');
                  }
                }}
              />
            </Button>
          </Stack>
        </WorkflowSection>
      )}

      {!isBroker && (
        <Typography color="text.secondary">No payment actions are available for your role.</Typography>
      )}
    </WorkflowPage>
  );
}
