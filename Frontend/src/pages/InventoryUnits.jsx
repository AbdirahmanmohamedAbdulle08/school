import React, { useState, useEffect } from 'react';
import {
  Scale, Plus, Search, MoreVertical, Edit2, Trash2, X, CheckCircle2,
  CircleOff, ArrowRight, Filter, RefreshCw, Command, Eye, History, ShieldCheck, Download, PlusCircle
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const InventoryUnits = () => {
  const { showAlert, showConfirm } = useAlert();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    shortCode: ''
  });

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/units');
      setUnits(data);
    } catch (error) {
      console.error("Failed to fetch units", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    showAlert({
      type,
      title: type === 'error' ? 'Uh oh!' : 'Woohoo!',
      message,
      buttonText: type === 'error' ? 'Try again' : 'Continue'
    });
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setFormData({ name: '', shortCode: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      shortCode: unit.symbol || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        symbol: formData.shortCode, // Backend expects 'symbol'
        isActive: true
      };

      if (editingUnit) {
        await api.put(`/units/${editingUnit._id}`, payload);
      } else {
        await api.post('/units', payload);
      }
      setIsModalOpen(false);
      fetchUnits();
      showToast(editingUnit ? 'Unit updated successfully' : 'Unit created successfully');
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save unit", 'error');
    }
  };

  const handleDelete = async (unit) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete unit?',
      message: `Delete unit "${unit.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/units/${unit._id}`);
      fetchUnits();
      showToast('Unit deleted successfully');
    } catch (error) {
      showToast(error.response?.data?.message || error.response?.data?.error || "Failed to delete unit", 'error');
    }
  };

  const uniqueUnits = Array.from(
    units.reduce((map, unit) => {
      const key = (unit.symbol || '').trim().toLowerCase();
      if (!key) return map;
      const existing = map.get(key);
      if (!existing || (!existing.isRequired && unit.isRequired)) map.set(key, unit);
      return map;
    }, new Map()).values()
  );

  const filteredUnits = uniqueUnits.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-brand-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl border border-slate-700 ring-8 ring-slate-900/5 transition-transform hover:rotate-3">
            <Scale size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Units of Measure</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
              <Command size={14} /> Global Standards for SKU Quantization
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-brand-500/20 transition-all active:scale-95 group"
        >
          <PlusCircle size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Add Unit
        </button>
      </div>

      {/* Control Center */}
      <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative group w-full md:w-1/2">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search units (e.g. Kg, Piece, Box)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-3xl font-bold text-slate-900 dark:text-white outline-none shadow-sm transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-7">Unit Name</th>
                <th className="px-10 py-7">Short Code</th>
                <th className="px-10 py-7">Status</th>
                <th className="px-10 py-7 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="px-10 py-20 text-center text-slate-400">Loading metrics...</td></tr>
              ) : filteredUnits.length === 0 ? (
                <tr><td colSpan="4" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No units defined.</td></tr>
              ) : filteredUnits.map((unit) => (
                <tr key={unit._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center font-black shadow-inner border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                        <Scale size={20} />
                      </div>
                      <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{unit.name}</div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="px-5 py-2 bg-slate-900 text-white dark:bg-brand-600 rounded-xl font-black text-xs shadow-xl tabular-nums uppercase tracking-widest">
                       {unit.symbol}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{unit.isRequired ? 'Popular' : 'Custom'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenEdit(unit)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-brand-600 shadow-sm"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(unit)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-rose-600 shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-12">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingUnit ? 'Edit Unit' : 'New Unit'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-full shadow-sm"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-12 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" placeholder="e.g. Kilogram" />
                <p className="text-[9px] text-slate-400 font-bold uppercase italic ml-1">Popular: Piece, Box, Kilogram, Liter. You can still add custom units.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Code</label>
                <input required type="text" value={formData.shortCode} onChange={e => setFormData({...formData, shortCode: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" placeholder="e.g. Kg" />
                <p className="text-[9px] text-slate-400 font-bold uppercase italic ml-1">Example: Pc, Bx, L</p>
              </div>

              <div className="pt-10 flex justify-end gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button type="submit" className="px-14 py-5 bg-brand-600 hover:bg-brand-700 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-brand-500/30">
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryUnits;
