import React, { useState, useEffect } from 'react';
import {
  History, Search, Filter, Calendar, MapPin, Package, User,
  ArrowUpRight, ArrowDownLeft, RefreshCw, Download, SlidersHorizontal,
  ShoppingCart, Receipt, Undo2, ArrowRightLeft, Clock, Boxes, ChevronLeft, ChevronRight, FileDown
} from 'lucide-react';
import api from '../services/api';

const InventoryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // Filters state exactly matching user specs
  const [filters, setFilters] = useState({
    date: '',
    product: '',
    warehouse: '',
    movementType: 'All'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchAuxData();
    fetchHistory();
  }, []);

  const fetchAuxData = async () => {
    try {
      const [whRes, prRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/products')
      ]);
      setWarehouses(whRes.data || []);
      setProductsList(prRes.data.products || prRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // In a real app, filters would be passed to the API
      const res = await api.get('/history?limit=1000');
      setHistory(res.data.history || []);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Purchase': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'Sale': return 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400';
      case 'Return': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      case 'Adjustment': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'Transfer': return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const filteredHistory = history.filter(log => {
    const matchesSearch = log.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.movementType === 'All' || log.type === filters.movementType;
    const matchesWarehouse = !filters.warehouse || (log.warehouseId?._id || log.warehouseId) === filters.warehouse;
    const matchesProduct = !filters.product || (log.product?._id || log.product) === filters.product;
    const matchesDate = !filters.date || new Date(log.date).toISOString().split('T')[0] === filters.date;
    
    return matchesSearch && matchesType && matchesWarehouse && matchesProduct && matchesDate;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-brand-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl border border-slate-700 ring-8 ring-slate-900/5 transition-transform hover:rotate-3">
            <History size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Stock History</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
              <RefreshCw size={14} /> Immutable Ledger of Global Inventory Movements
            </p>
          </div>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
           <FileDown size={18} className="text-brand-500" /> Export Movement Log
        </button>
      </div>

      {/* Filters: Date, Product, Warehouse, Movement Type */}
      <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product</label>
            <select value={filters.product} onChange={e => setFilters({...filters, product: e.target.value})} className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none">
              <option value="">All Products</option>
              {productsList.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warehouse</label>
            <select value={filters.warehouse} onChange={e => setFilters({...filters, warehouse: e.target.value})} className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Movement Type</label>
            <select value={filters.movementType} onChange={e => setFilters({...filters, movementType: e.target.value})} className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none">
              <option value="All">All Types</option>
              <option value="Purchase">Purchase (Stock In)</option>
              <option value="Sale">Sale (Stock Out)</option>
              <option value="Transfer">Transfer</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Return">Return</option>
            </select>
          </div>
          <div className="relative group">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-2xl font-bold text-slate-900 dark:text-white outline-none shadow-sm transition-all text-xs"
            />
          </div>
        </div>

        {/* Table: Product, Type, Qty, Before Qty, After Qty, User, Date */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Date & Time</th>
                <th className="px-6 py-6">Product</th>
                <th className="px-8 py-6 text-center">Type</th>
                <th className="px-8 py-6 text-center">Qty Change</th>
                <th className="px-8 py-6 text-center">Before Qty</th>
                <th className="px-8 py-6 text-center">After Qty</th>
                <th className="px-10 py-6">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="7" className="px-10 py-20 text-center text-slate-400 italic font-black uppercase tracking-widest text-[10px]">Synchronizing Audit Data...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="7" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No movement records found for selected criteria.</td></tr>
              ) : currentItems.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-10 py-6">
                    <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs leading-none">{new Date(log.date).toLocaleDateString()}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-tighter">
                       <Clock size={12} /> {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 shadow-inner group-hover:text-brand-600 transition-colors">
                          <Package size={18} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{log.productName}</p>
                          <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mt-1.5">{log.sku}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${getTypeStyle(log.type)}`}>
                       {log.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`text-sm font-black tabular-nums ${log.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="font-bold text-slate-400 tabular-nums text-xs">{log.newQuantity - log.quantityChange}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="font-black text-slate-900 dark:text-white tabular-nums text-sm">{log.newQuantity}</div>
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                           {(log.performedBy || log.userId?.name || log.userId?.username || 'S').charAt(0)}
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.performedBy || log.userId?.name || log.userId?.username || 'System'}</span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 flex items-center justify-between">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1} | Total Logs: {filteredHistory.length}</div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 disabled:opacity-30 hover:text-brand-600 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 disabled:opacity-30 hover:text-brand-600 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistory;
