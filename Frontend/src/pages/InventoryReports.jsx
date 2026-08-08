import React, { useState, useEffect } from 'react';
import {
  Box,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  PieChart,
  ShieldCheck,
  Info,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  User,
  MapPin,
  Layers,
  ChevronDown,
  Briefcase
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart as RePieChart, Pie, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const InventoryReports = () => {
  const [activeTab, setActiveTab] = useState('Summary');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports/inventory');
      setReportData(data);
    } catch (error) {
      console.error('Error fetching inventory reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const renderInventorySummary = () => {
    if (!reportData?.inventorySummary) return null;
    
    const totalValue = reportData.totals?.stockValue ?? reportData.inventorySummary.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 text-brand-600">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Stock Value</p>
            <h4 className="text-2xl font-black dark:text-white tabular-nums tracking-tighter">${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
                <Layers size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Categories</p>
            <h4 className="text-2xl font-black dark:text-white tabular-nums tracking-tighter">{reportData.inventorySummary.length}</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600">
                <Package size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Products</p>
            <h4 className="text-2xl font-black dark:text-white tabular-nums tracking-tighter">{reportData.totals?.products || 0}</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600">
                <Box size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On-Hand Quantity</p>
            <h4 className="text-2xl font-black dark:text-white tabular-nums tracking-tighter">{(reportData.totals?.onHandQuantity || 0).toLocaleString()}</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-[280px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={reportData.inventorySummary} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" nameKey="name" stroke="none">
                    {reportData.inventorySummary.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} formatter={(value) => `$${value.toLocaleString()}`} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global</span>
                <span className="text-xl font-black dark:text-white tabular-nums">${totalValue >= 1000 ? (totalValue/1000).toFixed(1) + 'k' : totalValue}</span>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-4 md:pl-10 mt-8 md:mt-0">
              <h4 className="text-lg font-black dark:text-white uppercase tracking-tight">Inventory Summary</h4>
              <div className="space-y-4">
                {reportData.inventorySummary.map((item, index) => (
                  <div key={item.name || 'Uncategorized'} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {item.name || 'Uncategorized'}
                      </div>
                      <span>${item.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${totalValue > 0 ? (item.value / totalValue) * 100 : 0}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFastMoving = () => {
    if (!reportData?.fastMoving) return null;
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Fast-Moving Products</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Product</th>
                <th className="px-10 py-6">SKU</th>
                <th className="px-10 py-6">Current Qty</th>
                <th className="px-10 py-6">Sold Qty</th>
                <th className="px-10 py-6 text-right">Sales Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
              {reportData.fastMoving.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-10 py-6 font-black dark:text-white uppercase tracking-tight">{row.name}</td>
                  <td className="px-10 py-6 text-[10px] text-slate-400 uppercase tracking-widest">{row.sku}</td>
                  <td className="px-10 py-6 tabular-nums">{row.quantity} Units</td>
                  <td className="px-10 py-6 tabular-nums text-emerald-600 dark:text-emerald-400">{row.quantitySold || 0} Units</td>
                  <td className="px-10 py-6 text-right tabular-nums text-brand-600 dark:text-brand-400">${Number(row.revenue || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                </tr>
              ))}
              {reportData.fastMoving.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-10 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No fast-moving items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDeadStock = () => {
    if (!reportData?.deadStock) return null;
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Dead Stock Analysis</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Product</th>
                <th className="px-10 py-6">SKU</th>
                <th className="px-10 py-6">On-Hand</th>
                <th className="px-10 py-6">Age (Added)</th>
                <th className="px-10 py-6 text-right">Locked Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
              {reportData.deadStock.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-10 py-6 font-black dark:text-white uppercase tracking-tight">{row.name}</td>
                  <td className="px-10 py-6 text-[10px] text-slate-400 uppercase tracking-widest">{row.sku}</td>
                  <td className="px-10 py-6 tabular-nums">{row.quantity} Units</td>
                  <td className="px-10 py-6 tabular-nums text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-10 py-6 text-right tabular-nums font-black text-rose-500">${((row.cost || 0) * row.quantity).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                </tr>
              ))}
              {reportData.deadStock.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-10 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No dead stock items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLowStock = () => {
    if (!reportData?.lowStock) return null;
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="p-10 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 rounded-[48px] flex flex-col md:flex-row items-center justify-between group relative overflow-hidden gap-6">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
            <AlertTriangle size={160} />
          </div>
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-rose-600 text-white rounded-[28px] flex items-center justify-center shadow-xl shadow-rose-600/30 shrink-0">
              <AlertTriangle size={36} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight leading-none">Critical Depletion</h3>
              <p className="text-sm text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest">{reportData.lowStock.length} stock items have reached reorder thresholds.</p>
            </div>
          </div>
          <button className="px-8 py-5 bg-rose-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:bg-rose-700 transition-all active:scale-95 relative z-10 shrink-0">
            Low Stock Review
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Low Stock SKU</th>
                <th className="px-10 py-6">On-Hand</th>
                <th className="px-10 py-6">Min. Threshold</th>
                <th className="px-10 py-6 text-right">Risk Pulse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
              {reportData.lowStock.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-10 py-6">
                    <p className="font-black dark:text-white uppercase tracking-tight">{row.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{row.sku}</p>
                  </td>
                  <td className="px-10 py-6 tabular-nums">{row.quantity} Units</td>
                  <td className="px-10 py-6 tabular-nums text-slate-400">{row.reorderLevel} Units</td>
                  <td className="px-10 py-6 text-right">
                    <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ml-auto border border-rose-100 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-500">
                      Critical
                    </div>
                  </td>
                </tr>
              ))}
              {reportData.lowStock.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-10 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No items below reorder level.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-brand-500/20 transition-transform hover:rotate-3 shrink-0">
            <Package size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Inventory Reports</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Inventory Summary, Low Stock, Fast Moving Items & Dead Stock</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
            {[
              { id: 'Summary', label: 'Inventory Summary', icon: <DollarSign size={16} /> },
              { id: 'LowStock', label: 'Low Stock', icon: <AlertTriangle size={16} /> },
              { id: 'FastMoving', label: 'Fast Moving Items', icon: <TrendingUp size={16} /> },
              { id: 'DeadStock', label: 'Dead Stock', icon: <Box size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
             <RefreshCw className="animate-spin text-brand-500 mb-4" size={32} />
             <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Compiling Analytics...</p>
          </div>
        ) : (
          <>
            {activeTab === 'Summary' && renderInventorySummary()}
            {activeTab === 'LowStock' && renderLowStock()}
            {activeTab === 'FastMoving' && renderFastMoving()}
            {activeTab === 'DeadStock' && renderDeadStock()}
          </>
        )}
      </div>

    </div>
  );
};

export default InventoryReports;
