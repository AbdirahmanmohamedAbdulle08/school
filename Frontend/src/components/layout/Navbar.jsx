import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, User, Settings, LogOut, Key, Moon, Sun, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

const Navbar = ({
  user,
  currentRole,
  onMenuClick,
  isDarkMode,
  toggleDarkMode,
  onLogout
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'INSTITUTE_ADMIN': return 'Institute Admin';
      case 'BRANCH_MANAGER': return 'Branch Manager';
      case 'TEACHER': return 'Teacher';
      case 'ACCOUNTANT': return 'Accountant';
      default: return role;
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const notifications = [
    { title: 'Low stock alert', detail: 'Several products are below minimum stock.', time: 'Now', tone: 'bg-amber-500' },
    { title: 'Receiving updated', detail: 'Latest receiving quantities are available.', time: '12m', tone: 'bg-emerald-500' },
    { title: 'Dispatch queue', detail: 'Pending dispatches need review today.', time: '1h', tone: 'bg-blue-500' },
  ];

  const goTo = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
    setActiveModal(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-white/70 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 px-4 md:px-8 shadow-sm shadow-slate-900/5 backdrop-blur-2xl transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400"
          aria-label={t('openMenu')}
        >
          <Menu size={24} />
        </button>

        <div className="hidden sm:flex items-center bg-slate-50/90 dark:bg-slate-900 rounded-2xl px-4 py-2.5 gap-3 border border-slate-200/80 dark:border-slate-800 w-56 md:w-96 focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-400 transition-all shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder={t('search')}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 dark:text-slate-200 p-0 shadow-none focus:ring-0"
          />
          <span className="hidden md:inline-flex rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-800">Ctrl + K</span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => goTo('/settings/preferences')}
          className="hidden sm:flex p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors border border-slate-200/70 dark:border-slate-800"
          aria-label={t('settings')}
        >
          <SlidersHorizontal size={19} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors border border-slate-200/70 dark:border-slate-800"
          aria-label={t('toggleDarkMode')}
        >
          {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(prev => !prev)}
            className="relative p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors border border-slate-200/70 dark:border-slate-800"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-3 w-3 rounded-full bg-rose-500 text-[8px] ring-2 ring-white dark:ring-slate-950"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Notifications</p>
                  <p className="text-xs font-semibold text-slate-400">{notifications.length} active updates</p>
                </div>
                <button onClick={() => setIsNotificationsOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {notifications.map(item => (
                  <button key={item.title} onClick={() => goTo('/')} className="flex w-full gap-3 rounded-2xl p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{item.detail}</span>
                      <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">{item.time}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button onClick={() => goTo('/settings/alerts')} className="w-full border-t border-slate-100 px-4 py-3 text-sm font-black text-brand-600 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                Open Alerts Center
              </button>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-2xl transition-all border border-slate-200/70 dark:border-slate-800"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {user.username || user.name || 'User'}
              </p>
              <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-tight">
                {getRoleLabel(currentRole)}
              </p>
            </div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 via-blue-500 to-violet-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20 ring-2 ring-white dark:ring-slate-800">
              {(user.username || user.name || 'U').charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-tight mb-1">Signed in as</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.username || user.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>

              <div className="py-1">
                <button onClick={() => goTo('/settings/profile')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                  <User size={16} className="text-slate-400 dark:text-slate-500" /> Profile
                </button>
                <button onClick={() => { setActiveModal('password'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                  <Key size={16} className="text-slate-400 dark:text-slate-500" /> Change Password
                </button>
                <button onClick={() => goTo('/settings/preferences')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                  <Settings size={16} className="text-slate-400 dark:text-slate-500" /> {t('settings')}
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-900/20 flex items-center gap-2 transition-colors font-medium">
                  <LogOut size={16} /> {t('logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Change Password</h2>
                <p className="text-sm font-medium text-slate-500">Update your account password.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setActiveModal(null);
              }}
            >
              <input type="password" placeholder="Current password" className="w-full" required />
              <input type="password" placeholder="New password" className="w-full" required />
              <input type="password" placeholder="Confirm new password" className="w-full" required />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" className="premium-button premium-button-primary">Save Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
