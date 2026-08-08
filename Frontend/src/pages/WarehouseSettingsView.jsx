import React, { useState, useEffect } from 'react';
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Globe,
  Bell,
  Percent,
  Clock,
  Save,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layout,
  MapPin,
  Building,
  User,
  Activity,
  Trash2,
  AlertTriangle,
  Lock,
  Search,
  Store,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const WarehouseSettingsView = () => {
  const { showAlert } = useAlert();
  const [searchParams] = useSearchParams();
  const warehouseId = searchParams.get('id') || '1';
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [branchData, setBranchData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranchAndUsers();
  }, [warehouseId]);

  const fetchBranchAndUsers = async () => {
    try {
      setLoading(true);
      const [branchRes, usersRes] = await Promise.all([
        api.get(`/warehouses/${warehouseId}`),
        api.get('/users')
      ]);

      setBranchData(branchRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to fetch warehouse settings", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggles are now handled within branchData.services

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/warehouses/${warehouseId}`, branchData);
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Settings propagated successfully.',
        buttonText: 'Continue'
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to update settings.',
        buttonText: 'Try again'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      // Use warehouseId from search params
      await api.delete(`/warehouses/${warehouseId}`);

      setDeleteSuccess(true);
      setTimeout(() => {
        window.location.href = '/warehouses'; // Redirect to warehouse list
      }, 2000);
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Error deleting warehouse');
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Warehouse Profile', icon: <Building size={18} /> },
    { id: 'security', label: 'Staff & Security', icon: <Lock size={18} /> },
  ];

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Premium Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-slate-900 rounded-[40px] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
          <Settings size={220} strokeWidth={1} />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-brand-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-brand-600/30">
              <Store size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Warehouse Logic Control</h1>
              <p className="text-slate-400 text-sm font-medium">Fine-tuning operations for <span className="text-brand-400">{branchData?.name || 'Loading...'}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Status: Fully Synchronized</span>
            </div>
            <div className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
              <MapPin size={12} className="text-brand-400" />
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">ID: #B-{warehouseId}009X</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="relative z-10 flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-600/40 active:scale-95 group"
        >
          {isSaving ? (
            <>Deploying across nodes...</>
          ) : (
            <><Save size={18} strokeWidth={3} className="group-hover:rotate-12 transition-transform" /> Propagate Changes</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-6 py-5 rounded-[28px] text-sm font-black transition-all group ${activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30 ring-1 ring-white/20'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {tab.icon}
                </div>
                <span className="uppercase tracking-widest text-[11px]">{tab.label}</span>
              </div>
              <ChevronRight size={14} className={`transition-opacity ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}

          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Health</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[94%] bg-emerald-500 rounded-full" />
              </div>
              <span className="text-[10px] font-black text-emerald-500">94%</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Latency within Somali Region: 14ms</p>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {/* Location Identity */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <MapPin size={24} className="text-brand-600" /> Warehouse Geo-Signature
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Name</label>
                    <input
                      type="text"
                      value={branchData?.name || ''}
                      onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-brand-500/10 dark:text-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Manager</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select
                        value={branchData?.managerId || ''}
                        onChange={(e) => setBranchData({ ...branchData, managerId: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none dark:text-white appearance-none"
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.username} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GPS & Physical Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={branchData?.address?.street || ''}
                        onChange={(e) => setBranchData({ ...branchData, address: { ...branchData.address, street: e.target.value } })}
                        placeholder="Km4, Maka Al-Mukarama, Mogadishu, SO"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <Percent size={24} className="text-emerald-500" /> Localization Overrides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Warehouse-Specific Sales Tax (%)</label>
                    <input type="text" defaultValue="5.00" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-brand-500/10 dark:text-white shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Operating Timezone</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none dark:text-white appearance-none">
                        <option>(GMT+03:00) Mogadishu</option>
                        <option>(GMT+03:00) Hargeisa</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Lock size={24} className="text-rose-500" /> Access & Sovereignty
                  </h3>
                </div>

                <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-[28px] flex items-start gap-4">
                  <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={24} />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-rose-900 dark:text-rose-200 uppercase tracking-widest">Critical Override Zone</h4>
                    <p className="text-xs text-rose-700/80 dark:text-rose-400/80 leading-relaxed font-medium">
                      Adjusting staff access levels or clearing data logs at the warehouse level will impact local availability and historical auditing.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl group hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <Trash2 size={20} className="text-rose-500 group-hover:text-white" />
                      <div className="text-left">
                        <p className="text-sm font-black uppercase tracking-tight">Decommission Warehouse</p>
                        <p className="text-[10px] opacity-70 font-medium">Permanently delete this warehouse if no data is assigned.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="opacity-40 group-hover:translate-x-1 transition-all" />
                  </button>
                  <button className="w-full flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl group hover:border-brand-500/50 border border-slate-100 dark:border-slate-700/50 transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-4">
                      <Lock size={20} className="text-slate-400 group-hover:text-brand-600" />
                      <div className="text-left">
                        <p className="text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">Staff Key Re-validation</p>
                        <p className="text-[10px] text-slate-400 font-medium">Force all warehouse staff to refresh login tokens.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="opacity-40" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-6">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-[32px] flex items-center justify-center mx-auto">
                <AlertTriangle size={40} className="text-rose-600" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Deletion</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Are you absolutely sure? This action will permanently decommission the warehouse. The system will only allow this if no operational data is currently linked.
                </p>
              </div>

              {deleteError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 animate-shake">
                  <AlertTriangle size={18} />
                  <p className="text-xs font-bold leading-tight uppercase tracking-widest">{deleteError}</p>
                </div>
              )}

              {deleteSuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <Activity size={18} />
                  <p className="text-xs font-bold leading-tight uppercase tracking-widest text-center w-full">Warehouse removed. Redirecting...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteBranch}
                    disabled={isDeleting}
                    className="px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
                  >
                    {isDeleting ? 'Processing...' : 'Delete Permanently'}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseSettingsView;
