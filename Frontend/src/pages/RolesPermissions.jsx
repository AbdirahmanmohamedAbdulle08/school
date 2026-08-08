import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Copy,
  Ban,
  CheckCircle2,
  X,
  ArrowRight,
  Users,
  Calendar,
  Shield,
  RefreshCw,
  Command,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import api from '../services/api';
import { NAV_CONFIG } from '../constants';
import { useAlert } from '../components/common/alerts/useAlert';
import { PERMISSION_ACTIONS, normalizePermissions } from '../utils/permissionUtils';

const NON_PERMISSION_MODULES = ['Settings', 'Users & Access'];

const GENERATED_HIERARCHY = NAV_CONFIG.reduce((acc, item) => {
  if (item.subItems && item.subItems.length > 0) {
    acc[item.label] = item.subItems.reduce((subAcc, sub) => {
      subAcc[sub.label] = PERMISSION_ACTIONS;
      return subAcc;
    }, {});
  } else {
    acc[item.label] = {
      [item.label]: PERMISSION_ACTIONS
    };
  }
  return acc;
}, {});

const PERMISSION_HIERARCHY = GENERATED_HIERARCHY;

const INITIAL_PERMISSIONS = Object.keys(PERMISSION_HIERARCHY).reduce((acc, module) => {
  acc[module] = Object.keys(PERMISSION_HIERARCHY[module]).reduce((subAcc, sub) => {
    subAcc[sub] = PERMISSION_HIERARCHY[module][sub].reduce((actAcc, act) => {
      actAcc[act] = false;
      return actAcc;
    }, {});
    return subAcc;
  }, {});
  return acc;
}, {});

const mergePermissions = (existing) => normalizePermissions(existing, INITIAL_PERMISSIONS);

