import { UtilizationReportPage } from '../yard/UtilizationReportPage';

type Props = { terminalKind: 'Cy' | 'Port' };

export function UtilizationKindAdminPage({ terminalKind }: Props) {
  return (
    <UtilizationReportPage
      terminalKind={terminalKind}
      title={terminalKind === 'Cy' ? 'CY Utilization Report' : 'Port Utilization Report'}
      subtitle={
        terminalKind === 'Cy'
          ? 'Review container yard capacity pressure and return volume across CY terminals.'
          : 'Review inbound laden container volume and port terminal headroom.'
      }
    />
  );
}
