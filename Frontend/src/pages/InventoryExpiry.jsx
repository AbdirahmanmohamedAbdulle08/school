import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, Clock, Search, Calendar, MapPin, Package, RefreshCw, 
  Filter, CheckCircle2, XCircle, AlertTriangle, Download, Building2, 
  ChevronRight, ArrowRight, Boxes, ChevronLeft, FileDown, ShieldCheck
} from 'lucide-react';
import api from '../services/api';

const InventoryExpiry = () => {
  const [expiryData, setExpiryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [daysFilter, setDaysFilter] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchExpiryData = async () => {
    try {
      setLoading(true);
      // Fetch real batch-level data from BinStock (has actual expiryDate per batch)
      const { data } = await api.get('/binstock?expiryOnly=true&limit=1000');
      
      const today = new Date();
      const items = (Array.isArray(data) ? data : []).map(bs => {
        const expiry = bs.expiryDate ? new Date(bs.expiryDate) : null;
        const diffDays = expiry ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : null;

        return {
          _id: bs._id,
          product: bs.productId?.name || bs.productName || 'Unknown Product',
          sku: bs.productId?.sku || bs.sku || '',
          batch: bs.batchNumber || '-',
          expiryDate: bs.expiryDate,
          daysRemaining: diffDays,
          quantity: bs.quantity,
          bin: bs.locationId?.name || 'Unknown Bin',
          warehouse: bs.warehouseId?.name || 'Main Warehouse'
        };
      }).filter(i => i.daysRemaining !== null); // Only show items with expiry dates

      setExpiryData(items);
    } catch (error) {
      console.error('Failed to fetch expiry data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const getUrgencyStyle = (days) => {
    if (days < 0) return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200';
    if (days <= 30) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200';
    if (days <= 90) return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border-sky-200';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200';
  };

  const filteredItems = expiryData.filter(item => {
    const matchesSearch = item.product?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.batch?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (daysFilter === 'All') return matchesSearch;
    const days = parseInt(daysFilter);
    return matchesSearch && item.daysRemaining <= days;
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-rose-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl border border-slate-700 ring-8 ring-rose-500/5 transition-transform hover:rotate-3">
            <ShieldAlert size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Expiry Alerts</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
              <Clock size={14} /> Batch Lifecycle & Shelf-life Monitoring
            </p>
          </div>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
           <FileDown size={18} className="text-rose-500" /> Export Risk Report
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         <div className="bg-rose-600 p-8 rounded-[40px] text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><XCircle size={120} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Expired Batches</p>
            <h4 className="text-4xl font-black mt-2 tabular-nums">{expiryData.filter(i => i.daysRemaining < 0).length}</h4>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase bg-white/10 w-fit px-3 py-1 rounded-full">Immediate Action Required</div>
         </div>
         <div className="bg-amber-500 p-8 rounded-[40px] text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><AlertTriangle size={120} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Expiring in 30 Days</p>
            <h4 className="text-4xl font-black mt-2 tabular-nums">{expiryData.filter(i => i.daysRemaining >= 0 && i.daysRemaining <= 30).length}</h4>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase bg-white/10 w-fit px-3 py-1 rounded-full">Critical Monitoring</div>
         </div>
         <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Safe Batches</p>
            <h4 className="text-4xl font-black mt-2 tabular-nums">{expiryData.filter(i => i.daysRemaining > 90).length}</h4>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase bg-white/10 w-fit px-3 py-1 rounded-full">Optimal Shelf-life</div>
         </div>
      </div>

      {/* Control Center */}
      <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative group w-full md:w-1/3">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search product or batch ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-rose-500/20 rounded-3xl font-bold text-slate-900 dark:text-white outline-none shadow-sm transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Time Horizon:</span>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                {['All', '30', '90'].map(d => (
                   <button 
                    key={d} 
                    onClick={() => setDaysFilter(d)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${daysFilter === d ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                    {d === 'All' ? 'All' : `< ${d} Days`}
                   </button>
                ))}
             </div>
          </div>
        </div>

        {/* Table: Product, Batch, Expiry Date, Days Remaining, Warehouse */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-7">Product</th>
                <th className="px-10 py-7">Batch ID</th>
                <th className="px-6 py-7 text-center">Qty</th>
                <th className="px-10 py-7">Bin</th>
                <th className="px-10 py-7">Expiry Date</th>
                <th className="px-10 py-7 text-center">Days Remaining</th>
                <th className="px-10 py-7">Warehouse</th>
                <th className="px-10 py-7 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="px-10 py-20 text-center text-slate-400 italic font-black uppercase tracking-widest text-[10px]">Analyzing Batch Health...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="8" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No high-risk batches detected.</td></tr>
              ) : currentItems.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-rose-600 transition-colors">
                          <Package size={18} />
                       </div>
                       <div>
                         <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{item.product}</div>
                         <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sku}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700">{item.batch}</span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="font-black text-slate-900 dark:text-white text-sm">{item.quantity ?? '-'}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px]">
                      <MapPin size={12} className="opacity-40" />{item.bin}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                       <Calendar size={14} className="text-slate-400" />
                       {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 tabular-nums shadow-sm ${getUrgencyStyle(item.daysRemaining)}`}>
                       {item.daysRemaining < 0 ? 'Expired' : `${item.daysRemaining} Days`}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-tight">
                       <Building2 size={14} className="opacity-40" />
                       {item.warehouse}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                     <button className="px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm">Dispose / Move</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 flex items-center justify-between">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {currentItems.length} of {filteredItems.length} Batches with Expiry Dates</div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 disabled:opacity-30 hover:text-brand-600 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 disabled:opacity-30 hover:text-brand-600 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryExpiry;
