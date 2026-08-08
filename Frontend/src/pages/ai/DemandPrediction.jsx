import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const DemandPrediction = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/analytics/demand-prediction');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch demand prediction:", err);
                setError("Failed to load predictions. Please try again.");
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

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 flex flex-col items-center">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl shadow-lg shadow-brand-500/20 text-white">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Demand Prediction</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">AI-driven forecasts based on historical sales trends</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        No sales data available for predictions.
                    </div>
                ) : (
                    data.map((item) => (
                        <div key={item.productId} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{item.productName}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Predicted Demand</p>
                                </div>
                                <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-500/10 px-3 py-1.5 rounded-lg text-brand-600 dark:text-brand-400 font-bold text-lg">
                                    <TrendingUp size={18} />
                                    {item.predictedNextWeekDemand} units
                                </div>
                            </div>
                            
                            <div className="h-48 w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={item.historicalWeeklySales.map((val, idx) => ({ week: `W${idx+1}`, sales: val }))}>
                                        <defs>
                                            <linearGradient id={`colorSales${item.productId}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill={`url(#colorSales${item.productId})`} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DemandPrediction;
