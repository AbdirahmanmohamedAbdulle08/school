import React, { useState, useEffect } from 'react';
import { 
    Users, BarChart3, TrendingUp, ShoppingBag, Package, 
    ArrowRightLeft, Calendar, Filter, Download, UserCheck,
    Clock, Trophy, Target, AlertCircle, RefreshCw, CheckCircle2,
    Activity, Zap
} from 'lucide-react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    Cell, PieChart, Pie, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const WarehouseStaffReports = () => {
    const [activeTab, setActiveTab] = useState('Productivity');
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchPerformance();
    }, [dateRange]);

    const fetchPerformance = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reports/staff-performance?startDate=${dateRange.start}&endDate=${dateRange.end}`);
            setPerformanceData(data);
        } catch (error) {
            console.error('Failed to fetch performance data', error);
        } finally {
            setLoading(false);
        }
    };

    const totalStats = performanceData.reduce((acc, user) => ({
        totalActions: acc.totalActions + user.totalActions,
        picks: acc.picks + user.picks,
        receives: acc.receives + user.receives,
        transfers: acc.transfers + user.transfers,
        totalQuantity: acc.totalQuantity + user.totalQuantity
    }), { totalActions: 0, picks: 0, receives: 0, transfers: 0, totalQuantity: 0 });

    const renderProductivity = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/30 transition-all">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Actions</p>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{totalStats.totalActions}</h4>
                        <div className="mt-4 flex items-center gap-2 text-emerald-500">
                            <TrendingUp size={14} />
                            <span className="text-[10px] font-black uppercase">Active Personnel</span>
                        </div>
                    </div>
                    <Activity className="absolute -right-4 -bottom-4 text-slate-500/5 group-hover:scale-110 transition-transform" size={100} />
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/30 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Picks</p>
                    <h4 className="text-3xl font-black text-brand-600 tabular-nums">{totalStats.picks}</h4>
                    <div className="mt-4 flex items-center gap-2 text-brand-500">
                        <ShoppingBag size={14} />
                        <span className="text-[10px] font-black uppercase">Fulfilled Orders</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/30 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Receives</p>
                    <h4 className="text-3xl font-black text-emerald-500 tabular-nums">{totalStats.receives}</h4>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500">
                        <Package size={14} />
                        <span className="text-[10px] font-black uppercase">Processed Shipments</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/30 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Volume Handled</p>
                    <h4 className="text-3xl font-black text-amber-500 tabular-nums">{totalStats.totalQuantity.toLocaleString()}</h4>
                    <div className="mt-4 flex items-center gap-2 text-amber-500">
                        <ArrowRightLeft size={14} />
                        <span className="text-[10px] font-black uppercase">Units Moved</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Productivity Matrix</h3>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-600 hover:underline">
                        <Download size={14} /> Export
                    </button>
                </div>
                <div className="h-[400px] p-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="userName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                            <Bar dataKey="picks" name="Picks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                            <Bar dataKey="receives" name="Receives" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                            <Bar dataKey="transfers" name="Transfers" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderPickingSpeed = () => {
        const speedData = performanceData.map(u => ({
            name: u.userName,
            speed: Number(u.speed || 0),
            target: Number(u.target || 80)
        })).sort((a,b) => b.speed - a.speed);
        const activeSpeedRows = speedData.filter(user => user.speed > 0);
        const averageSpeed = activeSpeedRows.length
            ? Math.round(activeSpeedRows.reduce((sum, user) => sum + user.speed, 0) / activeSpeedRows.length)
            : 0;

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-brand-900 to-slate-900 p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-brand-500/20 rounded-3xl flex items-center justify-center text-brand-400 border border-brand-500/30">
                            <Zap size={40} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Velocity Pulse</h3>
                            <p className="text-brand-300 font-bold text-sm uppercase tracking-widest mt-1">Average Warehouse Pick Speed: <span className="text-white">{averageSpeed} LPH</span></p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Picking Speed Analytics (Lines Per Hour)</h3>
                    </div>
                    <div className="h-[400px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={speedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} />
                                <Area type="monotone" dataKey="speed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSpeed)" />
                                <Line type="dashed" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderPackingAccuracy = () => {
        const accuracyData = performanceData.map(u => ({
            name: u.userName,
            accuracy: Number(u.accuracy || 0),
            errors: Number(u.errors || 0)
        })).sort((a,b) => b.accuracy - a.accuracy);
        const activeAccuracyRows = accuracyData.filter(user => user.accuracy > 0);
        const averageAccuracy = activeAccuracyRows.length
            ? (activeAccuracyRows.reduce((sum, user) => sum + user.accuracy, 0) / activeAccuracyRows.length).toFixed(1)
            : '0.0';

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-10 rounded-[48px] border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-[28px] flex items-center justify-center shadow-xl shadow-emerald-500/30">
                            <CheckCircle2 size={40} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">Precision Metrics</h3>
                            <p className="text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest mt-1">Global Accuracy Rate: {averageAccuracy}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-6">Personnel</th>
                                <th className="px-4 py-6 text-center">Accuracy %</th>
                                <th className="px-4 py-6 text-center">Reported Errors</th>
                                <th className="px-8 py-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {accuracyData.map((user, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.name}</td>
                                    <td className="px-4 py-6 text-center">
                                        <span className={`tabular-nums font-black ${user.accuracy >= 98 ? 'text-emerald-500' : 'text-amber-500'}`}>{user.accuracy}%</span>
                                    </td>
                                    <td className="px-4 py-6 text-center tabular-nums font-bold text-slate-500">{user.errors}</td>
                                    <td className="px-8 py-6 text-right">
                                         <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ml-auto ${user.accuracy >= 98 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                                            {user.accuracy >= 98 ? 'Optimal' : 'Review Required'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAttendance = () => {
        const attendanceData = performanceData.map(u => ({
            name: u.userName,
            daysPresent: Number(u.daysPresent || 0),
            daysAbsent: Number(u.daysAbsent || 0),
            late: Number(u.late || 0),
            reliability: Number(u.reliability || 0)
        }));

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Workforce Attendance</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-6">Personnel</th>
                                <th className="px-4 py-6 text-center">Days Present</th>
                                <th className="px-4 py-6 text-center">Days Absent</th>
                                <th className="px-4 py-6 text-center">Late Arrivals</th>
                                <th className="px-8 py-6 text-right">Reliability Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {attendanceData.map((user, idx) => {
                                const score = user.reliability || 0;
                                return (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.name}</td>
                                    <td className="px-4 py-6 text-center font-bold text-slate-500">{user.daysPresent}</td>
                                    <td className="px-4 py-6 text-center font-bold text-rose-500">{user.daysAbsent}</td>
                                    <td className="px-4 py-6 text-center font-bold text-amber-500">{user.late}</td>
                                    <td className="px-8 py-6 text-right">
                                         <div className="flex items-center justify-end gap-3">
                                            <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${score >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }} />
                                            </div>
                                            <span className="font-black text-xs">{score}%</span>
                                         </div>
                                    </td>
                                </tr>
                            )})}
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
                    <div className="w-16 h-16 bg-rose-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-rose-500/20 transition-transform hover:rotate-3 shrink-0">
                        <Users size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Staff Performance Reports</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Workforce Productivity, Accuracy & Attendance</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm mr-4">
                        <div className="flex items-center gap-2 px-4 border-r border-slate-100 dark:border-slate-800">
                            <Calendar size={14} className="text-brand-500" />
                            <input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                className="bg-transparent border-none text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-300 focus:ring-0 cursor-pointer p-0"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4">
                            <input 
                                type="date" 
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                className="bg-transparent border-none text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-300 focus:ring-0 cursor-pointer p-0"
                            />
                        </div>
                    </div>

                    <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                        {[
                            { id: 'Productivity', label: 'Productivity', icon: <BarChart3 size={16} /> },
                            { id: 'Speed', label: 'Picking Speed', icon: <Zap size={16} /> },
                            { id: 'Accuracy', label: 'Packing Accuracy', icon: <Target size={16} /> },
                            { id: 'Attendance', label: 'Attendance', icon: <Clock size={16} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === tab.id
                                    ? 'bg-rose-600 text-white shadow-xl shadow-rose-500/20'
                                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800'
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
                    <RefreshCw className="animate-spin text-rose-500 mb-4" size={32} />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Compiling Analytics...</p>
                </div>
            ) : performanceData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center bg-white dark:bg-slate-900 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm p-12">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 border-2 border-slate-100 dark:border-slate-800">
                        <Users size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Workforce Data</h3>
                    <p className="text-slate-500 max-w-sm mt-3 font-medium">No operational data exists for the selected timeframe.</p>
                </div>
            ) : (
                <div className="px-2">
                    {activeTab === 'Productivity' && renderProductivity()}
                    {activeTab === 'Speed' && renderPickingSpeed()}
                    {activeTab === 'Accuracy' && renderPackingAccuracy()}
                    {activeTab === 'Attendance' && renderAttendance()}
                </div>
            )}
        </div>
    );
};

export default WarehouseStaffReports;
