import type { SvgIconComponent } from '@mui/icons-material';
import type { NavAccessOptions } from '../../shared/brokerAccreditation';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import DirectionsBoatOutlinedIcon from '@mui/icons-material/DirectionsBoatOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import MoveUpOutlinedIcon from '@mui/icons-material/MoveUpOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import AspectRatioOutlinedIcon from '@mui/icons-material/AspectRatioOutlined';
import DynamicFormOutlinedIcon from '@mui/icons-material/DynamicFormOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AnchorOutlinedIcon from '@mui/icons-material/AnchorOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

export const ALL_ROLES = [
  'SystemAdmin',
  'ShippingLinesAdmin',
  'SlStaff',
  'Evaluator',
  'Accounting',
  'TerminalTeam',
  'CyStaff',
  'Broker',
  'Consignee',
  'Trucker',
] as const;

export type AppRole = (typeof ALL_ROLES)[number] | string;

export type NavItem = {
  id: string;
  label: string;
  path: string;
  roles: string[];
  icon: SvgIconComponent;
  exact?: boolean;
  /** Optional badge key rendered by SideNav (e.g. awaitingFinalApprovals). */
  badgeKey?:
    | 'awaitingFinalApprovals'
    | 'pendingPayments'
    | 'pendingEdoPayments'
    | 'pendingEdoRelease'
    | 'pendingAppeals'
    | 'pendingTransfers'
    | 'pendingPreForecastIntake'
    | 'pendingCyScheduleConfirm'
    | 'pendingDetentionBillings'
    | 'truckerPreForecastInProgress'
    | 'truckerEdoPayments';
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const STAFF = ['ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Accounting'];
const RELEASE = ['SlStaff', 'ShippingLinesAdmin', 'TerminalTeam', 'SystemAdmin'];
const PAYMENT_ADMIN = ['SystemAdmin', 'Accounting'];
const ADMIN = ['SystemAdmin', 'ShippingLinesAdmin'];
const HIERARCHY = ['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Accounting'];
const YARD = ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam', 'Trucker'];
const OPS = ['ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Broker', 'Consignee', 'TerminalTeam'];

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        roles: [...ALL_ROLES],
        icon: DashboardOutlinedIcon,
      },
    ],
  },
  {
    id: 'cargo',
    label: 'Cargo Workflow',
    items: [
      {
        id: 'manifests',
        label: 'Manifests',
        path: '/manifests',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'Broker', 'Consignee'],
        icon: DescriptionOutlinedIcon,
      },
      {
        id: 'payments',
        label: 'Payments',
        path: '/payments',
        roles: ['ShippingLinesAdmin', 'Accounting', 'Broker', 'Consignee'],
        icon: PaymentsOutlinedIcon,
        badgeKey: 'pendingPayments',
      },
    ],
  },
  {
    id: 'edo',
    label: 'Release Workflow',
    items: [
      {
        id: 'edo',
        label: 'eDO / CRO',
        path: '/edo',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'Broker', 'Consignee', 'TerminalTeam'],
        icon: LocalShippingOutlinedIcon,
        exact: true,
      },
      {
        id: 'renewals',
        label: 'Renewals',
        path: '/edo/renewals',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'Broker', 'Consignee'],
        icon: ReplayOutlinedIcon,
      },
      {
        id: 'edo-payment-validation',
        label: 'eDO Payment Validation',
        path: '/edo/payment-validation',
        roles: PAYMENT_ADMIN,
        icon: FactCheckOutlinedIcon,
        badgeKey: 'pendingEdoPayments',
      },
      {
        id: 'edo-release',
        label: 'Release eDO / CRO',
        path: '/edo/release',
        roles: RELEASE,
        icon: VerifiedOutlinedIcon,
      },
    ],
  },
  {
    id: 'yard',
    label: 'Terminal & Yard',
    items: [
      {
        id: 'container-inventory',
        label: 'Container Inventory',
        path: '/container-inventory',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'TerminalTeam'],
        icon: WarehouseOutlinedIcon,
      },
      {
        id: 'yard',
        label: 'Yard admin',
        path: '/yard',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam'],
        icon: WarehouseOutlinedIcon,
      },
      {
        id: 'dwell',
        label: 'Dwell',
        path: '/dwell',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam'],
        icon: TimerOutlinedIcon,
      },
      {
        id: 'pre-forecast',
        label: 'Pre-forecast',
        path: '/pre-forecast',
        roles: [...YARD, 'Trucker', 'CyStaff', 'Accounting'],
        icon: DirectionsBoatOutlinedIcon,
        badgeKey: 'pendingPreForecastIntake',
      },
      {
        id: 'utilization',
        label: 'Utilization',
        path: '/reports/utilization',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam'],
        icon: AssessmentOutlinedIcon,
      },
    ],
  },
  {
    id: 'ops',
    label: 'Review Queues',
    items: [
      {
        id: 'sas',
        label: 'SAS',
        path: '/sas',
        roles: OPS,
        icon: AssignmentOutlinedIcon,
      },
      {
        id: 'transfers',
        label: 'Transfers',
        path: '/transfers',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'Consignee', 'Broker'],
        icon: SwapHorizOutlinedIcon,
      },
      {
        id: 'appeals',
        label: 'Appeals',
        path: '/appeals',
        roles: ['ShippingLinesAdmin', 'Broker', 'Consignee'],
        icon: GavelOutlinedIcon,
      },
      {
        id: 'repositioning',
        label: 'Reposition',
        path: '/repositioning',
        roles: ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam', 'Broker'],
        icon: MoveUpOutlinedIcon,
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Audit',
    items: [
      {
        id: 'audit-reports',
        label: 'Reports & audit',
        path: '/reports/audit',
        roles: STAFF,
        icon: FactCheckOutlinedIcon,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      {
        id: 'platform',
        label: 'Platform',
        path: '/admin/platform',
        roles: ADMIN,
        icon: SettingsOutlinedIcon,
      },
      {
        id: 'shipping-lines',
        label: 'Brand settings',
        path: '/admin/shipping-lines',
        roles: ADMIN,
        icon: BusinessOutlinedIcon,
      },
      {
        id: 'hierarchy',
        label: 'Hierarchy',
        path: '/admin/hierarchy',
        roles: HIERARCHY,
        icon: AccountTreeOutlinedIcon,
      },
    ],
  },
];

function canAccess(roles: string[], role: string): boolean {
  return roles.includes(role);
}

export function getNavGroups(role: string | undefined | null, options?: NavAccessOptions): NavGroup[] {
  const r = role ?? '';

  // Broker portal: workspace switcher lives in sidebar header
  if (r === 'Broker') {
    const groups: NavGroup[] = [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Overview',
            path: '/',
            roles: ['Broker'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'accreditation',
        label: 'Accreditation',
        items: [
          {
            id: 'sas',
            label: 'SAS Application',
            path: '/sas',
            roles: ['Broker'],
            icon: AssignmentOutlinedIcon,
          },
        ],
      },
      {
        id: 'cargo',
        label: 'My Cargo',
        items: [
          {
            id: 'manifests',
            label: 'Manifests',
            path: '/manifests',
            roles: ['Broker'],
            icon: DescriptionOutlinedIcon,
          },
          {
            id: 'edo',
            label: 'eDO / CRO',
            path: '/edo',
            roles: ['Broker'],
            icon: LocalShippingOutlinedIcon,
            exact: true,
          },
          {
            id: 'manifest-payments',
            label: 'Manifest Payments',
            path: '/manifest-payments',
            roles: ['Broker'],
            icon: ReceiptLongOutlinedIcon,
          },
          {
            id: 'payments',
            label: 'Detention Billings',
            path: '/payments',
            roles: ['Broker'],
            icon: PaymentsOutlinedIcon,
            badgeKey: 'pendingDetentionBillings',
          },
          {
            id: 'renewals',
            label: 'Renewals',
            path: '/edo/renewals',
            roles: ['Broker'],
            icon: ReplayOutlinedIcon,
          },
        ],
      },
      {
        id: 'requests',
        label: 'Requests',
        items: [
          {
            id: 'transfers',
            label: 'Broker Transfers',
            path: '/transfers',
            roles: ['Broker'],
            icon: SwapHorizOutlinedIcon,
          },
          {
            id: 'appeals',
            label: 'Suspension Appeals',
            path: '/appeals',
            roles: ['Broker'],
            icon: GavelOutlinedIcon,
          },
        ],
      },
    ];

    if (options?.brokerAccredited === false) {
      return groups.filter((group) => group.id === 'home' || group.id === 'accreditation');
    }

    return groups;
  }

  if (r === 'Consignee') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['Consignee'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'account',
        label: 'My Account',
        items: [
          {
            id: 'sas',
            label: 'Accreditation',
            path: '/sas',
            roles: ['Consignee'],
            icon: AssignmentOutlinedIcon,
          },
          {
            id: 'brokers',
            label: 'My Brokers',
            path: '/brokers',
            roles: ['Consignee'],
            icon: PeopleOutlineOutlinedIcon,
          },
        ],
      },
      {
        id: 'cargo',
        label: 'Cargo & Billing',
        items: [
          {
            id: 'manifests',
            label: 'Manifests',
            path: '/manifests',
            roles: ['Consignee'],
            icon: DescriptionOutlinedIcon,
          },
          {
            id: 'edo',
            label: 'eDO / CRO',
            path: '/edo',
            roles: ['Consignee'],
            icon: LocalShippingOutlinedIcon,
            exact: true,
          },
          {
            id: 'manifest-payments',
            label: 'Manifest Payments',
            path: '/manifest-payments',
            roles: ['Consignee'],
            icon: ReceiptLongOutlinedIcon,
          },
          {
            id: 'payments',
            label: 'Detention Billings',
            path: '/payments',
            roles: ['Consignee'],
            icon: PaymentsOutlinedIcon,
            badgeKey: 'pendingDetentionBillings',
          },
          {
            id: 'renewals',
            label: 'Renewals',
            path: '/edo/renewals',
            roles: ['Consignee'],
            icon: ReplayOutlinedIcon,
          },
        ],
      },
      {
        id: 'requests',
        label: 'Requests',
        items: [
          {
            id: 'transfers',
            label: 'Broker Transfers',
            path: '/transfers',
            roles: ['Consignee'],
            icon: SwapHorizOutlinedIcon,
          },
        ],
      },
    ];
  }

  if (r === 'ShippingLinesAdmin') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['ShippingLinesAdmin'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'operations',
        label: 'Operations',
        items: [
          {
            id: 'manifests',
            label: 'NOA & BL Workflow',
            path: '/manifests',
            roles: ['ShippingLinesAdmin'],
            icon: DescriptionOutlinedIcon,
          },
          {
            id: 'edo-release',
            label: 'Release eDO / CRO',
            path: '/edo/release',
            roles: ['ShippingLinesAdmin'],
            icon: VerifiedOutlinedIcon,
          },
          {
            id: 'yard',
            label: 'Container Inventory',
            path: '/container-inventory',
            roles: ['ShippingLinesAdmin'],
            icon: WarehouseOutlinedIcon,
          },
          {
            id: 'repositioning',
            label: 'Outbound Requests',
            path: '/repositioning',
            roles: ['ShippingLinesAdmin'],
            icon: MoveUpOutlinedIcon,
          },
        ],
      },
      {
        id: 'billing',
        label: 'Billing',
        items: [
          {
            id: 'detention-rate',
            label: 'Detention Rate',
            path: '/admin/detention-rate',
            roles: ['ShippingLinesAdmin'],
            icon: TimerOutlinedIcon,
          },
        ],
      },
      {
        id: 'partners',
        label: 'Partners',
        items: [
          {
            id: 'approvals',
            label: 'Accreditations',
            path: '/approvals',
            roles: ['ShippingLinesAdmin'],
            icon: AssignmentOutlinedIcon,
            badgeKey: 'awaitingFinalApprovals',
          },
          {
            id: 'consignees',
            label: 'Consignees',
            path: '/shipping-admin/consignees',
            roles: ['ShippingLinesAdmin'],
            icon: PeopleOutlineOutlinedIcon,
          },
          {
            id: 'brokers',
            label: 'Brokers',
            path: '/shipping-admin/brokers',
            roles: ['ShippingLinesAdmin'],
            icon: BusinessOutlinedIcon,
          },
        ],
      },
      {
        id: 'queues',
        label: 'Review Queues',
        items: [
          {
            id: 'suspension-appeals',
            label: 'Suspension Appeals',
            path: '/shipping-admin/appeals',
            roles: ['ShippingLinesAdmin'],
            icon: GavelOutlinedIcon,
            badgeKey: 'pendingAppeals',
          },
          {
            id: 'transfer-requests',
            label: 'Transfer Requests',
            path: '/shipping-admin/transfers',
            roles: ['ShippingLinesAdmin'],
            icon: SwapHorizOutlinedIcon,
            badgeKey: 'pendingTransfers',
          },
        ],
      },
      {
        id: 'team',
        label: 'Team',
        items: [
          {
            id: 'hierarchy',
            label: 'My Team',
            path: '/admin/hierarchy',
            roles: ['ShippingLinesAdmin'],
            icon: AccountTreeOutlinedIcon,
          },
        ],
      },
    ];
  }

  if (r === 'SystemAdmin') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['SystemAdmin'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'edo-platform',
        label: 'eDO Platform',
        items: [
          {
            id: 'edo-payment-validation',
            label: 'Payment Validation',
            path: '/edo/payment-validation',
            roles: ['SystemAdmin'],
            icon: FactCheckOutlinedIcon,
            badgeKey: 'pendingEdoPayments',
          },
          {
            id: 'edo-release-queue',
            label: 'Release Monitor',
            path: '/admin/edo-release/queue',
            roles: ['SystemAdmin'],
            icon: TaskAltOutlinedIcon,
            badgeKey: 'pendingEdoRelease',
          },
          {
            id: 'edo-revenue',
            label: 'Revenue Report',
            path: '/admin/edo-release/revenue',
            roles: ['SystemAdmin'],
            icon: CurrencyExchangeOutlinedIcon,
          },
        ],
      },
      {
        id: 'governance',
        label: 'Governance',
        items: [
          {
            id: 'user-management',
            label: 'User Management',
            path: '/admin/users',
            roles: ['SystemAdmin'],
            icon: PeopleOutlineOutlinedIcon,
          },
          {
            id: 'audit-logs',
            label: 'Audit Logs',
            path: '/admin/audit-logs',
            roles: ['SystemAdmin'],
            icon: ListAltOutlinedIcon,
          },
          {
            id: 'edo-audit-search',
            label: 'eDO Audit Search',
            path: '/admin/edo-audit',
            roles: ['SystemAdmin'],
            icon: SearchOutlinedIcon,
          },
          {
            id: 'user-hierarchy',
            label: 'User Hierarchy',
            path: '/admin/hierarchy',
            roles: ['SystemAdmin'],
            icon: AccountTreeOutlinedIcon,
          },
        ],
      },
      {
        id: 'master-data',
        label: 'Master Data',
        items: [
          {
            id: 'shipping-lines',
            label: 'Shipping Lines',
            path: '/admin/shipping-lines',
            roles: ['SystemAdmin'],
            icon: DirectionsBoatOutlinedIcon,
          },
          {
            id: 'terminals',
            label: 'Terminal & CY',
            path: '/admin/terminals',
            roles: ['SystemAdmin'],
            icon: BusinessOutlinedIcon,
          },
          {
            id: 'teu-contracts',
            label: 'Contract TEU',
            path: '/admin/teu-contracts',
            roles: ['SystemAdmin'],
            icon: LocalShippingOutlinedIcon,
          },
          {
            id: 'container-types',
            label: 'Container Types',
            path: '/admin/container-types',
            roles: ['SystemAdmin'],
            icon: ViewInArOutlinedIcon,
          },
          {
            id: 'container-sizes',
            label: 'Container Sizes',
            path: '/admin/container-sizes',
            roles: ['SystemAdmin'],
            icon: AspectRatioOutlinedIcon,
          },
        ],
      },
      {
        id: 'templates-fees',
        label: 'Templates & Fees',
        items: [
          {
            id: 'form-builder',
            label: 'Form Builder',
            path: '/admin/form-builder',
            roles: ['SystemAdmin'],
            icon: DynamicFormOutlinedIcon,
          },
          {
            id: 'document-templates',
            label: 'Document Templates',
            path: '/admin/document-templates',
            roles: ['SystemAdmin'],
            icon: ArticleOutlinedIcon,
          },
          {
            id: 'payment-fees',
            label: 'Payment Fees',
            path: '/admin/payment-fees',
            roles: ['SystemAdmin'],
            icon: ReceiptLongOutlinedIcon,
          },
          {
            id: 'detention-rate',
            label: 'Detention Rate',
            path: '/admin/detention-rate',
            roles: ['SystemAdmin'],
            icon: TimerOutlinedIcon,
          },
        ],
      },
      {
        id: 'reports',
        label: 'Reports & Metrics',
        items: [
          {
            id: 'cy-utilization',
            label: 'CY Utilization',
            path: '/admin/reports/cy-utilization',
            roles: ['SystemAdmin'],
            icon: BarChartOutlinedIcon,
          },
          {
            id: 'port-utilization',
            label: 'Port Utilization',
            path: '/admin/reports/port-utilization',
            roles: ['SystemAdmin'],
            icon: AnchorOutlinedIcon,
          },
          {
            id: 'notification-metrics',
            label: 'Notification Metrics',
            path: '/admin/notification-metrics',
            roles: ['SystemAdmin'],
            icon: InsightsOutlinedIcon,
          },
        ],
      },
      {
        id: 'system',
        label: 'System',
        items: [
          {
            id: 'system-settings',
            label: 'System Settings',
            path: '/admin/system-settings',
            roles: ['SystemAdmin'],
            icon: SettingsOutlinedIcon,
          },
          {
            id: 'versions',
            label: 'Release notes',
            path: '/versions',
            roles: ['SystemAdmin'],
            icon: HistoryOutlinedIcon,
          },
        ],
      },
    ];
  }

  if (r === 'SlStaff') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['SlStaff'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'manifests',
        label: 'Manifest Workflow',
        items: [
          {
            id: 'manifests',
            label: 'NOA & BL Workflow',
            path: '/manifests',
            roles: ['SlStaff'],
            icon: DescriptionOutlinedIcon,
          },
        ],
      },
      {
        id: 'documents',
        label: 'eDO / CRO',
        items: [
          {
            id: 'edo',
            label: 'Generation Queue',
            path: '/edo',
            roles: ['SlStaff'],
            icon: LocalShippingOutlinedIcon,
            exact: true,
          },
          {
            id: 'edo-release',
            label: 'Release Queue',
            path: '/edo/release',
            roles: ['SlStaff'],
            icon: VerifiedOutlinedIcon,
          },
          {
            id: 'renewals',
            label: 'Renewal Requests',
            path: '/edo/renewals',
            roles: ['SlStaff'],
            icon: ReplayOutlinedIcon,
          },
        ],
      },
      {
        id: 'yard',
        label: 'Yard & Terminal',
        items: [
          {
            id: 'yard',
            label: 'Container Inventory',
            path: '/container-inventory',
            roles: ['SlStaff'],
            icon: WarehouseOutlinedIcon,
          },
          {
            id: 'pre-forecast',
            label: 'Pre-forecast renewals',
            path: '/pre-forecast',
            roles: ['SlStaff'],
            icon: DirectionsBoatOutlinedIcon,
            badgeKey: 'pendingPreForecastIntake',
          },
          {
            id: 'repositioning',
            label: 'Repositioning',
            path: '/repositioning',
            roles: ['SlStaff'],
            icon: MoveUpOutlinedIcon,
          },
        ],
      },
      {
        id: 'queues',
        label: 'Review Queues',
        items: [
          {
            id: 'transfer-requests',
            label: 'Transfer Requests',
            path: '/shipping-admin/transfers',
            roles: ['SlStaff'],
            icon: SwapHorizOutlinedIcon,
            badgeKey: 'pendingTransfers',
          },
        ],
      },
    ];
  }

  if (r === 'Accounting') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['Accounting'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'finance',
        label: 'Finance',
        items: [
          {
            id: 'payments',
            label: 'Payment Validation',
            path: '/payments',
            roles: ['Accounting'],
            icon: PaymentsOutlinedIcon,
            badgeKey: 'pendingPayments',
          },
          {
            id: 'edo-payment-validation',
            label: 'eDO Payment Validation',
            path: '/edo/payment-validation',
            roles: ['Accounting'],
            icon: FactCheckOutlinedIcon,
            badgeKey: 'pendingEdoPayments',
          },
          {
            id: 'renewals',
            label: 'Renewals',
            path: '/edo/renewals',
            roles: ['Accounting'],
            icon: ReplayOutlinedIcon,
          },
          {
            id: 'pre-forecast',
            label: 'Pre-forecast intake',
            path: '/pre-forecast',
            roles: ['Accounting'],
            icon: ListAltOutlinedIcon,
            badgeKey: 'pendingPreForecastIntake',
          },
          {
            id: 'manifests',
            label: 'Manifests',
            path: '/manifests',
            roles: ['Accounting'],
            icon: DescriptionOutlinedIcon,
          },
          {
            id: 'detention-rate',
            label: 'Detention Rate',
            path: '/admin/detention-rate',
            roles: ['Accounting'],
            icon: TimerOutlinedIcon,
          },
        ],
      },
      {
        id: 'oversight',
        label: 'Oversight',
        items: [
          {
            id: 'audit-reports',
            label: 'Reports & Audit',
            path: '/reports/audit',
            roles: ['Accounting'],
            icon: FactCheckOutlinedIcon,
          },
          {
            id: 'hierarchy',
            label: 'User Hierarchy',
            path: '/admin/hierarchy',
            roles: ['Accounting'],
            icon: AccountTreeOutlinedIcon,
          },
        ],
      },
    ];
  }

  if (r === 'Evaluator') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['Evaluator'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'review',
        label: 'Review Work',
        items: [
          {
            id: 'sas',
            label: 'SAS Applications',
            path: '/sas',
            roles: ['Evaluator'],
            icon: AssignmentOutlinedIcon,
          },
        ],
      },
      {
        id: 'reference',
        label: 'Reference',
        items: [
          {
            id: 'hierarchy',
            label: 'User Hierarchy',
            path: '/admin/hierarchy',
            roles: ['Evaluator'],
            icon: AccountTreeOutlinedIcon,
          },
          {
            id: 'audit-reports',
            label: 'Reports & Audit',
            path: '/reports/audit',
            roles: ['Evaluator'],
            icon: FactCheckOutlinedIcon,
          },
        ],
      },
    ];
  }

  if (r === 'TerminalTeam') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['TerminalTeam'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'gate',
        label: 'Gate Operations',
        items: [
          {
            id: 'pre-forecast',
            label: 'Pre-forecast',
            path: '/pre-forecast',
            roles: ['TerminalTeam'],
            icon: DirectionsBoatOutlinedIcon,
            badgeKey: 'pendingPreForecastIntake',
          },
          {
            id: 'edo-release',
            label: 'Release eDO / CRO',
            path: '/edo/release',
            roles: ['TerminalTeam'],
            icon: VerifiedOutlinedIcon,
          },
          {
            id: 'dwell',
            label: 'Dwell Monitoring',
            path: '/dwell',
            roles: ['TerminalTeam'],
            icon: TimerOutlinedIcon,
          },
        ],
      },
    ];
  }

  if (r === 'CyStaff') {
    if (options?.cyAssigned === false) {
      return [
        {
          id: 'account',
          label: 'Account',
          items: [
            {
              id: 'profile',
              label: 'Profile',
              path: '/profile',
              roles: ['CyStaff'],
              icon: AssignmentOutlinedIcon,
            },
          ],
        },
      ];
    }

    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['CyStaff'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'yard',
        label: 'Container Yard',
        items: [
          {
            id: 'pre-forecast',
            label: 'Pre-forecast',
            path: '/pre-forecast',
            roles: ['CyStaff'],
            icon: DirectionsBoatOutlinedIcon,
            badgeKey: 'pendingCyScheduleConfirm',
          },
          {
            id: 'container-inventory',
            label: 'Container inventory',
            path: '/container-inventory',
            roles: ['CyStaff'],
            icon: WarehouseOutlinedIcon,
          },
        ],
      },
    ];
  }

  if (r === 'Trucker') {
    return [
      {
        id: 'home',
        label: 'Home',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/',
            roles: ['Trucker'],
            icon: DashboardOutlinedIcon,
          },
        ],
      },
      {
        id: 'gate',
        label: 'Gate & Pickup',
        items: [
          {
            id: 'pre-forecast',
            label: 'Pre-forecast',
            path: '/pre-forecast',
            roles: ['Trucker'],
            icon: DirectionsBoatOutlinedIcon,
            badgeKey: 'truckerPreForecastInProgress',
          },
          {
            id: 'trucker-payments',
            label: 'eDO Payments',
            path: '/trucker/payments',
            roles: ['Trucker'],
            icon: PaymentsOutlinedIcon,
            badgeKey: 'truckerEdoPayments',
          },
          {
            id: 'renewals',
            label: 'Renewed eDO',
            path: '/edo/renewals',
            roles: ['Trucker'],
            icon: ReplayOutlinedIcon,
          },
        ],
      },
    ];
  }

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccess(item.roles, r)),
  })).filter((group) => group.items.length > 0);
}

