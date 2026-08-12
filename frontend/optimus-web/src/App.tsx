import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LoginPage } from './features/auth/LoginPage';
import { GuestRoute } from './features/auth/GuestRoute';
import { LastActivityTracker } from './features/auth/LastActivityTracker';
import { SessionIdleGuard } from './features/auth/SessionIdleGuard';
import {
  ForgotPasswordPage,
  RegisterBrokerPage,
  RegisterConsigneePage,
  RegisterTruckerPage,
  RoleAcceptancePage,
  VerifyEmailPage,
} from './features/auth/AuthPages';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { SystemAdminDashboardPage } from './features/dashboard/SystemAdminDashboardPage';
import { ConsigneeDashboardPage } from './features/dashboard/ConsigneeDashboardPage';
import { BrokerDashboardPage } from './features/dashboard/BrokerDashboardPage';
import { AppShell } from './features/layout/AppShell';
import { ShippingLinesPage } from './features/admin/ShippingLinesPage';
import { HierarchyPage } from './features/admin/HierarchyPage';
import { UserManagementPage } from './features/admin/UserManagementPage';
import { EdoRevenueAdminPage } from './features/admin/EdoRevenueAdminPage';
import { TerminalsAdminPage } from './features/admin/TerminalsAdminPage';
import { TeuContractAllocationsAdminPage } from './features/admin/TeuContractAllocationsAdminPage';
import { TerminalAdminDetailPage } from './features/admin/TerminalAdminDetailPage';
import { ContainerCatalogAdminPage } from './features/admin/ContainerCatalogAdminPage';
import { PaymentFeesAdminPage } from './features/admin/PaymentFeesAdminPage';
import { DetentionRateAdminPage } from './features/admin/DetentionRateAdminPage';
import { FormBuilderAdminPage } from './features/admin/FormBuilderAdminPage';
import { DocumentTemplatesAdminPage } from './features/admin/DocumentTemplatesAdminPage';
import { SystemSettingsAdminPage } from './features/admin/SystemSettingsAdminPage';
import { NotificationMetricsAdminPage } from './features/admin/NotificationMetricsAdminPage';
import { AuditLogsAdminPage } from './features/admin/AuditLogsAdminPage';
import { EdoAuditSearchAdminPage } from './features/admin/EdoAuditSearchAdminPage';
import { UtilizationKindAdminPage } from './features/admin/UtilizationKindAdminPage';
import { AdminSuspensionAppealsPage } from './features/admin/AdminSuspensionAppealsPage';
import { AdminTransferRequestsPage } from './features/admin/AdminTransferRequestsPage';
import { ShippingAdminConsigneesPage } from './features/admin/ShippingAdminConsigneesPage';
import { ShippingAdminConsigneeDetailPage } from './features/admin/ShippingAdminConsigneeDetailPage';
import { ShippingAdminBrokersPage } from './features/admin/ShippingAdminBrokersPage';
import { ShippingAdminBrokerDetailPage } from './features/admin/ShippingAdminBrokerDetailPage';
import { ManifestsPage } from './features/cargo/ManifestsPage';
import { ManifestCreatePage } from './features/cargo/ManifestCreatePage';
import { ManifestBulkImportNoasPage } from './features/cargo/ManifestBulkImportNoasPage';
import { ManifestBulkImportManifestsPage } from './features/cargo/ManifestBulkImportManifestsPage';
import { ManifestDetailPage } from './features/cargo/ManifestDetailPage';
import { ManifestGeneratePage } from './features/cargo/ManifestGeneratePage';
import { ManifestUploadBlPage } from './features/cargo/ManifestUploadBlPage';
import { ManifestGenerateBillingPage } from './features/cargo/ManifestGenerateBillingPage';
import { ManifestFinalPaymentPage } from './features/cargo/ManifestFinalPaymentPage';
import { ManifestEdoPaymentPage } from './features/cargo/ManifestEdoPaymentPage';
import { ManifestPaymentHistoryPage } from './features/cargo/ManifestPaymentHistoryPage';
import { PaymentsPage } from './features/cargo/PaymentsPage';
import { ManifestPaymentsPage } from './features/cargo/ManifestPaymentsPage';
import { AccountingPaymentReviewPage } from './features/cargo/AccountingPaymentReviewPage';
import { EdosPage } from './features/edo/EdosPage';
import { EdoReleasePage } from './features/edo/EdoReleasePage';
import { EdoPaymentReviewPage } from './features/edo/EdoPaymentReviewPage';
import { EdoPaymentValidationPage } from './features/edo/EdoPaymentValidationPage';
import { EdoDetailPage } from './features/edo/EdoDetailPage';
import { EdoPayToOpenPage } from './features/edo/EdoPayToOpenPage';
import { EdoRenewalsPage } from './features/edo/EdoRenewalsPage';
import { VerifyDocumentPage } from './features/edo/VerifyDocumentPage';
import { YardAdminPage } from './features/yard/YardAdminPage';
import { ContainerInventoryPage } from './features/yard/ContainerInventoryPage';
import { ContainerDetailPage } from './features/yard/ContainerDetailPage';
import { DwellPage } from './features/yard/DwellPage';
import { PreForecastIntakePage } from './features/yard/PreForecastIntakePage';
import { TruckerPaymentsPage } from './features/yard/TruckerPaymentsPage';
import { PreForecastAccountingDetailPage } from './features/yard/PreForecastAccountingDetailPage';
import { PreForecastDetentionPaymentPage } from './features/yard/PreForecastDetentionPaymentPage';
import { PreForecastSubmissionDetailPage } from './features/yard/PreForecastSubmissionDetailPage';
import { PreForecastTerminalReviewPage } from './features/yard/PreForecastTerminalReviewPage';
import { UtilizationReportPage } from './features/yard/UtilizationReportPage';
import { SasPage } from './features/ops/SasPage';
import { ApprovalsPage } from './features/ops/ApprovalsPage';
import { EvaluatorApplicationPage } from './features/ops/EvaluatorApplicationPage';
import { TransfersPage } from './features/ops/TransfersPage';
import { AppealsReferralsPage } from './features/ops/AppealsReferralsPage';
import { BrokersPage } from './features/ops/BrokersPage';
import { RepositioningPage } from './features/ops/RepositioningPage';
import { RepositioningCreatePage } from './features/ops/RepositioningCreatePage';
import { RepositioningDetailPage } from './features/ops/RepositioningDetailPage';
import { NotificationsPage } from './features/platform/NotificationsPage';
import { NotificationDetailPage } from './features/platform/NotificationDetailPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { WorkspaceSelectorPage } from './features/workspace/WorkspaceSelectorPage';
import { ApplyReferralPage } from './features/workspace/ApplyReferralPage';
import { WorkspaceGateLayout } from './features/workspace/WorkspaceGateLayout';
import { BrokerWorkspaceGate } from './features/workspace/BrokerWorkspaceGate';
import { CyStaffAssignmentGate } from './features/workspace/CyStaffAssignmentGate';
import { ReportsAuditPage } from './features/platform/ReportsAuditPage';
import { AdminPlatformPage } from './features/platform/AdminPlatformPage';
import { VersionsPage } from './features/platform/VersionsPage';
import type { RootState } from './app/store';
import { getAccessDeniedRedirect } from './shared/routeAccess';
import { saveLastActivityPath } from './shared/authReturnPath';

