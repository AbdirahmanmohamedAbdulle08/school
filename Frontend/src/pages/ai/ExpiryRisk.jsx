import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const ExpiryRisk = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/analytics/expiry-risk');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch expiry risk:", err);
                setError("Failed to load expiry data. Please try again.");
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
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-500/20 text-white">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Expiry Risk Analysis</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Identify products that are expiring soon or have already expired</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Product</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Batch / Location</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-right">Quantity</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-right">Expiry Date</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No items at risk of expiring in the next 90 days.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.binStockId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">{item.productName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">SKU: {item.sku}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-700 dark:text-slate-300">
                                                Batch: <span className="font-medium">{item.batchNumber || 'N/A'}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Loc: {item.locationName}</div>
                                        </td>
                                        <td className="p-4 text-right text-slate-600 dark:text-slate-300 font-medium">
                                            {item.quantity}
                                        </td>
                                        <td className="p-4 text-right text-slate-600 dark:text-slate-300 text-sm">
                                            {new Date(item.expiryDate).toLocaleDateString()}
                                            <div className="text-xs mt-1 text-slate-400 flex items-center justify-end gap-1">
                                                <Clock size={12} />
                                                {item.daysToExpiry < 0 ? `${Math.abs(item.daysToExpiry)} days ago` : `in ${item.daysToExpiry} days`}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {item.riskLevel === 'Expired' && (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                                                    Expired
                                                </span>
                                            )}
                                            {item.riskLevel === 'High' && (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                                                    Expiring Soon
                                                </span>
                                            )}
                                            {item.riskLevel === 'Medium' && (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
                                                    Monitoring
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpiryRisk;
