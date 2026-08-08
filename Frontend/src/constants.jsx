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
    path: '/',
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT, UserRole.TEACHER],
    subItems: []
  },
  {
    label: 'Academic Management',
    path: '/academic',
    icon: BookOpen,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER],
    subItems: [
      { label: 'Classes', path: '/academic/classes', icon: BookOpen },
      { label: 'Teachers', path: '/academic/teachers', icon: GraduationCap },
      { label: 'Students', path: '/academic/students', icon: Users },
      { label: 'Class Promotion', path: '/academic/promotion', icon: UserCheck },
    ]
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: CalendarCheck,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.TEACHER],
    subItems: [
      { label: 'Student Attendance', path: '/attendance/students', icon: CalendarCheck },
      { label: 'Teacher Attendance', path: '/attendance/teachers', icon: CalendarCheck },
    ]
  },
  {
    label: 'Examinations',
    path: '/exams',
    icon: ClipboardList,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.TEACHER],
    subItems: [
      { label: 'Exams', path: '/exams', icon: ClipboardList },
      { label: 'Mark Entry', path: '/exams/marks', icon: PenSquare },
      { label: 'Results', path: '/exams/results', icon: Award },
    ]
  },
  {
    label: 'Finance',
    path: '/finance',
    icon: Wallet,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.ACCOUNTANT],
    subItems: [
      { label: 'Cashbook', path: '/finance/cashbook', icon: Receipt },
      { label: 'Payers', path: '/finance/payers', icon: Users },
      { label: 'Wallets', path: '/finance/wallets', icon: Wallet },
    ]
  },
  {
    label: 'Institute Structure',
    path: '/structure',
    icon: Building2,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN],
    subItems: [
      { label: 'Branches', path: '/structure/branches', icon: Building2 },
    ]
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: FileText,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT, UserRole.TEACHER],
    subItems: [
      { label: 'Fee Payment Report', path: '/reports/payments', icon: Receipt },
      { label: 'Category Summary Report', path: '/reports/category-summary', icon: FileBarChart },
      { label: 'Payment Report', path: '/reports/payment-report', icon: ArrowUpRight },
      { label: 'Attendance Ledger', path: '/reports/attendance', icon: History },
    ]
  },
  {
    label: 'Users & Access',
    path: '/access',
    icon: ShieldAlert,
    roles: [UserRole.SUPER_ADMIN],
    subItems: [
      { label: 'Users', path: '/access/users', icon: Users },
      { label: 'Roles & Permissions', path: '/access/roles', icon: ShieldAlert },
      { label: 'Logs', path: '/access/logs', icon: History },
    ]
  },
  {
    label: 'Settings',
    path: '/settings/profile',
    icon: Settings,
    roles: [UserRole.SUPER_ADMIN],
  }
];
