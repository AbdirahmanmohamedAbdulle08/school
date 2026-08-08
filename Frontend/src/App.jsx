import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Login from './pages/Login.jsx';
import api from './services/api';
import { applyBrandColors, getDefaultColors } from './utils/colorUtils';
import DashboardOverview from './pages/DashboardOverview.jsx';

import ClassesManagement from './pages/ClassesManagement.jsx';
import TeachersManagement from './pages/TeachersManagement.jsx';
import StudentsManagement from './pages/StudentsManagement.jsx';
import StudentAttendanceManagement from './pages/StudentAttendanceManagement.jsx';
import TeacherAttendanceManagement from './pages/TeacherAttendanceManagement.jsx';
import ExamsManagement from './pages/ExamsManagement.jsx';
import ExamMarks from './pages/ExamMarks.jsx';
import ExamResults from './pages/ExamResults.jsx';
import ClassPromotion from './pages/ClassPromotion.jsx';
import StudentAttendanceReport from './pages/StudentAttendanceReport.jsx';
import FeePaymentReport from './pages/FeePaymentReport.jsx';
import CashbookManagement from './pages/CashbookManagement.jsx';
import GuardianPaymentReport from './pages/GuardianPaymentReport.jsx';
import CashbookCategoryReport from './pages/CashbookCategoryReport.jsx';
import CashbookPaymentReport from './pages/CashbookPaymentReport.jsx';
import PayersManagement from './pages/PayersManagement.jsx';
import SalariesManagement from './pages/SalariesManagement.jsx';
import ExpensesManagement from './pages/ExpensesManagement.jsx';
import TransactionsManagement from './pages/TransactionsManagement.jsx';
import WalletsManagement from './pages/WalletsManagement.jsx';
import BranchesManagement from './pages/BranchesManagement.jsx';
import UsersList from './pages/UsersList.jsx';
import RolesPermissions from './pages/RolesPermissions.jsx';
import ActivityLogs from './pages/ActivityLogs.jsx';
import BusinessProfile from './pages/BusinessProfile.jsx';
import SystemPreferences from './pages/settings/SystemPreferences.jsx';

import { UserRole } from './types.js';
import { NAV_CONFIG } from './constants.jsx';
import { userHasPermission } from './utils/permissionUtils';
import { useLanguage } from './i18n/LanguageContext.jsx';

