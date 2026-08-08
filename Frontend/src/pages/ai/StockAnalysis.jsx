import React, { useState, useEffect } from 'react';
import { Activity, Flame, Snowflake, AlertCircle, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../services/api';

const StockAnalysis = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pass custom thresholds if needed, using defaults for now
                const response = await api.get('/analytics/stock-analysis');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch stock analysis:", err);
                setError("Failed to load stock analysis. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center text-red-500 flex flex-col items-center">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>{error || "No data available."}</p>
            </div>
        );
    }

    const { summary, fastMoving, deadStock } = data;

    const chartData = [
        { name: 'Fast Moving', value: summary.fastMovingCount, color: '#f97316' }, // Orange
        { name: 'Dead Stock', value: summary.deadStockCount, color: '#0ea5e9' }, // Sky Blue
        { name: 'Normal', value: summary.normalCount, color: '#94a3b8' } // Slate
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl shadow-lg shadow-brand-500/20 text-white">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Fast-Moving & Dead Stock Analysis</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analyze product velocity to optimize inventory turnover</p>
                </div>
            </div>

            {/* Overview Cards & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 self-start">Inventory Breakdown</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-4 w-full justify-center">
                        {chartData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                {entry.name}: {entry.value}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Fast Moving Stats */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5 rounded-2xl border border-orange-200 dark:border-orange-500/20 p-6 flex flex-col justify-between">
                        <div>
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
                                <Flame size={20} />
                            </div>
                            <h3 className="text-orange-800 dark:text-orange-300 font-semibold text-lg">Fast-Moving Items</h3>
                            <p className="text-orange-600/80 dark:text-orange-400/80 text-sm mt-1">High demand items driving revenue.</p>
                        </div>
                        <div className="mt-6 text-4xl font-bold text-orange-600 dark:text-orange-400">
                            {summary.fastMovingCount} <span className="text-lg font-medium text-orange-500/70">items</span>
                        </div>
                    </div>

                    {/* Dead Stock Stats */}
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-500/10 dark:to-sky-500/5 rounded-2xl border border-sky-200 dark:border-sky-500/20 p-6 flex flex-col justify-between">
                        <div>
                            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                                <Snowflake size={20} />
                            </div>
                            <h3 className="text-sky-800 dark:text-sky-300 font-semibold text-lg">Dead Stock</h3>
                            <p className="text-sky-600/80 dark:text-sky-400/80 text-sm mt-1">Items not selling, tying up capital.</p>
                        </div>
                        <div className="mt-6 text-4xl font-bold text-sky-600 dark:text-sky-400">
                            {summary.deadStockCount} <span className="text-lg font-medium text-sky-500/70">items</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Fast Moving List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <Flame className="text-orange-500" size={18} />
                        <h3 className="font-bold text-slate-800 dark:text-white">Top Fast-Moving</h3>
                    </div>
                    <div className="overflow-y-auto max-h-96 custom-scrollbar p-2">
                        {fastMoving.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">No fast-moving items found.</div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {fastMoving.slice(0, 10).map(item => (
                                    <li key={item.productId} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.productName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Stock: {item.currentStock}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-orange-600 dark:text-orange-400">{item.unitsSoldRecently} sold</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">in {item.periodDays} days</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Dead Stock List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <Snowflake className="text-sky-500" size={18} />
                        <h3 className="font-bold text-slate-800 dark:text-white">Dead Stock Attention</h3>
                    </div>
                    <div className="overflow-y-auto max-h-96 custom-scrollbar p-2">
                        {deadStock.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">No dead stock items found!</div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {deadStock.slice(0, 10).map(item => (
                                    <li key={item.productId} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.productName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Stock: {item.currentStock}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sky-600 dark:text-sky-400">{item.unitsSoldRecently} sold</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">in {item.periodDays} days</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StockAnalysis;
