import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, History, RefreshCw, Download, 
    AlertTriangle, Target, SearchX, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const AuditReports = () => {
    const [activeTab, setActiveTab] = useState('History');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reports/audits');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch audit reports', error);
        } finally {
            setLoading(false);
        }
    };

    const renderHistory = () => {
        const history = stats?.history || [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="bg-slate-900 p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-between border border-slate-800">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <History size={160} />
                    </div>
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 border border-slate-700">
                            <ShieldCheck size={40} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Audit Trail</h3>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Total Audits Conducted: <span className="text-white">{stats?.summary?.totalAudits || 0}</span></p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Cycle Counts</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-6">Audit ID & Date</th>
                                <th className="px-4 py-6">Auditor</th>
                                <th className="px-4 py-6">Location</th>
                                <th className="px-4 py-6 text-center">Discrepancy Count</th>
                                <th className="px-8 py-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {history.length ? history.map((audit, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{audit.id}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{audit.date}</p>
                                    </td>
                                    <td className="px-4 py-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-widest">{audit.auditor}</td>
                                    <td className="px-4 py-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-widest">{audit.location}</td>
                                    <td className="px-4 py-6 text-center">
                                        <span className={`tabular-nums font-black ${audit.variance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{audit.variance}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                         <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ml-auto ${audit.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                                            {audit.status}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                                        No audit records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderVariance = () => {
        const varianceData = stats?.varianceData || [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-[40px] border border-amber-100 dark:border-amber-800/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 rounded-2xl bg-amber-500 text-white">
                                <Target size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Global Variance Rate</p>
                        <h4 className="text-4xl font-black text-amber-900 dark:text-white tabular-nums tracking-tighter">{stats?.summary?.varianceRate || 0}%</h4>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 rounded-2xl bg-emerald-500 text-white">
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Inventory Accuracy</p>
                        <h4 className="text-4xl font-black text-emerald-900 dark:text-white tabular-nums tracking-tighter">{stats?.summary?.inventoryAccuracy || 0}%</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Inventory Variance</h3>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                    <div className="h-[400px] p-6">
                        {varianceData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={varianceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                                    <Bar dataKey="system" name="System Count" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="physical" name="Physical Count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-xs">
                                No inventory variance found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderMissing = () => {
        const missingItems = stats?.missingItems || [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="p-10 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 rounded-[48px] flex items-center justify-between group relative overflow-hidden gap-6">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                        <SearchX size={160} />
                    </div>
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-20 h-20 bg-rose-600 text-white rounded-[28px] flex items-center justify-center shadow-xl shadow-rose-600/30 shrink-0">
                            <AlertTriangle size={36} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight leading-none">Unaccounted Shrinkage</h3>
                            <p className="text-sm text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest">Total Lost Value: ${(stats?.summary?.totalLostValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <button className="px-8 py-5 bg-rose-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:bg-rose-700 transition-all active:scale-95 relative z-10 shrink-0">
                        Write Off Selected
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Missing Stock Itemization</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-6">Item Identify</th>
                                <th className="px-4 py-6 text-center">Quantity Lost</th>
                                <th className="px-4 py-6">Last Known Location</th>
                                <th className="px-8 py-6 text-right">Lost Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {missingItems.length ? missingItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{item.sku}</p>
                                    </td>
                                    <td className="px-4 py-6 text-center tabular-nums font-black text-rose-500">{item.lost}</td>
                                    <td className="px-4 py-6 font-bold text-slate-500 uppercase tracking-widest text-xs">{item.lastSeen}</td>
                                    <td className="px-8 py-6 text-right font-black tabular-nums text-rose-600">${item.value.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                                        No missing stock items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-4 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-slate-800/20 transition-transform hover:rotate-3 shrink-0">
                        <ShieldCheck size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Audit & Quality Reports</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Inventory Accuracy, Quality Exceptions & Variance Control</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                        {[
                            { id: 'History', label: 'Audit History', icon: <History size={16} /> },
                            { id: 'Variance', label: 'Inventory Variance', icon: <Target size={16} /> },
                            { id: 'Missing', label: 'Damaged & Missing Items', icon: <SearchX size={16} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === tab.id
                                    ? 'bg-slate-800 text-white shadow-xl shadow-slate-800/20'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <RefreshCw className="animate-spin text-slate-500 mb-4" size={32} />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Validating Records...</p>
                </div>
            ) : (
                <div className="px-2">
                    {activeTab === 'History' && renderHistory()}
                    {activeTab === 'Variance' && renderVariance()}
                    {activeTab === 'Missing' && renderMissing()}
                </div>
            )}
        </div>
    );
};

export default AuditReports;