function AuthSessionLayer() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  if (!accessToken) return null;
  return (
    <>
      <LastActivityTracker />
      <SessionIdleGuard />
    </>
  );
}

function Protected({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const location = useLocation();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  if (!accessToken) {
    saveLastActivityPath(location.pathname, location.search);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={getAccessDeniedRedirect(user.role)} replace />;
  }
  return <>{children}</>;
}

function HomePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  // Brokers land on workspace first; gate also enforces this for deep links.
  if (user?.role === 'Broker' && !user.activeWorkspaceConsigneeId) {
    return <Navigate to="/workspace" replace />;
  }
  if (user?.role === 'Consignee') return <ConsigneeDashboardPage />;
  if (user?.role === 'Broker') return <BrokerDashboardPage />;
  if (user?.role === 'SystemAdmin') return <SystemAdminDashboardPage />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <>
      <AuthSessionLayer />
      <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register/broker" element={<RegisterBrokerPage />} />
      <Route path="/register/consignee" element={<RegisterConsigneePage />} />
      <Route path="/register/trucker" element={<RegisterTruckerPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/role-acceptance/:token" element={<RoleAcceptancePage />} />
      <Route path="/verify/:token" element={<VerifyDocumentPage />} />
      <Route path="/verify/document/:token" element={<VerifyDocumentPage />} />
      <Route path="/versions" element={<VersionsPage />} />

      <Route
        element={
          <Protected>
            <WorkspaceGateLayout />
          </Protected>
        }
      >
        <Route path="/workspace" element={<WorkspaceSelectorPage />} />
        <Route path="/workspace/referral" element={<ApplyReferralPage />} />
      </Route>

      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route element={<BrokerWorkspaceGate />}>
          <Route element={<CyStaffAssignmentGate />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/manifests" element={<ManifestsPage />} />
          <Route path="/manifests/create" element={<ManifestCreatePage />} />
          <Route path="/manifests/bulk-import" element={<ManifestBulkImportNoasPage />} />
          <Route path="/manifests/bulk-import-manifests" element={<ManifestBulkImportManifestsPage />} />
          <Route path="/manifests/:id/generate-manifest" element={<ManifestGeneratePage />} />
          <Route path="/manifests/:id/upload-bl" element={<ManifestUploadBlPage />} />
          <Route path="/manifests/:id/generate-billing" element={<ManifestGenerateBillingPage />} />
          <Route path="/manifests/:id/final-payment" element={<ManifestFinalPaymentPage />} />
          <Route path="/manifests/:id/edo-payment/:edoId" element={<ManifestEdoPaymentPage />} />
          <Route path="/manifests/:id/payment-history" element={<ManifestPaymentHistoryPage />} />
          <Route path="/manifests/:id" element={<ManifestDetailPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/manifest-payments" element={<ManifestPaymentsPage />} />
          <Route path="/payments/final/:id" element={<AccountingPaymentReviewPage />} />
          <Route path="/edo" element={<EdosPage />} />
          <Route path="/edo/renewals" element={<EdoRenewalsPage />} />
          <Route
            path="/edo/payment-validation"
            element={
              <Protected roles={['SystemAdmin']}>
                <EdoPaymentValidationPage />
              </Protected>
            }
          />
          <Route
            path="/edo/payment-validation/:id"
            element={
              <Protected roles={['SystemAdmin']}>
                <EdoPaymentReviewPage />
              </Protected>
            }
          />
          <Route
            path="/edo/release"
            element={
              <Protected roles={['SlStaff', 'ShippingLinesAdmin', 'TerminalTeam', 'SystemAdmin']}>
                <EdoReleasePage />
              </Protected>
            }
          />
          <Route
            path="/edo/release/payments/:id"
            element={<Navigate to="/edo/payment-validation" replace />}
          />
          <Route path="/admin/edo-release/queue" element={<Navigate to="/edo/release" replace />} />
          <Route
            path="/admin/edo-release/revenue"
            element={
              <Protected roles={['SystemAdmin']}>
                <EdoRevenueAdminPage />
              </Protected>
            }
          />
          <Route path="/edo/:id/payment" element={<EdoPayToOpenPage />} />
          <Route path="/edo/:id" element={<EdoDetailPage />} />
          <Route
            path="/trucker/payments"
            element={
              <Protected roles={['Trucker']}>
                <TruckerPaymentsPage />
              </Protected>
            }
          />
          <Route path="/yard" element={<YardAdminPage />} />
          <Route
            path="/pre-forecast"
            element={
              <Protected
                roles={[
                  'Trucker',
                  'TerminalTeam',
                  'ShippingLinesAdmin',
                  'SlStaff',
                  'CyStaff',
                  'Accounting',
                  'SystemAdmin',
                ]}
              >
                <PreForecastIntakePage />
              </Protected>
            }
          />
          <Route
            path="/pre-forecast/submissions"
            element={<Navigate to="/pre-forecast?tab=submissions" replace />}
          />
          <Route
            path="/pre-forecast/submissions/:id/review"
            element={
              <Protected roles={['TerminalTeam', 'ShippingLinesAdmin', 'SlStaff', 'SystemAdmin']}>
                <PreForecastTerminalReviewPage />
              </Protected>
            }
          />
          <Route
            path="/pre-forecast/submissions/:id"
            element={
              <Protected
                roles={[
                  'Trucker',
                  'TerminalTeam',
                  'ShippingLinesAdmin',
                  'SlStaff',
                  'CyStaff',
                  'Accounting',
                  'SystemAdmin',
                ]}
              >
                <PreForecastSubmissionDetailPage />
              </Protected>
            }
          />
          <Route
            path="/pre-forecast/:id/detention-payment"
            element={
              <Protected roles={['Broker', 'Consignee', 'SystemAdmin']}>
                <PreForecastDetentionPaymentPage />
              </Protected>
            }
          />
          <Route
            path="/pre-forecast/:id/billing"
            element={
              <Protected roles={['Accounting', 'SystemAdmin']}>
                <PreForecastAccountingDetailPage />
              </Protected>
            }
          />
          <Route
            path="/pre-forecast/:id"
            element={
              <Protected
                roles={[
                  'Trucker',
                  'TerminalTeam',
                  'ShippingLinesAdmin',
                  'SlStaff',
                  'CyStaff',
                  'Accounting',
                  'SystemAdmin',
                ]}
              >
                <PreForecastSubmissionDetailPage />
              </Protected>
            }
          />
          <Route
            path="/pre-forecast/yard"
            element={<Navigate to="/pre-forecast" replace />}
          />
          <Route path="/pre-advice" element={<Navigate to="/pre-forecast" replace />} />
          <Route
            path="/container-inventory"
            element={
              <Protected
                roles={['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff', 'Accounting', 'TerminalTeam', 'CyStaff']}
              >
                <ContainerInventoryPage />
              </Protected>
            }
          />
          <Route
            path="/container/:containerNumber/details"
            element={
              <Protected
                roles={['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff', 'Accounting', 'TerminalTeam', 'CyStaff']}
              >
                <ContainerDetailPage />
              </Protected>
            }
          />
          <Route path="/dwell" element={<DwellPage />} />
          <Route path="/reports/utilization" element={<UtilizationReportPage />} />
          <Route path="/sas" element={<SasPage />} />
          <Route
            path="/approvals"
            element={
              <Protected roles={['ShippingLinesAdmin']}>
                <ApprovalsPage />
              </Protected>
            }
          />
          <Route
            path="/evaluator/application/:id"
            element={
              <Protected roles={['Evaluator', 'SystemAdmin', 'ShippingLinesAdmin']}>
                <EvaluatorApplicationPage />
              </Protected>
            }
          />
          <Route
            path="/brokers"
            element={
              <Protected roles={['Consignee']}>
                <BrokersPage />
              </Protected>
            }
          />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/appeals" element={<AppealsReferralsPage />} />
          <Route path="/repositioning" element={<RepositioningPage />} />
          <Route
            path="/repositioning/new"
            element={
              <Protected roles={['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff']}>
                <RepositioningCreatePage />
              </Protected>
            }
          />
          <Route path="/repositioning/:id" element={<RepositioningDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notifications/:id" element={<NotificationDetailPage />} />
          <Route
            path="/reports/audit"
            element={
              <Protected
                roles={['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Accounting']}
              >
                <ReportsAuditPage />
              </Protected>
            }
          />
          <Route
            path="/admin/platform"
            element={
              <Protected roles={['SystemAdmin', 'ShippingLinesAdmin']}>
                <AdminPlatformPage />
              </Protected>
            }
          />
          <Route
            path="/admin/shipping-lines"
            element={
              <Protected roles={['SystemAdmin', 'ShippingLinesAdmin']}>
                <ShippingLinesPage />
              </Protected>
            }
          />
          <Route
            path="/shipping-admin/consignees"
            element={
              <Protected roles={['ShippingLinesAdmin']}>
                <ShippingAdminConsigneesPage />
              </Protected>
            }
          />
          <Route
            path="/shipping-admin/consignees/:id"
            element={
              <Protected roles={['ShippingLinesAdmin']}>
                <ShippingAdminConsigneeDetailPage />
              </Protected>
            }
          />
          <Route
            path="/shipping-admin/brokers"
            element={
              <Protected roles={['ShippingLinesAdmin']}>
                <ShippingAdminBrokersPage />
              </Protected>
            }
          />
          <Route
            path="/shipping-admin/brokers/:id"
            element={
              <Protected roles={['ShippingLinesAdmin']}>
                <ShippingAdminBrokerDetailPage />
              </Protected>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Protected roles={['SystemAdmin']}>
                <UserManagementPage />
              </Protected>
            }
          />
          <Route
            path="/shipping-admin/appeals"
            element={
              <Protected roles={['ShippingLinesAdmin']}>
                <AdminSuspensionAppealsPage />
              </Protected>
            }
          />
          <Route
            path="/shipping-admin/transfers"
            element={
              <Protected roles={['ShippingLinesAdmin', 'SlStaff']}>
                <AdminTransferRequestsPage />
              </Protected>
            }
          />
          <Route path="/admin/appeals" element={<Navigate to="/shipping-admin/appeals" replace />} />
          <Route path="/admin/transfers" element={<Navigate to="/shipping-admin/transfers" replace />} />
          <Route
            path="/admin/audit-logs"
            element={
              <Protected roles={['SystemAdmin']}>
                <AuditLogsAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/edo-audit"
            element={
              <Protected roles={['SystemAdmin']}>
                <EdoAuditSearchAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/terminals"
            element={
              <Protected roles={['SystemAdmin']}>
                <TerminalsAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/teu-contracts"
            element={
              <Protected roles={['SystemAdmin']}>
                <TeuContractAllocationsAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/terminals/:id"
            element={
              <Protected roles={['SystemAdmin']}>
                <TerminalAdminDetailPage />
              </Protected>
            }
          />
          <Route
            path="/admin/container-types"
            element={
              <Protected roles={['SystemAdmin']}>
                <ContainerCatalogAdminPage mode="types" />
              </Protected>
            }
          />
          <Route
            path="/admin/container-sizes"
            element={
              <Protected roles={['SystemAdmin']}>
                <ContainerCatalogAdminPage mode="sizes" />
              </Protected>
            }
          />
          <Route
            path="/admin/form-builder"
            element={
              <Protected roles={['SystemAdmin']}>
                <FormBuilderAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/document-templates"
            element={
              <Protected roles={['SystemAdmin']}>
                <DocumentTemplatesAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/payment-fees"
            element={
              <Protected roles={['SystemAdmin']}>
                <PaymentFeesAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/detention-rate"
            element={
              <Protected roles={['SystemAdmin', 'ShippingLinesAdmin', 'Accounting']}>
                <DetentionRateAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/reports/cy-utilization"
            element={
              <Protected roles={['SystemAdmin']}>
                <UtilizationKindAdminPage terminalKind="Cy" />
              </Protected>
            }
          />
          <Route
            path="/admin/reports/port-utilization"
            element={
              <Protected roles={['SystemAdmin']}>
                <UtilizationKindAdminPage terminalKind="Port" />
              </Protected>
            }
          />
          <Route
            path="/admin/notification-metrics"
            element={
              <Protected roles={['SystemAdmin']}>
                <NotificationMetricsAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/system-settings"
            element={
              <Protected roles={['SystemAdmin']}>
                <SystemSettingsAdminPage />
              </Protected>
            }
          />
          <Route
            path="/admin/hierarchy"
            element={
              <Protected
                roles={['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Accounting']}
              >
                <HierarchyPage />
              </Protected>
            }
          />
        </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