/** Primary shortcuts for hub tiles + mobile bottom bar (max ~4). */
export function getQuickActions(role: string | undefined | null, options?: NavAccessOptions): NavItem[] {
  const r = role ?? '';
  const catalog = getNavGroups(r, options).flatMap((g) => g.items);
  const byId = (id: string) => catalog.find((i) => i.id === id);

  const prefs: Record<string, string[]> = {
    SystemAdmin: ['dashboard', 'edo-payment-validation', 'edo-release-queue', 'user-management'],
    ShippingLinesAdmin: ['dashboard', 'approvals', 'manifests', 'edo-release'],
    SlStaff: ['dashboard', 'manifests', 'pre-forecast', 'edo-release'],
    Evaluator: ['dashboard', 'sas', 'audit-reports', 'hierarchy'],
    Accounting: ['dashboard', 'payments', 'edo-payment-validation', 'pre-forecast'],
    TerminalTeam: ['dashboard', 'pre-forecast', 'edo-release', 'dwell'],
    CyStaff: options?.cyAssigned === false ? ['profile'] : ['dashboard', 'pre-forecast', 'container-inventory'],
    Broker: options?.brokerAccredited === false
      ? ['dashboard', 'sas']
      : ['dashboard', 'manifests', 'manifest-payments', 'payments'],
    Consignee: ['dashboard', 'manifests', 'manifest-payments', 'payments'],
    Trucker: ['dashboard', 'pre-forecast', 'trucker-payments', 'renewals', 'profile'],
  };

  const ids = prefs[r] ?? ['dashboard', 'profile'];
  return ids.map(byId).filter((x): x is NavItem => Boolean(x)).slice(0, 4);
}

