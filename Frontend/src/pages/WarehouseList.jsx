import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Users, Plus, Search, Filter, 
  MoreVertical, ChevronRight, Store, Phone, Shield, 
  Activity, ArrowUpRight, ArrowRight, Download, FileText,
  Building, User, Hash, Boxes, Trash2, Edit2, X,
  UserPlus, Mail, Lock, ChevronDown, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const WarehouseList = () => {
  const { showAlert, showConfirm } = useAlert();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [managers, setManagers] = useState([]);
  const [showNewManagerForm, setShowNewManagerForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    managerId: '',
    manager: '',
    phone: '',
    capacity: 100,
    newManager: {
      username: '',
      email: '',
      password: '',
      phone: ''
    }
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/warehouses');
      setWarehouses(data.warehouses || data);
    } catch (error) {
      console.error("Failed to fetch warehouses", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data } = await api.get('/users');
      setManagers(data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchWarehouses();
    fetchManagers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        address: { street: formData.address },
        contact: { phone: formData.phone },
        capacity: Number(formData.capacity)
      };

      const isCreatingNew = showNewManagerForm && formData.newManager.username && formData.newManager.email && formData.newManager.password;

      if (isCreatingNew) {
        payload.manager = formData.newManager.username;
        payload.newManager = formData.newManager;
      } else if (formData.managerId) {
        payload.managerId = formData.managerId;
        payload.manager = formData.manager;
      }

      await api.post('/warehouses', payload);
      setShowAddModal(false);
      setShowNewManagerForm(false);
      fetchWarehouses();
      fetchManagers();
      setFormData({ name: '', code: '', address: '', managerId: '', manager: '', phone: '', capacity: 100, newManager: { username: '', email: '', password: '', phone: '' } });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to create warehouse.',
        buttonText: 'Try again'
      });
    }
  };

  const handleSelectManager = (e) => {
    const selectedUser = managers.find(u => u._id === e.target.value);
    if (selectedUser) {
      setFormData({
        ...formData,
        managerId: e.target.value,
        manager: selectedUser.username,
        newManager: { username: '', email: '', password: '', phone: '' }
      });
      setShowNewManagerForm(false);
    } else {
      setFormData({ ...formData, managerId: '', manager: '' });
    }
  };

  const handleToggleNewManager = () => {
    if (showNewManagerForm) {
      setShowNewManagerForm(false);
      setFormData({ ...formData, newManager: { username: '', email: '', password: '', phone: '' } });
    } else {
      setShowNewManagerForm(true);
      setFormData({ ...formData, managerId: '', manager: '' });
    }
  };

  const handleDeleteWarehouse = async (warehouse) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete branch?',
      message: `Delete ${warehouse.name}? This is allowed only when the branch has no related operational data.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!ok) return;

    try {
      await api.delete(`/warehouses/${warehouse._id}`);
      setWarehouses(prev => prev.filter(w => w._id !== warehouse._id));
      showAlert({
        type: 'success',
        title: 'Deleted',
        message: 'Branch deleted successfully.',
        buttonText: 'Continue'
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Cannot delete branch',
        message: error.response?.data?.message || 'This branch still has related data.',
        buttonText: 'OK'
      });
    }
  };

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-brand-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl border border-slate-700 ring-8 ring-brand-500/5 transition-transform hover:rotate-3">
            <Building2 size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Warehouse Network</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
              <Activity size={14} /> Global Node Infrastructure & Logistics Hubs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
             <Download size={18} className="text-brand-500" /> Export Registry
           </button>
           <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-700 hover:shadow-2xl hover:shadow-brand-600/30 transition-all active:scale-95 shadow-xl shadow-brand-500/20"
           >
            <Plus size={20} strokeWidth={3} /> Register New Node
           </button>
        </div>
      </div>

      {/* Control Center */}
      <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative group w-full md:w-1/3">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search by warehouse name, code or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-3xl font-bold text-slate-900 dark:text-white outline-none shadow-sm transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
               <button className="px-6 py-2.5 bg-white dark:bg-slate-700 text-brand-600 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Active Nodes</button>
               <button className="px-6 py-2.5 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all">Decommissioned</button>
            </div>
            <button className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-2xl hover:text-brand-600 transition-all shadow-sm">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-7">Warehouse Node</th>
                <th className="px-10 py-7">Address & Logistics</th>
                <th className="px-10 py-7 text-center">Products Count</th>
                <th className="px-10 py-7">Operational Head</th>
                <th className="px-10 py-7 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="px-10 py-20 text-center text-slate-400 italic font-black uppercase tracking-widest text-[10px]">Synchronizing Multi-Node Data...</td></tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr><td colSpan="5" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No active warehouses found in registry.</td></tr>
              ) : filteredWarehouses.map((w) => (
                <tr key={w._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:rotate-3 transition-all duration-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <Store size={22} />
                       </div>
                       <div>
                          <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{w.name}</div>
                          <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">ID: {w.code || 'W-' + w._id.substring(18).toUpperCase()}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <MapPin size={14} className="text-brand-500" />
                          {w.address?.street || 'No Street Address'}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          <Phone size={12} className="opacity-40" />
                          {w.contact?.phone || 'No Contact'}
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                     <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-xs tabular-nums border border-slate-200 dark:border-slate-700">
                        {w.productsCount || 0}
                     </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-brand-500/10 text-brand-600 rounded-lg flex items-center justify-center font-black text-[10px]">
                          {w.managerId?.username?.substring(0, 1) || 'U'}
                       </div>
                       <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {w.managerId?.username || w.manager || 'Unassigned'}
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link 
                        to={`/warehouses/settings?id=${w._id}`}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-brand-600 rounded-xl transition-all"
                       >
                          <Edit2 size={16} />
                       </Link>
                       <button
                        onClick={() => handleDeleteWarehouse(w)}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal: Warehouse Registration */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 z-10">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-brand-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-brand-500/20"><Building size={30} /></div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Register Node</h2>
                       <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">Initialize New Logistics Center</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowAddModal(false); setShowNewManagerForm(false); }} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                 {/* Row 1: Name + Code */}
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Warehouse Name</label>
                       <input 
                         required type="text" placeholder="e.g. North Zone Hub"
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner dark:text-white"
                         value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Node Code</label>
                       <div className="relative">
                          <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                           required type="text" placeholder="NZ-001"
                           className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner dark:text-white"
                           value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Row 2: Address */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Physical Address</label>
                    <div className="relative">
                       <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                        required type="text" placeholder="Street, City, Building Info..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner dark:text-white"
                        value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                       />
                    </div>
                 </div>

                 {/* Row 3: Manager Select + [+] Button */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Manager</label>
                    <div className="flex items-center gap-3">
                       <div className="relative flex-1">
                          <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <select 
                           className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-500/10 shadow-inner dark:text-white"
                           value={formData.managerId} 
                           onChange={handleSelectManager}
                           disabled={showNewManagerForm}
                          >
                             <option value="">Select existing user...</option>
                             {managers.map(m => <option key={m._id} value={m._id}>{m.username} ({m.email})</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>

                       {/* [+] Create New User Button */}
                       <button
                         type="button"
                         onClick={handleToggleNewManager}
                         className={`p-4 rounded-2xl transition-all active:scale-95 shadow-sm border flex items-center justify-center flex-shrink-0 ${
                           showNewManagerForm 
                             ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 hover:bg-rose-100' 
                             : 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30 text-brand-600 hover:bg-brand-100'
                         }`}
                         title={showNewManagerForm ? 'Cancel new user' : 'Create new user'}
                       >
                         {showNewManagerForm ? <X size={20} strokeWidth={3} /> : <UserPlus size={20} strokeWidth={2.5} />}
                       </button>
                    </div>
                 </div>

                 {/* Inline New Manager Form */}
                 {showNewManagerForm && (
                   <div className="animate-in slide-in-from-top-4 duration-300 bg-brand-50/30 dark:bg-brand-900/10 rounded-[28px] border border-brand-200/50 dark:border-brand-500/20 p-8 space-y-6">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                         <UserPlus size={20} />
                       </div>
                       <div>
                         <h4 className="text-sm font-black dark:text-white">Create New Manager Account</h4>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">This user will be created alongside the warehouse</p>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name *</label>
                         <div className="relative group">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                           <input
                             type="text" placeholder="e.g. Sarah Smith"
                             className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                             value={formData.newManager.username}
                             onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, username: e.target.value } })}
                           />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address *</label>
                         <div className="relative group">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                           <input
                             type="email" placeholder="sarah@company.com"
                             className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                             value={formData.newManager.email}
                             onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, email: e.target.value } })}
                           />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password *</label>
                         <div className="relative group">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                           <input
                             type="password" placeholder="••••••••"
                             className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                             value={formData.newManager.password}
                             onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, password: e.target.value } })}
                           />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone (Optional)</label>
                         <div className="relative group">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                           <input
                             type="tel" placeholder="+252 61..."
                             className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                             value={formData.newManager.phone}
                             onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, phone: e.target.value } })}
                           />
                         </div>
                       </div>
                     </div>

                     {formData.newManager.username && formData.newManager.email && formData.newManager.password && (
                       <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 animate-in fade-in duration-300">
                         <CheckCircle2 size={18} className="text-emerald-600" />
                         <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                           <span className="font-black">{formData.newManager.username}</span> will be created as the manager when you submit.
                         </p>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Row 4: Phone */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Phone</label>
                    <div className="relative">
                       <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                        required type="tel" placeholder="+252 61..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner dark:text-white"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                 </div>

                 {/* Submit */}
                 <div className="pt-4">
                    <button type="submit" className="w-full py-6 bg-brand-600 hover:bg-brand-700 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/30 transition-all active:scale-95">
                        Initialize Node Deployment
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseList;
