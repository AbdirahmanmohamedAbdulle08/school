import React, { useState, useEffect } from 'react';
import { 
    Truck, Map, Clock, DollarSign, Activity, 
    RefreshCw, Download, Navigation, ShieldAlert, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const ShipmentReports = () => {
    const [activeTab, setActiveTab] = useState('SalesSummary');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reports/shipments');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch shipment performance', error);
        } finally {
            setLoading(false);
        }
    };

    const renderDeliveryAnalytics = () => {
        const data = stats?.deliveryData ? stats.deliveryData.map(item => ({ name: item.name, onTime: item.onTime, late: item.late })) : [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-blue-900 to-brand-900 p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-between">
                        <div className="relative z-10 flex items-center gap-8">
                            <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                                <Truck size={40} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tight">On-Time Delivery</h3>
                                <p className="text-blue-300 font-bold text-sm uppercase tracking-widest mt-1">Success Rate: <span className="text-white">{stats?.onTimeRate || 0}%</span></p>
                            </div>
                        </div>
                    </div>
                     <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-800/30">
                                <Navigation size={40} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Avg Transit Time</h3>
                                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Global Average: <span className="text-amber-500">{stats?.averageTransitDays || 0} Days</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Delivery Performance Trend</h3>
                    </div>
                    <div className="h-[400px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                                <Bar dataKey="onTime" name="On Time" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={32} />
                                <Bar dataKey="late" name="Late" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderLogisticsPerformance = () => {
        const data = stats?.logisticsData?.receivingDispatchData ? stats.logisticsData.receivingDispatchData.map(item => ({ name: item.day, receiving: item.receiving, dispatch: item.dispatch })) : [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Driver Performance Leaderboard</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-6">Driver Name</th>
                                <th className="px-4 py-6 text-center">Total Deliveries</th>
                                <th className="px-8 py-6 text-right">Performance Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {stats?.logisticsData?.drivers?.length ? stats.logisticsData.drivers.map((driver, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white uppercase tracking-tight">{driver.name}</td>
                                    <td className="px-4 py-6 text-center tabular-nums font-bold text-slate-500">{driver.deliveries}</td>
                                    <td className="px-8 py-6 text-right">
                                         <div className="flex items-center justify-end gap-3">
                                            <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${driver.score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${driver.score}%` }} />
                                            </div>
                                            <span className="font-black text-xs tabular-nums">{driver.score}%</span>
                                         </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="px-8 py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                                        No completed driver deliveries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSalesSummary = () => {
        const data = stats?.salesSummary?.salesData || [];
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
                        <h3 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">${(stats?.salesSummary?.totalSales || 0).toLocaleString()}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Orders</p>
                        <h3 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{stats?.salesSummary?.totalOrders || 0}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Sales Summary</h3>
                    </div>
                    <div className="h-[400px] min-h-[400px] min-w-0 p-6">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip formatter={(value, name) => name === 'sales' ? `$${value.toLocaleString()}` : value} />
                                <Bar dataKey="sales" name="Sales" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderBestSellingProducts = () => (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-500">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <th className="px-8 py-6">Product</th>
                        <th className="px-8 py-6 text-center">Quantity Sold</th>
                        <th className="px-8 py-6 text-right">Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(stats?.bestSellingProducts || []).map(product => (
                        <tr key={product.name}>
                            <td className="px-8 py-6 font-black text-slate-900 dark:text-white uppercase tracking-tight">{product.name}</td>
                            <td className="px-8 py-6 text-center font-bold text-slate-500">{product.quantitySold}</td>
                            <td className="px-8 py-6 text-right font-black text-sky-600">${product.revenue.toLocaleString()}</td>
                        </tr>
                    ))}
                    {(!stats?.bestSellingProducts || stats.bestSellingProducts.length === 0) && (
                        <tr>
                            <td colSpan="3" className="px-8 py-12 text-center text-xs font-black uppercase tracking-widest text-slate-400">No sales item data found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderDelays = () => {
        const delayReasons = stats?.delaysData ? stats.delaysData.map(item => ({ name: item.name, value: item.value })) : [];
        const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6'];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="p-10 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 rounded-[48px] flex items-center justify-between group relative overflow-hidden gap-6">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                        <AlertTriangle size={160} />
                    </div>
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-20 h-20 bg-rose-600 text-white rounded-[28px] flex items-center justify-center shadow-xl shadow-rose-600/30 shrink-0">
                            <Clock size={36} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight leading-none">Delay Metrics</h3>
                            <p className="text-sm text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest">{stats?.delayRate || 0}% of total shipments experienced delays.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center justify-center">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 self-start">Root Cause Analysis</h3>
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={delayReasons} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                                        {delayReasons.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
                         <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Delay Breakdown</h3>
                         <div className="space-y-6">
                            {delayReasons.length ? delayReasons.map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            {item.name}
                                        </div>
                                        <span className="text-slate-500">{item.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                                    </div>
                                </div>
                            )) : (
                                <div className="py-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                                    No delayed shipments found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTransportCosts = () => {
        const costData = stats?.costsData ? stats.costsData.map(item => ({ name: item.name, cost: item.cost })) : [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                            <DollarSign size={40} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Total Transport Costs</h3>
                            <h4 className="text-emerald-300 font-bold text-sm uppercase tracking-widest mt-1">Total Received Volume</h4>
                            <h4 className="text-emerald-300 font-bold text-sm uppercase tracking-widest mt-1">{stats?.logisticsData?.receiving || 0} Units</h4>
                            <p className="text-emerald-300 font-bold text-sm uppercase tracking-widest mt-1">Monthly Expenditure: <span className="text-white">${(stats?.totalMonthlyCosts || 0).toLocaleString()}</span></p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Cost Trend Analysis</h3>
                    </div>
                    <div className="h-[400px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={costData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} formatter={(value) => `$${value.toLocaleString()}`} />
                                <Area type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCost)" />
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
                    <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 transition-transform hover:rotate-3 shrink-0">
                        <Truck size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Sales & Distribution Reports</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Sales Flow, Shipment Status & Delivery Performance</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                        {[
                            { id: 'SalesSummary', label: 'Sales Summary', icon: <DollarSign size={16} /> },
                            { id: 'BestSelling', label: 'Best Selling Products', icon: <Activity size={16} /> },
                            { id: 'Delivery', label: 'Shipment Status', icon: <Map size={16} /> },
                            { id: 'Logistics', label: 'Delivery Performance', icon: <Activity size={16} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'
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
                    <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Processing Routes...</p>
                </div>
            ) : (
                <div className="px-2">
                    {activeTab === 'SalesSummary' && renderSalesSummary()}
                    {activeTab === 'BestSelling' && renderBestSellingProducts()}
                    {activeTab === 'Delivery' && renderDeliveryAnalytics()}
                    {activeTab === 'Logistics' && renderLogisticsPerformance()}
                </div>
            )}
        </div>
    );
};

export default ShipmentReports;
