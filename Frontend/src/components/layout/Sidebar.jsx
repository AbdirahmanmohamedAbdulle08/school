import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, LogOut, Sparkle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NAV_CONFIG } from '../../constants.jsx';
import { UserRole } from '../../types.js';
import api from '../../services/api';
import { userHasPermission } from '../../utils/permissionUtils';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

const Sidebar = ({ user, userRole, isMobileOpen, setIsMobileOpen, onNavigate, onLogout }) => {
  const { t } = useLanguage();
  const [expandedItems, setExpandedItems] = useState([]);
  const [lastExpandedItem, setLastExpandedItem] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(() => {
    const cached = localStorage.getItem('tenantBranding');
    if (cached) {
      try {
        const { logo, name, systemSubtitle } = JSON.parse(cached);
        return { name: name || '', systemSubtitle: systemSubtitle || '', logo: logo || null };
      } catch (e) {
        return { name: '', systemSubtitle: '', logo: null };
      }
    }
    return { name: '', systemSubtitle: '', logo: null };
  });
  const location = useLocation();
  const navRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const { data } = await api.get('/tenants/me');
        if (data) {
          setTenantInfo({
            name: data.name || '',
            systemSubtitle: data.systemSubtitle || '',
            logo: data.logo || null
          });
        }
      } catch (error) {
        // Fallback gracefully
      }
    };
    fetchTenantData();
  }, []);

  const hasPermission = (label, subLabel = null) => {
    const roleNormalized = typeof userRole === 'string' ? userRole.toLowerCase() : '';

    if (roleNormalized.includes('admin') ||
      roleNormalized.includes('super') ||
      roleNormalized.includes('system') ||
      roleNormalized.includes('owner') ||
      roleNormalized === (UserRole.SUPER_ADMIN || '').toLowerCase()) return true;

    if (!user?.roles || user.roles.length === 0) {
      return false;
    }

    return userHasPermission(user, label, 'Read', subLabel);
  };

  const toggleExpand = (label) => {
    setExpandedItems(prev => {
      const isExpanding = !prev.includes(label);
      if (isExpanding) {
        setLastExpandedItem(label);
      }
      return prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label];
    });
  };

  useEffect(() => {
    if (lastExpandedItem && itemRefs.current[lastExpandedItem] && navRef.current) {
      const itemElement = itemRefs.current[lastExpandedItem];
      const navElement = navRef.current;

      setTimeout(() => {
        const itemRect = itemElement.getBoundingClientRect();
        const navRect = navElement.getBoundingClientRect();

        if (itemRect.bottom > navRect.bottom - 100) {
          itemElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 50);
    }
  }, [lastExpandedItem, expandedItems]);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (item) => {
    if (isActive(item.path)) return true;
    return item.subItems?.some((sub) => isActive(sub.path));
  };

  const getFilteredNav = () => {
    return NAV_CONFIG.reduce((acc, item) => {
      const isModuleAllowed = hasPermission(item.label);
      if (!isModuleAllowed) return acc;

      if (item.subItems && item.subItems.length > 0) {
        const visibleSubItems = item.subItems.filter(sub => hasPermission(item.label, sub.label));
        if (visibleSubItems.length > 0) {
          acc.push({ ...item, subItems: visibleSubItems });
        }
      } else {
        acc.push(item);
      }

      return acc;
    }, []);
  };

  const filteredNav = getFilteredNav();
  const roleLabel = user?.roles?.[0]?.name || userRole || 'Super Admin';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#071124] text-slate-300">
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-12 h-12 bg-gradient-to-tr from-[#0B1E3F] via-[#1E7A3C] to-[#B8860B] rounded-2xl flex items-center justify-center font-black text-white shadow-xl shadow-emerald-900/30 overflow-hidden shrink-0 ring-1 ring-white/20">
          {tenantInfo.logo ? (
            <img src={tenantInfo.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">{(tenantInfo.name || 'I').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="overflow-hidden min-w-0">
          <span className="text-base font-black text-white tracking-tight block truncate" title={tenantInfo.name || 'Cumar Binu Khadhaab'}>{tenantInfo.name || 'Cumar Binu Khadhaab'}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">{tenantInfo.systemSubtitle || t('instituteManagement')}</span>
        </div>
      </div>

      <nav ref={navRef} className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar">
        {filteredNav.map((item) => {
          const isExpanded = expandedItems.includes(item.label);
          const active = isParentActive(item);

          return (
            <div key={item.label} className="space-y-1">
              <button
                ref={(el) => itemRefs.current[item.label] = el}
                onClick={() => {
                  if (item.subItems && item.subItems.length > 0) {
                    toggleExpand(item.label);
                  } else {
                    onNavigate(item.path);
                    setIsMobileOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${active
                  ? 'bg-gradient-to-r from-[#155C2E] via-[#1E7A3C] to-[#B8860B] text-white shadow-xl shadow-emerald-950/40 ring-1 ring-white/15'
                  : 'text-slate-400 hover:bg-white/7 hover:text-slate-100'
                  }`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`transition-colors duration-200 ${active ? 'text-white' : 'text-slate-500 group-hover:text-emerald-300'}`}>
                    {React.createElement(item.icon, { size: 20 })}
                  </div>
                  <span className="text-sm font-bold transition-colors duration-200">
                    {t(item.translationKey) || item.label}
                  </span>
                </div>
                {item.subItems && item.subItems.length > 0 && (
                  <div className={`transition-transform duration-200 relative z-10 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} className={active ? 'text-white' : 'text-slate-500'} />
                  </div>
                )}
              </button>

              {item.subItems && item.subItems.length > 0 && isExpanded && (
                <div className={`mt-1 space-y-1`}>
                  {item.subItems.map(sub => {
                    const subActive = isActive(sub.path);
                    return (
                      <button
                        key={sub.label}
                        onClick={() => {
                          onNavigate(sub.path);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 pl-3 rounded-xl text-xs font-bold transition-all duration-200 group ${subActive
                          ? 'bg-white/12 text-white ring-1 ring-white/10'
                          : 'text-slate-500 hover:text-slate-100 hover:bg-white/7'
                          }`}
                      >
                        <div className={`w-5 flex justify-center transition-colors ${subActive ? 'text-emerald-300' : 'text-slate-600 group-hover:text-emerald-300'}`}>
                          {React.createElement(sub.icon, { size: 16 })}
                        </div>
                        {t(sub.translationKey) || sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 bg-[#071124]/80 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/7 p-3 ring-1 ring-white/10">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E7A3C] to-[#B8860B] text-sm font-black text-white">
            {(user?.username || user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[#071124] bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{user?.username || user?.fullName || 'Admin'}</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 group">
          <div className="p-1.5 rounded-xl bg-white/7 group-hover:bg-rose-500/20 transition-colors">
            <LogOut size={18} />
          </div>
          <span className="text-sm font-bold">{t('logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-72 h-screen sticky top-0 bg-[#071124] overflow-hidden border-r border-white/10">
        <SidebarContent />
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#071124] shadow-2xl transition-transform duration-300 transform">
            <SidebarContent />
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
