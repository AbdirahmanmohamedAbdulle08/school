import React, { useState, useEffect } from 'react';
import { 
    BarChart3, Activity, Layers, ArrowRightLeft, 
    RefreshCw, Zap, MoveRight, MoveLeft,
    Map
} from 'lucide-react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const WarehousePerformanceReports = () => {
    const [activeTab, setActiveTab] = useState('ReceivingDispatching');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reports/warehouse-performance');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch warehouse performance', error);
        } finally {
            setLoading(false);
        }
    };

    const renderEfficiency = () => {
        const data = stats?.efficiencyData ? stats.efficiencyData.map(item => ({ name: item.day, efficiency: item.value })) : [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                            <Activity size={40} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Overall Efficiency</h3>
                            <p className="text-emerald-300 font-bold text-sm uppercase tracking-widest mt-1">Global Node Score: <span className="text-white">{stats?.efficiency || 0}%</span></p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">7-Day Efficiency Trend</h3>
                    </div>
                    <div className="h-[400px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} />
                                <Area type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEff)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderUtilization = () => {
        const utilization = stats?.storageUtilization ?? 0;
        const utilizationRows = stats?.zoneBreakdown || [];
        const data = [
            { name: 'Used Capacity', value: utilization },
            { name: 'Free Capacity', value: 100 - utilization }
        ];
        const COLORS = ['#6366f1', '#e2e8f0'];
        const getUsageColor = (usage) => {
            if (usage >= 90) return 'bg-rose-500';
            if (usage >= 70) return 'bg-amber-500';
            if (usage > 0) return 'bg-emerald-500';
            return 'bg-slate-400';
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center justify-center">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 self-start">Space Utilization</h3>
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data} innerRadius={100} outerRadius={130} paddingAngle={5} dataKey="value" stroke="none">
                                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 1 ? 'rgba(99, 102, 241, 0.1)' : COLORS[index]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-brand-600 tabular-nums">{utilization}%</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Occupied</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Warehouse Breakdown</h3>
                        </div>
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                                {utilizationRows.length > 0 ? utilizationRows.map((row) => (
                                    <tr key={row.zone} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-8 py-6 font-black dark:text-white uppercase tracking-tight flex items-center gap-3">
                                            <Map size={16} className="text-slate-400" /> {row.zone}
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {row.products || 0} products
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right w-1/2">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="h-1.5 w-full max-w-[150px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${getUsageColor(row.usage)}`} style={{ width: `${row.usage}%` }} />
                                                </div>
                                                <span className="font-black tabular-nums min-w-[30px]">{row.usage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="px-8 py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                                            No warehouse capacity data found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderReceivingDispatch = () => {
        const data = stats?.receivingDispatchData ? stats.receivingDispatchData.map(item => ({ name: item.day, receiving: item.receiving, dispatch: item.dispatch })) : [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-brand-50 dark:bg-brand-900/20 p-8 rounded-[40px] border border-brand-100 dark:border-brand-800/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 rounded-2xl bg-brand-500 text-white">
                                <MoveLeft size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-widest mb-1">Total Received Volume</p>
                        <h4 className="text-4xl font-black text-brand-900 dark:text-white tabular-nums tracking-tighter">{stats?.receiving || 0} Units</h4>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-8 rounded-[40px] border border-rose-100 dark:border-rose-800/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 rounded-2xl bg-rose-500 text-white">
                                <MoveRight size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-1">Total Dispatched Volume</p>
                        <h4 className="text-4xl font-black text-rose-900 dark:text-white tabular-nums tracking-tighter">{stats?.dispatch || 0} Units</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Inbound vs Outbound Analytics</h3>
                    </div>
                    <div className="h-[400px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                                <Bar dataKey="receiving" name="Receiving" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                <Bar dataKey="dispatch" name="Dispatch" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-4 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 transition-transform hover:rotate-3 shrink-0">
                        <BarChart3 size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Warehouse Operations Reports</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Stock In, Stock Out, Utilization & Flow Analytics</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                        {[
                            { id: 'ReceivingDispatching', label: 'Receiving & Dispatching', icon: <ArrowRightLeft size={16} /> },
                            { id: 'Picking', label: 'Picking & Packing', icon: <ArrowRightLeft size={16} /> },
                            { id: 'Efficiency', label: 'Warehouse Performance', icon: <Zap size={16} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20'
                                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
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
                    <RefreshCw className="animate-spin text-emerald-500 mb-4" size={32} />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Processing Data...</p>
                </div>
            ) : (
                <div className="px-2">
                    {activeTab === 'ReceivingDispatching' && renderReceivingDispatch()}
                    {activeTab === 'Picking' && renderUtilization()}
                    {activeTab === 'Efficiency' && renderEfficiency()}
                </div>
            )}
        </div>
    );
};

export default WarehousePerformanceReports;
