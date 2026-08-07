import { useState } from 'react';
import { Alert } from '@mui/material';
import { useGetFormsQuery } from '../../app/api';
import { SasFormBuilder } from '../ops/SasFormBuilder';
import { WorkflowPage } from '../shared/WorkflowPage';

export function FormBuilderAdminPage() {
  const { data: forms = [], refetch } = useGetFormsQuery();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <WorkflowPage
      eyebrow="Configuration"
      title="Form Builder"
      subtitle="Design and publish SAS accreditation forms for brokers and consignees."
    >
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <SasFormBuilder
        forms={forms}
        onRefresh={refetch}
        onMessage={setMessage}
        onError={setError}
      />
    </WorkflowPage>
  );
}