const RoleGuard = ({ children, currentRole, user }) => {
  const location = useLocation();
  const path = location.pathname;

  const isAllowed = () => {
    if (path === '/') return true;

    const roleNormalized = typeof currentRole === 'string' ? currentRole.toLowerCase() : '';
    const isSpecialRole = roleNormalized.includes('admin') || 
                         roleNormalized.includes('super') || 
                         roleNormalized.includes('owner') ||
                         roleNormalized.includes('system');

    if (isSpecialRole) return true;

    const matchingNavItem = NAV_CONFIG.find(item => {
      if (item.path === path) return true;
      if (item.subItems?.some(sub => sub.path === path)) return true;
      if (item.path !== '/' && path.startsWith(item.path)) return true;
      return false;
    });

    if (matchingNavItem) {
      if (matchingNavItem.roles?.includes(currentRole)) return true;
      if (user?.roles && user.roles.length > 0) {
        const moduleKey = matchingNavItem.label;
        let subLabel = null;
        if (matchingNavItem.subItems) {
           const subItem = matchingNavItem.subItems.find(sub => path.startsWith(sub.path));
           if (subItem) subLabel = subItem.label;
        }
        return userHasPermission(user, moduleKey, 'Read', subLabel);
      }
      return false;
    }

    return true;
  };

  if (!isAllowed()) {
    console.warn('Access Denied:', { path, currentRole });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const { t, setLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.getItem('theme') === 'dark') return true;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme')) return true;
    return false;
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setCurrentRole(null);
      setBranches([]);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('tenant:updated', fetchTenantSettings);

    const cachedBranding = localStorage.getItem('tenantBranding');
    if (cachedBranding) {
      try {
        const { brandColor, accentColor, name } = JSON.parse(cachedBranding);
        applyBrandColors(brandColor, accentColor);
        if (name) document.title = name;
      } catch (e) {
        console.warn('Failed to parse cached branding');
      }
    }

    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        setCurrentRole(parsedUser.role || parsedUser.roles?.[0]?.name?.toUpperCase().replace(/ /g, '_'));
        fetchBranches();
        fetchTenantSettings();
        api.get('/settings').then(({ data }) => {
          if (data?.localization?.language) setLanguage(data.localization.language);
        }).catch(() => {});
      } catch (e) {
        localStorage.removeItem('userInfo');
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('tenant:updated', fetchTenantSettings);
    };
  }, []);

  const fetchTenantSettings = async () => {
    try {
      const { data } = await api.get('/tenants/me');
      const brandColor = data?.settings?.brandColor || getDefaultColors().brandColor;
      const accentColor = data?.settings?.accentColor || getDefaultColors().accentColor;

      localStorage.setItem('tenantBranding', JSON.stringify({
        brandColor,
        accentColor,
        name: data?.name,
        systemSubtitle: data?.systemSubtitle,
        logo: data?.logo
      }));

      document.title = data?.name || 'Cumar Binu Khadhaab';

      applyBrandColors(brandColor, accentColor);
    } catch (error) {
      console.error('Failed to fetch tenant settings:', error);
      const { brandColor, accentColor } = getDefaultColors();
      applyBrandColors(brandColor, accentColor);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/branches');
      setBranches(data.branches || data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
    setCurrentRole(userData.role || userData.roles?.[0]?.name?.toUpperCase().replace(/ /g, '_'));
    fetchBranches();
    fetchTenantSettings();
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('tenantBranding');
    setUser(null);
    setCurrentRole(null);
    setBranches([]);

    const { brandColor, accentColor } = getDefaultColors();
    applyBrandColors(brandColor, accentColor);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
          <Sidebar
            user={user}
            userRole={currentRole}
            isMobileOpen={isSidebarOpen}
            setIsMobileOpen={setIsSidebarOpen}
            onNavigate={(path) => {
              window.location.hash = path;
            }}
            onLogout={handleLogout}
          />

          <div className="flex flex-col flex-1 min-w-0">
            <Navbar
              user={user}
              currentRole={currentRole}
              onMenuClick={() => setIsSidebarOpen(true)}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              onLogout={handleLogout}
            />

            <main className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
              <RoleGuard currentRole={currentRole} user={user}>
                <Routes>
                  <Route path="/" element={<DashboardOverview />} />

                  {/* Academic Management */}
                  <Route path="/academic/classes" element={<ClassesManagement />} />
                  <Route path="/academic/teachers" element={<TeachersManagement />} />
                  <Route path="/academic/students" element={<StudentsManagement />} />
                  <Route path="/academic/promotion" element={<ClassPromotion />} />

                  {/* Attendance & Reports Management */}
                  <Route path="/attendance/students" element={<StudentAttendanceManagement />} />
                  <Route path="/reports/payments" element={<FeePaymentReport />} />
                  <Route path="/reports/attendance" element={<StudentAttendanceReport />} />
                  <Route path="/reports/responsibility" element={<GuardianPaymentReport />} />
                  <Route path="/reports/category-summary" element={<CashbookCategoryReport />} />
                  <Route path="/reports/payment-report" element={<CashbookPaymentReport />} />
                  <Route path="/attendance/teachers" element={<TeacherAttendanceManagement />} />

                  {/* Examinations */}
                  <Route path="/exams" element={<ExamsManagement />} />
                  <Route path="/exams/marks" element={<ExamMarks />} />
                  <Route path="/exams/results" element={<ExamResults />} />

                  {/* Finance Management */}
                  <Route path="/finance/cashbook" element={<CashbookManagement />} />
                  <Route path="/finance/payers" element={<PayersManagement />} />
                  <Route path="/finance/payments" element={<Navigate to="/finance/cashbook" replace />} />
                  <Route path="/finance/salaries" element={<SalariesManagement />} />
                  <Route path="/finance/expenses" element={<ExpensesManagement />} />
                  <Route path="/finance/transactions" element={<TransactionsManagement />} />
                  <Route path="/finance/wallets" element={<WalletsManagement />} />

                  {/* Structure */}
                  <Route path="/structure/branches" element={<BranchesManagement />} />

                  {/* Access & Users */}
                  <Route path="/access/users" element={<UsersList />} />
                  <Route path="/access/roles" element={<RolesPermissions />} />
                  <Route path="/access/logs" element={<ActivityLogs />} />
                  <Route path="/settings/profile" element={<BusinessProfile />} />
                  <Route path="/settings/preferences" element={<SystemPreferences />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </RoleGuard>
            </main>

            <footer className="py-4 px-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-xs text-center">
              &copy; {new Date().getFullYear()} {t('instituteManagement')}
            </footer>
          </div>
        </div>
      )}
    </Router>
  );
};

export default App;
