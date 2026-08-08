import React, { useState, useEffect } from 'react';
import { ShoppingCart, PackagePlus, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const ReorderSuggestions = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/analytics/reorder-suggestions');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch reorder suggestions:", err);
                setError("Failed to load suggestions. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Check if any product has a vendor set
    const hasVendorData = data.some(item => item.vendor && item.vendor.trim() !== '');

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
                    <ShoppingCart size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Smart Reorder Suggestions</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Items that need to be restocked soon based on your reorder levels</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Product</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-right">Current Stock</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-right">Reorder Level</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-right">Suggested Order</th>
                                {hasVendorData && (
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Vendor</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={hasVendorData ? 5 : 4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No items currently need reordering. Great job!
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">{item.productName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">SKU: {item.sku}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                                {item.currentStock} {item.unit}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-slate-600 dark:text-slate-300 font-medium">
                                            {item.reorderLevel} {item.unit}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 font-bold text-brand-600 dark:text-brand-400">
                                                <PackagePlus size={16} />
                                                {item.suggestedOrderQty} {item.unit}
                                            </div>
                                        </td>
                                        {hasVendorData && (
                                            <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                                {item.vendor || '—'}
                                            </td>
                                        )}
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

export default ReorderSuggestions;
