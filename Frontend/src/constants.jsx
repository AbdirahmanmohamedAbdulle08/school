import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Wallet,
  Receipt,
  BookOpen,
  CreditCard,
  ShieldAlert,
  History,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  UserCheck,
  FileText,
  FileBarChart,
  GraduationCap,
  Settings,
  ClipboardList,
  PenSquare,
  Award
} from 'lucide-react';
import { UserRole } from './types.js';

export const NAV_CONFIG = [
  {
    label: 'Dashboard',
    translationKey: 'dashboard',
    path: '/',
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT, UserRole.TEACHER],
    subItems: []
  },
  {
    label: 'Academic Management',
    translationKey: 'academicManagement',
    path: '/academic',
    icon: BookOpen,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER],
    subItems: [
      { label: 'Classes', translationKey: 'classes', path: '/academic/classes', icon: BookOpen },
      { label: 'Teachers', translationKey: 'teachers', path: '/academic/teachers', icon: GraduationCap },
      { label: 'Students', translationKey: 'students', path: '/academic/students', icon: Users },
      { label: 'Class Promotion', translationKey: 'classPromotion', path: '/academic/promotion', icon: UserCheck },
    ]
  },
  {
    label: 'Attendance',
    translationKey: 'attendance',
    path: '/attendance',
    icon: CalendarCheck,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.TEACHER],
    subItems: [
      { label: 'Student Attendance', translationKey: 'studentAttendance', path: '/attendance/students', icon: CalendarCheck },
      { label: 'Teacher Attendance', translationKey: 'teacherAttendance', path: '/attendance/teachers', icon: CalendarCheck },
    ]
  },
  {
    label: 'Examinations',
    translationKey: 'examinations',
    path: '/exams',
    icon: ClipboardList,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.TEACHER],
    subItems: [
      { label: 'Exams', translationKey: 'exams', path: '/exams', icon: ClipboardList },
      { label: 'Mark Entry', translationKey: 'markEntry', path: '/exams/marks', icon: PenSquare },
      { label: 'Results', translationKey: 'results', path: '/exams/results', icon: Award },
    ]
  },
  {
    label: 'Finance',
    translationKey: 'finance',
    path: '/finance',
    icon: Wallet,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.ACCOUNTANT],
    subItems: [
      { label: 'Cashbook', translationKey: 'cashbook', path: '/finance/cashbook', icon: Receipt },
      { label: 'Payers', translationKey: 'payers', path: '/finance/payers', icon: Users },
      { label: 'Wallets', translationKey: 'wallets', path: '/finance/wallets', icon: Wallet },
    ]
  },
  {
    label: 'Institute Structure',
    translationKey: 'instituteStructure',
    path: '/structure',
    icon: Building2,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN],
    subItems: [
      { label: 'Branches', translationKey: 'branches', path: '/structure/branches', icon: Building2 },
    ]
  },
  {
    label: 'Reports',
    translationKey: 'reports',
    path: '/reports',
    icon: FileText,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT, UserRole.TEACHER],
    subItems: [
      { label: 'Fee Payment Report', translationKey: 'feePaymentReport', path: '/reports/payments', icon: Receipt },
      { label: 'Category Summary Report', translationKey: 'categorySummaryReport', path: '/reports/category-summary', icon: FileBarChart },
      { label: 'Payment Report', translationKey: 'paymentReport', path: '/reports/payment-report', icon: ArrowUpRight },
      { label: 'Attendance Ledger', translationKey: 'attendanceLedger', path: '/reports/attendance', icon: History },
    ]
  },
  {
    label: 'Users & Access',
    translationKey: 'usersAccess',
    path: '/access',
    icon: ShieldAlert,
    roles: [UserRole.SUPER_ADMIN],
    subItems: [
      { label: 'Users', translationKey: 'users', path: '/access/users', icon: Users },
      { label: 'Roles & Permissions', translationKey: 'rolesPermissions', path: '/access/roles', icon: ShieldAlert },
      { label: 'Logs', translationKey: 'logs', path: '/access/logs', icon: History },
    ]
  },
  {
    label: 'Settings',
    translationKey: 'settings',
    path: '/settings/preferences',
    icon: Settings,
    roles: [UserRole.SUPER_ADMIN],
  }
];