export function getBottomNavItems(role: string | undefined | null, options?: NavAccessOptions): NavItem[] {
  const actions = getQuickActions(role, options);
  const profile = getNavGroups(role, options).flatMap((g) => g.items).find((i) => i.id === 'profile');
  const merged = [...actions];
  if (profile && !merged.some((i) => i.id === 'profile')) {
    merged.push(profile);
  }
  return merged.slice(0, 4);
}

export const DRAWER_WIDTH = 260;

/** NavLink `end` — parent paths must not stay active on child routes (e.g. /pre-forecast vs /pre-forecast/submissions). */
export function navLinkEnd(item: NavItem, allItems: NavItem[]): boolean {
  if (item.exact === true) return true;
  if (item.exact === false) return false;
  if (item.path === '/') return true;
  return allItems.some((other) => other.path !== item.path && other.path.startsWith(`${item.path}/`));
}

/** Pick the most specific nav item matching the current pathname (for bottom nav highlight). */
export function findActiveNavIndex(pathname: string, items: NavItem[]): number {
  let bestIdx = -1;
  let bestLen = -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.path === '/') {
      if (pathname === '/' && item.path.length > bestLen) {
        bestIdx = i;
        bestLen = item.path.length;
      }
      continue;
    }
    const matches =
      pathname === item.path ||
      (!navLinkEnd(item, items) && pathname.startsWith(`${item.path}/`));
    if (matches && item.path.length > bestLen) {
      bestIdx = i;
      bestLen = item.path.length;
    }
  }

  return bestIdx;
}
