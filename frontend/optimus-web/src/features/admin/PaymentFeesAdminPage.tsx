import { useState } from 'react';
import { Alert, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { useGetActivePaymentFeeQuery, useUpsertPaymentFeeMutation } from '../../app/api';
import { formRowStackProps } from '../../shared/responsiveLayout';
import { WorkflowPage, WorkflowSection } from '../shared/WorkflowPage';

const FEE_TYPES = [
  { id: 'edo', label: 'eDO access fee' },
  { id: 'manifest_access', label: 'Manifest access fee' },
];

export function PaymentFeesAdminPage() {
  const [feeType, setFeeType] = useState('edo');
  const { data: fee, refetch } = useGetActivePaymentFeeQuery(feeType);
  const [upsertFee] = useUpsertPaymentFeeMutation();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Payment Fees"
      subtitle="Configure platform access fees and QR payment amounts shown to brokers and consignees."
      chips={fee ? <Chip size="small" label={`Active ${fee.feeType}`} color="primary" /> : undefined}
    >
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <WorkflowSection title="Fee configuration">
        <Stack {...formRowStackProps}>
          <TextField select label="Fee type" value={feeType} onChange={(e) => setFeeType(e.target.value)} sx={{ minWidth: 200 }}>
            {FEE_TYPES.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label="Amount (PHP)"
            value={amount || (fee?.amount != null ? String(fee.amount) : '')}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const value = Number(amount || fee?.amount || 0);
                await upsertFee({ feeType, amount: value }).unwrap();
                setMessage('Payment fee saved');
                setError(null);
                refetch();
              } catch {
                setError('Save failed');
              }
            }}
          >
            Save fee
          </Button>
        </Stack>
        {fee && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Current active fee: ₱{fee.amount.toLocaleString()} ({fee.feeType})
          </Alert>
        )}
      </WorkflowSection>
    </WorkflowPage>
  );
}
