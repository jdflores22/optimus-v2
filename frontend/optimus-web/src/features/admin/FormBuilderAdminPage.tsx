import { useMemo, useState } from 'react';
import { Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useGetFormsQuery } from '../../app/api';
import { SasFormBuilder } from '../ops/SasFormBuilder';
import { WorkflowPage } from '../shared/WorkflowPage';

export function FormBuilderAdminPage() {
  const { data: forms = [], refetch } = useGetFormsQuery();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'Broker' | 'Consignee'>('Broker');

  const stats = useMemo(() => {
    const active = forms.filter((f) => f.status === 'Active').length;
    const published = forms.filter((f) => f.status === 'Published').length;
    const drafts = forms.filter((f) => f.status === 'Draft').length;
    const broker = forms.filter((f) => f.type === 'Broker').length;
    const consignee = forms.filter((f) => f.type === 'Consignee').length;
    return { total: forms.length, active, published, drafts, broker, consignee };
  }, [forms]);

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Form Configurations"
      subtitle="Manage accreditation forms and configurations for brokers and consignees."
      actions={
        <ToggleButtonGroup
          exclusive
          size="small"
          value={tab}
          onChange={(_, value: 'Broker' | 'Consignee' | null) => {
            if (value) setTab(value);
          }}
          aria-label="Form type"
        >
          <ToggleButton value="Broker">Broker ({stats.broker})</ToggleButton>
          <ToggleButton value="Consignee">Consignee ({stats.consignee})</ToggleButton>
        </ToggleButtonGroup>
      }
      stats={[
        { label: 'Total Forms', value: stats.total, tone: 'primary' },
        { label: 'Active', value: stats.active, tone: 'success' },
        { label: 'Published', value: stats.published, tone: 'info' },
        { label: 'Drafts', value: stats.drafts, tone: stats.drafts ? 'warning' : 'default' },
      ]}
    >
      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <SasFormBuilder
        forms={forms}
        tab={tab}
        onRefresh={refetch}
        onMessage={setMessage}
        onError={setError}
      />
    </WorkflowPage>
  );
}