const RolesPermissions = () => {
  const { showAlert, showConfirm } = useAlert();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState(['Sales']);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: INITIAL_PERMISSIONS
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/roles');
      setRoles(data);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const toggleMenu = (id) => {
    setActiveMenuId(prev => (prev === id ? null : id));
  };

  const toggleExpanded = (module) => {
    setExpandedModules(prev => prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]);
  };

  const handleEdit = (role) => {
    setActiveRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: mergePermissions(role.permissions)
    });
    setIsEditMode(true);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleClone = (role) => {
    setFormData({
      name: `${role.name} (Copy)`,
      description: role.description,
      permissions: mergePermissions(role.permissions)
    });
    setActiveRole(null);
    setIsEditMode(true);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handlePermissionToggle = (module, sub, action) => {
    setFormData(prev => {
      const currentPerms = prev.permissions[module]?.[sub] || {};
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: {
            ...prev.permissions[module],
            [sub]: {
              ...currentPerms,
              [action]: !currentPerms[action]
            }
          }
        }
      };
    });
  };

  const handleToggleSubModule = (module, sub) => {
    setFormData(prev => {
      const currentActions = prev.permissions[module]?.[sub] || {};
      const allSelected = Object.values(currentActions).every(val => val === true) && Object.keys(currentActions).length > 0;
      const newActions = PERMISSION_HIERARCHY[module][sub].reduce((acc, action) => {
        acc[action] = !allSelected;
        return acc;
      }, {});
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: {
            ...prev.permissions[module],
            [sub]: newActions
          }
        }
      };
    });
  };

  const handleToggleModule = (module) => {
    setFormData(prev => {
      const modulePerms = prev.permissions[module] || {};
      // Check if EVERYTHING in this module is selected
      const allSelected = Object.keys(PERMISSION_HIERARCHY[module]).every(sub =>
        PERMISSION_HIERARCHY[module][sub].every(action => (modulePerms[sub] || {})[action] === true)
      );

      const newModulePerms = Object.keys(PERMISSION_HIERARCHY[module]).reduce((acc, sub) => {
        acc[sub] = PERMISSION_HIERARCHY[module][sub].reduce((subAcc, action) => {
          subAcc[action] = !allSelected;
          return subAcc;
        }, {});
        return acc;
      }, {});

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: newModulePerms
        }
      };
    });
  };

  const handleToggleGlobal = () => {
    setFormData(prev => {
      const allSelected = Object.values(prev.permissions).every(module =>
        Object.values(module).every(sub =>
          Object.values(sub).every(action => action === true)
        )
      );

      const newPermissions = Object.keys(prev.permissions).reduce((acc, module) => {
        acc[module] = Object.keys(prev.permissions[module]).reduce((subAcc, sub) => {
          subAcc[sub] = Object.keys(prev.permissions[module][sub]).reduce((actAcc, action) => {
            actAcc[action] = !allSelected;
            return actAcc;
          }, {});
          return subAcc;
        }, {});
        return acc;
      }, {});

      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      permissions: normalizePermissions(formData.permissions, INITIAL_PERMISSIONS)
    };
    try {
      if (activeRole) {
        await api.put(`/roles/${activeRole._id}`, payload);
      } else {
        await api.post('/roles', payload);
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setFormData({ name: '', description: '', permissions: INITIAL_PERMISSIONS });
      setActiveRole(null);
      fetchRoles();
    } catch (error) {
      console.error("Failed to save role", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to save role.',
        buttonText: 'Try again'
      });
    }
  };

  const handleDelete = async (role) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete role?',
      message: `Are you sure you want to delete ${role.name}? This cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    try {
      await api.delete(`/roles/${role._id}`);
      fetchRoles();
    } catch (error) {
      console.error("Failed to delete role", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to delete role.',
        buttonText: 'Try again'
      });
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Access Roles</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Security Tiers & Hierarchical Permission Orchestration</p>
          </div>
        </div>
        <button
          onClick={() => { setActiveRole(null); setFormData({ name: '', description: '', permissions: INITIAL_PERMISSIONS }); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all active:scale-95 group border border-slate-700"
        >
          <Plus size={18} strokeWidth={3} /> Define New Role
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/20">
          <div className="relative group w-full md:w-[450px]">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="Search roles..."
              className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-semibold outline-none focus:ring-8 focus:ring-brand-500/5 transition-all dark:text-white shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={fetchRoles} className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-600 dark:text-brand-400 tracking-widest hover:gap-3 transition-all">
            <RefreshCw size={14} /> Refresh Registry
          </button>
        </div>

        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Role Name</th>
                <th className="px-10 py-6">Description</th>
                <th className="px-10 py-6 text-center">Users Count</th>
                <th className="px-10 py-6">Created Date</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map((role) => (
                <tr key={role._id || role.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black text-lg border border-brand-100 dark:border-brand-800 group-hover:scale-110 transition-transform">
                        <Shield size={20} />
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{role.description}</p>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-black dark:text-white tabular-nums">
                      {role.usersCount || 0} <Users size={14} className="text-slate-400" />
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Calendar size={14} className="text-brand-400" />
                      {new Date(role.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit flex items-center gap-2 border shadow-sm ${!role.isSystemRole ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${!role.isSystemRole ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                      {role.isSystemRole ? 'System' : 'Custom'}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right relative overflow-visible">
                    <div className="flex justify-end items-center gap-3">
                      <button
                        onClick={() => toggleMenu(role._id || role.id)}
                        className={`p-3.5 rounded-2xl transition-all duration-500 active:scale-90 shadow-lg border-2 ${activeMenuId === (role._id || role.id)
                          ? 'bg-slate-900 border-slate-700 text-white rotate-90 scale-110'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-brand-600'
                          }`}
                      >
                        <MoreVertical size={20} strokeWidth={3} />
                      </button>

                      {activeMenuId === (role._id || role.id) && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute bottom-0 right-24 w-72 bg-white dark:bg-slate-900 rounded-[44px] shadow-[0_48px_128px_-12px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 text-left">
                            <div className="p-6 mb-3 bg-slate-50 dark:bg-slate-800/80 rounded-[32px] border border-slate-100 dark:border-slate-800/50">
                              <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mb-2 flex items-center gap-3">
                                <Command size={14} strokeWidth={3} /> Role Hub
                              </p>
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{role.name}</p>
                            </div>
                            <div className="space-y-1 p-1">
                              {[
                                {
                                  icon: <Edit2 size={16} />,
                                  label: 'Edit Role',
                                  color: role.name === 'Owner' ? 'text-slate-300' : 'text-brand-600',
                                  action: role.name === 'Owner' ? null : () => handleEdit(role)
                                },
                                { icon: <Copy size={16} />, label: 'Clone Role', color: 'text-emerald-600', action: () => handleClone(role) },
                                { separator: true },
                                {
                                  icon: <Trash2 size={16} />,
                                  label: 'Delete Role',
                                  color: role.isRequired ? 'text-slate-300' : 'text-rose-500',
                                  action: role.isRequired ? null : () => handleDelete(role)
                                },
                              ].map((item, idx) => (
                                item.separator ? (
                                  <div key={idx} className="h-px bg-slate-50 dark:bg-slate-800 mx-4 my-2" />
                                ) : (
                                  <button
                                    key={idx}
                                    disabled={!item.action}
                                    onClick={() => { if (item.action) item.action(); setActiveMenuId(null); }}
                                    className={`w-full flex items-center justify-between px-5 py-3 rounded-[20px] transition-all group/item active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800 ${!item.action ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <div className={`flex items-center gap-4 ${item.color}`}>
                                      <div className="group-hover/item:scale-110 transition-transform shrink-0">{item.icon}</div>
                                      <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.label}</span>
                                    </div>
                                  </button>
                                )
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[56px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 my-auto">
            <div className="px-12 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-600/30">
                  {activeRole ? <Edit2 size={32} /> : <ShieldCheck size={32} strokeWidth={2.5} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                    {activeRole ? 'Modify Access Tier' : 'Define Access Tier'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">Configure system-wide role parameters and hierarchical permission matrix.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-12 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Role Identifier Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Regional Compliance Lead"
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner transition-all placeholder:text-slate-400/50"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Functional Description</label>
                  <input
                    required
                    type="text"
                    placeholder="Describe the scope of authority..."
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-sm font-medium dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner transition-all placeholder:text-slate-400/50"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-lg font-black dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Shield size={20} className="text-brand-500" /> Hierarchical Matrix
                  </h4>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleToggleGlobal}
                      className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                    >
                      Toggle All System Access
                    </button>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline-block">Toggle granular sub-module capabilities</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.keys(PERMISSION_HIERARCHY).map((module) => {
                    const isExpanded = expandedModules.includes(module);
                    return (
                      <div key={module} className="bg-slate-50 dark:bg-slate-800/40 rounded-[32px] border border-slate-100 dark:border-slate-800/50 overflow-hidden transition-all duration-500">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(module)}
                          className="w-full flex items-center justify-between p-6 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg">
                              <Command size={18} />
                            </div>
                            <span className="text-sm font-black dark:text-white uppercase tracking-widest">{module}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggleModule(module)}
                                className="px-3 py-1.5 bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:text-brand-500 dark:hover:text-brand-400 transition-colors border border-slate-200 dark:border-slate-700"
                              >
                                Select Section
                              </button>
                            </div>
                            {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-6 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            {Object.keys(PERMISSION_HIERARCHY[module]).map((sub) => (
                              <div key={sub} className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                                <div className="md:w-64 flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => handleToggleSubModule(module, sub)} title="Toggle all actions for this feature">
                                  <div className={`w-1.5 h-1.5 rounded-full ${Object.values(formData.permissions[module][sub]).every(x => x) ? 'bg-brand-500' : 'bg-slate-300'}`} />
                                  <span className="text-[11px] font-black dark:text-slate-200 uppercase tracking-tight hover:text-brand-600 transition-colors">{sub}</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {PERMISSION_HIERARCHY[module][sub].map((action) => (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={() => handlePermissionToggle(module, sub, action)}
                                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${formData.permissions[module] && formData.permissions[module][sub] && formData.permissions[module][sub][action]
                                        ? 'bg-brand-600 border-brand-600 text-white shadow-lg'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-brand-400'
                                        }`}
                                    >
                                      {formData.permissions[module] && formData.permissions[module][sub] && formData.permissions[module][sub][action] && <Check size={12} strokeWidth={4} />}
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-12 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-[32px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 w-full px-12 py-5 bg-brand-600 text-white rounded-[32px] text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-700 shadow-2xl shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center gap-4 group">
                  Commit Configuration <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
