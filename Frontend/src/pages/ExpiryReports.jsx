import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, Trash2, TrendingDown, RefreshCw, 
    Download, ShieldAlert, CalendarX, LineChart as LineChartIcon
} from 'lucide-react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const ExpiryReports = () => {
    const [activeTab, setActiveTab] = useState('Expired');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reports/expiry');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch expiry reports', error);
        } finally {
            setLoading(false);
        }
    };

    const renderExpiredStock = () => {
        const expiredItems = stats?.expired || [];
        const expiringSoon = stats?.expiringSoon || [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-8 rounded-[40px] border border-rose-100 dark:border-rose-800/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 rounded-2xl bg-rose-500 text-white">
                                <AlertTriangle size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-1">Total Expired Items</p>
                        <h4 className="text-4xl font-black text-rose-900 dark:text-white tabular-nums tracking-tighter">{expiredItems.length}</h4>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-[40px] border border-amber-100 dark:border-amber-800/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 rounded-2xl bg-amber-500 text-white">
                                <CalendarX size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Expiring in 30 Days</p>
                        <h4 className="text-4xl font-black text-amber-900 dark:text-white tabular-nums tracking-tighter">{expiringSoon.length}</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Expired Inventory</h3>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <Download size={14} /> Export List
                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-6">Product</th>
                                <th className="px-4 py-6">SKU</th>
                                <th className="px-4 py-6 text-center">Quantity</th>
                                <th className="px-8 py-6 text-right">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {expiredItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</td>
                                    <td className="px-4 py-6 font-bold text-slate-500 text-xs tracking-widest uppercase">{item.sku}</td>
                                    <td className="px-4 py-6 text-center tabular-nums font-black text-rose-500">{item.quantity}</td>
                                    <td className="px-8 py-6 text-right font-black tabular-nums text-rose-600">
                                        {new Date(item.expiryDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {expiredItems.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No expired items found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderWasted = () => {
        const wasteData = [
            { category: 'Supplements', value: 4500 },
            { category: 'Cosmetics', value: 3200 },
            { category: 'Beverages', value: 1500 },
            { category: 'Snacks', value: 800 },
        ];
        const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308'];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="bg-gradient-to-r from-rose-900 to-slate-900 p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center text-rose-400 border border-rose-500/30">
                            <Trash2 size={40} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Shelf-Life Losses</h3>
                            <p className="text-rose-300 font-bold text-sm uppercase tracking-widest mt-1">Total Financial Loss (YTD): <span className="text-white">$10,000.00</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center justify-center">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 self-start">Loss by Category</h3>
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={wasteData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" nameKey="category" stroke="none">
                                        {wasteData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} formatter={(value) => `$${value.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Waste Details</h3>
                        </div>
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                                {wasteData.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-8 py-6 font-black dark:text-white uppercase tracking-tight flex items-center gap-3">
                                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            {row.category}
                                        </td>
                                        <td className="px-8 py-6 text-right font-black tabular-nums text-rose-500">
                                            ${row.value.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderTrends = () => {
        const trendData = [
            { name: 'Jan', expiryRate: 2.1 },
            { name: 'Feb', expiryRate: 1.8 },
            { name: 'Mar', expiryRate: 2.4 },
            { name: 'Apr', expiryRate: 3.1 },
            { name: 'May', expiryRate: 2.5 },
            { name: 'Jun', expiryRate: 1.5 },
        ];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Expiry Rate Trends (6 Months)</h3>
                    </div>
                    <div className="h-[400px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} formatter={(value) => `${value}%`} />
                                <Area type="monotone" dataKey="expiryRate" name="Expiry Rate" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-4 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-sky-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-sky-500/20 transition-transform hover:rotate-3 shrink-0">
                        <ShieldAlert size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Expiry & Shelf-Life Reports</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Expired Products, Risk Windows & Loss Prevention</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                        {[
                            { id: 'Expired', label: 'Expired Products', icon: <AlertTriangle size={16} /> },
                            { id: 'Wasted', label: 'Shelf-Life Losses', icon: <Trash2 size={16} /> },
                            { id: 'Trends', label: 'Expiry Trends', icon: <LineChartIcon size={16} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === tab.id
                                    ? 'bg-sky-600 text-white shadow-xl shadow-sky-500/20'
                                    : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800'
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
                    <RefreshCw className="animate-spin text-sky-500 mb-4" size={32} />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Scanning Expiry Dates...</p>
                </div>
            ) : (
                <div className="px-2">
                    {activeTab === 'Expired' && renderExpiredStock()}
                    {activeTab === 'Wasted' && renderWasted()}
                    {activeTab === 'Trends' && renderTrends()}
                </div>
            )}
        </div>
    );
};

export default ExpiryReports;
