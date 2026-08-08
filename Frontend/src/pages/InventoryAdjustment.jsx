import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal, Plus, Search, RefreshCw, Package, AlertTriangle, ArrowRight,
  ChevronRight, Calendar, User, MapPin, MoreVertical, CheckCircle2, X, ShieldCheck,
  Box, FileText, TrendingUp, TrendingDown, Command, Eye, History, Download, Edit2,
  Trash2, PlusCircle, ArrowDownLeft, ArrowUpRight, Check, ChevronLeft, ShieldAlert,
  Info, Scale, Receipt, UserCheck, Filter, Boxes
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const InventoryAdjustment = () => {
  const { showAlert } = useAlert();
  const [view, setView] = useState('LIST');
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State exactly matching user specs
  const [formData, setFormData] = useState({
    warehouseId: '',
    product: '',
    quantity: 0,
    adjustmentType: 'Stock Increase', // or 'Stock Decrease'
    reason: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adjRes, prodRes, warehouseRes] = await Promise.all([
        api.get('/adjustments?limit=1000'),
        api.get('/products?limit=1000'),
        api.get('/warehouses')
      ]);
      setAdjustments(adjRes.data.adjustments || []);
      setProducts(prodRes.data.products || []);
      const warehouseList = warehouseRes.data.warehouses || warehouseRes.data || [];
      setWarehouses(warehouseList);
      setFormData(prev => ({
        ...prev,
        warehouseId: prev.warehouseId || warehouseList.find(w => w.is_default)?._id || warehouseList[0]?._id || ''
      }));
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const selectedProduct = products.find(p => p._id === formData.product);
      // Map to backend expectation if needed
      const payload = {
        product: formData.product,
        quantity: Number(formData.quantity),
        type: formData.adjustmentType === 'Stock Increase' ? 'Increase' : 'Decrease',
        reason: formData.reason.trim(),
        warehouseId: selectedProduct?.warehouseId || formData.warehouseId || undefined,
        date: new Date().toISOString()
      };

      await api.post('/adjustments', payload);
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Adjustment posted successfully.',
        buttonText: 'Continue'
      });
      setView('LIST');
      fetchData();
      setFormData({ warehouseId: warehouses.find(w => w.is_default)?._id || warehouses[0]?._id || '', product: '', quantity: 0, adjustmentType: 'Stock Increase', reason: '' });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || error.response?.data?.error || 'Failed to save adjustment.',
        buttonText: 'Try again'
      });
    }
  };

  const filteredAdjustments = adjustments.filter(adj => 
    adj.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-brand-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl border border-slate-700 ring-8 ring-slate-900/5 transition-transform hover:rotate-3">
            <SlidersHorizontal size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Adjustments</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
              <RefreshCw size={14} /> Stock Correction & Reconciliation Protocol
            </p>
          </div>
        </div>

        {view === 'LIST' ? (
          <button
            onClick={() => setView('CREATE')}
            className="flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-brand-500/20 transition-all active:scale-95 group"
          >
            <PlusCircle size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            New Adjustment
          </button>
        ) : (
          <button
            onClick={() => setView('LIST')}
            className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-brand-600 hover:border-brand-600 transition-all shadow-sm"
          >
            <ChevronLeft className="rotate-180 inline-block mr-2" size={16} /> Back to Dashboard
          </button>
        )}
      </div>

      {view === 'LIST' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
             <div className="relative group w-full md:w-1/3">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search adjustment logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-3xl font-bold text-slate-900 dark:text-white outline-none shadow-sm transition-all text-sm"
                />
             </div>
             <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-brand-600 shadow-sm"><Filter size={20} /></button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-10 py-7">Adjustment Date</th>
                  <th className="px-10 py-7">Product</th>
                  <th className="px-10 py-7 text-center">Type</th>
                  <th className="px-10 py-7 text-center">Quantity</th>
                  <th className="px-10 py-7">Reason</th>
                  <th className="px-10 py-7 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan="6" className="px-10 py-20 text-center text-slate-400">Loading audit trail...</td></tr>
                ) : filteredAdjustments.length === 0 ? (
                  <tr><td colSpan="6" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No adjustment records found.</td></tr>
                ) : filteredAdjustments.map((adj) => (
                  <tr key={adj._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-10 py-6 font-bold text-slate-900 dark:text-white text-xs">{new Date(adj.date).toLocaleDateString()}</td>
                    <td className="px-10 py-6">
                      <div className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xs">{adj.productName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{adj.sku}</div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${adj.type === 'Increase' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10'}`}>
                        {adj.type}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center font-black tabular-nums text-slate-900 dark:text-white">{adj.quantity}</td>
                    <td className="px-10 py-6 text-xs text-slate-500 italic font-medium">{adj.reason}</td>
                    <td className="px-10 py-6 text-right">
                       <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-brand-600 transition-all"><Eye size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-12 duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-12">
            <div className="mb-12 text-center">
              <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-[32px] flex items-center justify-center text-brand-600 mx-auto mb-6"><Plus size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Post Adjustment</h2>
              <p className="text-slate-500 font-medium italic mt-2 opacity-70 text-sm">Correct inventory levels manually with audit reasoning.</p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-10">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warehouse</label>
                <select
                  required
                  value={formData.warehouseId}
                  onChange={e => setFormData({ ...formData, warehouseId: e.target.value, product: '' })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-6 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 outline-none"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Registry</label>
                <select 
                  required 
                  value={formData.product} 
                  onChange={e => {
                    const selected = products.find(p => p._id === e.target.value);
                    setFormData({
                      ...formData,
                      product: e.target.value,
                      warehouseId: selected?.warehouseId || formData.warehouseId
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-6 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 outline-none"
                >
                  <option value="">Select SKU...</option>
                  {products
                    .filter(p => !p.warehouseId || !formData.warehouseId || p.warehouseId === formData.warehouseId)
                    .map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.quantity})</option>)}
                </select>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Older products without a warehouse can still be adjusted into the selected warehouse.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-6 font-black text-slate-900 dark:text-white text-3xl text-center focus:ring-4 focus:ring-brand-500/10 outline-none"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Type</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-inner">
                    {['Stock Increase', 'Stock Decrease'].map(t => (
                      <button 
                        key={t}
                        type="button"
                        onClick={() => setFormData({...formData, adjustmentType: t})}
                        className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${formData.adjustmentType === t ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Reason</label>
                <textarea 
                  required
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-6 font-bold text-slate-900 dark:text-white h-32 resize-none focus:ring-4 focus:ring-brand-500/10 outline-none"
                  placeholder="Damage, System Error, Expired, Found Stock..."
                />
              </div>

              <div className="pt-10 flex gap-6">
                <button type="button" onClick={() => setView('LIST')} className="flex-1 py-6 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800">Discard</button>
                <button type="submit" className="flex-[2] py-6 bg-brand-600 hover:bg-brand-700 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-brand-500/30 active:scale-[0.98]">Post Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAdjustment;
