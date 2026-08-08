import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';
import {
    ArrowRightLeft,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    MapPin,
    ArrowRight,
    Package,
    Calendar,
    Truck,
    Building,
    X,
    User
} from 'lucide-react';

const InventoryTransfer = () => {
    const { showAlert, showConfirm } = useAlert();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    // Form Inputs: Source Warehouse, Destination Warehouse, Product, Quantity, Transfer Date
    const [formData, setFormData] = useState({
        sourceWarehouse: '',
        destinationWarehouse: '',
        product: '',
        quantity: 1,
        transferDate: new Date().toISOString().split('T')[0]
    });

    const [availableProducts, setAvailableProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    const [updatingTransferId, setUpdatingTransferId] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transfersRes, warehousesRes] = await Promise.all([
                api.get('/transfers'),
                api.get('/warehouses')
            ]);
            setTransfers(transfersRes.data);
            setWarehouses(warehousesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch products when "Source Warehouse" changes
    useEffect(() => {
        if (formData.sourceWarehouse) {
            const fetchWarehouseProducts = async () => {
                try {
                    setProductLoading(true);
                    const { data } = await api.get(`/products?warehouseId=${formData.sourceWarehouse}&limit=1000`);
                    const products = data.products || data;
                    setAvailableProducts(products);
                } catch (error) {
                    console.error("Failed to fetch warehouse products", error);
                } finally {
                    setProductLoading(false);
                }
            };
            fetchWarehouseProducts();
        } else {
            setAvailableProducts([]);
        }
    }, [formData.sourceWarehouse]);

    const [isSavingTransfer, setIsSavingTransfer] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSavingTransfer) return;
        if (formData.sourceWarehouse === formData.destinationWarehouse) {
            showAlert({
                type: 'warning',
                title: 'Check warehouses',
                message: 'Source and destination warehouses cannot be the same.',
                buttonText: 'Review'
            });
            return;
        }

        try {
            setIsSavingTransfer(true);
            // Map to the format backend expects (Backend usually expects items array)
            const payload = {
                fromBranch: formData.sourceWarehouse,
                toBranch: formData.destinationWarehouse,
                items: [{
                    product: formData.product,
                    qty: Number(formData.quantity)
                }],
                notes: `Transfer scheduled for ${formData.transferDate}`
            };
            
            await api.post('/transfers', payload);
            setIsModalOpen(false);
            setFormData({
                sourceWarehouse: '',
                destinationWarehouse: '',
                product: '',
                quantity: 1,
                transferDate: new Date().toISOString().split('T')[0]
            });
            fetchData();
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: 'Transfer request created successfully.',
                buttonText: 'Continue'
            });
        } catch (error) {
            console.error('Failed to create transfer:', error);
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: error.response?.data?.message || 'Failed to create transfer.',
                buttonText: 'Try again'
            });
        } finally {
            setIsSavingTransfer(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const ok = await showConfirm({
            type: 'warning',
            title: 'Update transfer?',
            message: `Mark this transfer as ${newStatus}?`,
            confirmText: `Mark ${newStatus}`,
            cancelText: 'Cancel'
        });
        if (!ok) return;
        try {
            setUpdatingTransferId(id);
            await api.put(`/transfers/${id}/status`, { status: newStatus });
            fetchData();
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: `Transfer ${newStatus} successfully.`,
                buttonText: 'Continue'
            });
        } catch (error) {
            console.error('Failed to update status:', error);
            const serverMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data?.details;
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: serverMessage || 'Failed to update transfer status.',
                buttonText: 'Try again'
            });
        } finally {
            setUpdatingTransferId(null);
        }
    };

    const filteredTransfers = useMemo(() => {
        return transfers.filter(t => {
            const matchesSearch = t.transferNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.fromBranch?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.toBranch?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [transfers, searchTerm, statusFilter]);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-brand-600 text-white rounded-[24px] shadow-xl shadow-brand-500/20">
                        <ArrowRightLeft size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Stock Transfers</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest opacity-70">Inter-Warehouse Inventory Logistics</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                >
                    <Plus size={18} strokeWidth={3} />
                    New Transfer
                </button>
            </div>

            {/* Table: Transfer ID, Source, Destination, Status, Created By */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID or Warehouse..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-brand-500/5 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['All', 'Pending', 'Completed', 'Cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${statusFilter === status ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5">Transfer ID</th>
                                <th className="px-8 py-5">Source</th>
                                <th className="px-8 py-5">Destination</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Created By</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredTransfers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-12 text-center text-slate-400 font-medium italic">No transfers found.</td>
                                </tr>
                            ) : filteredTransfers.map((t) => (
                                <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6 font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.transferNo}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300">
                                            <Building size={14} className="text-slate-400" />
                                            {t.fromBranch?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400">
                                            <Building size={14} className="text-brand-400" />
                                            {t.toBranch?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                            t.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-rose-100 text-rose-700'
                                        }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <User size={14} />
                                            {t.createdBy?.username || 'System Admin'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {t.status === 'Pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button disabled={updatingTransferId === t._id} onClick={() => handleStatusUpdate(t._id, 'Completed')} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 disabled:opacity-50" title="Complete Transfer"><CheckCircle2 size={16} /></button>
                                                <button disabled={updatingTransferId === t._id} onClick={() => handleStatusUpdate(t._id, 'Cancelled')} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 disabled:opacity-50" title="Cancel Transfer"><XCircle size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form: Source Warehouse, Destination Warehouse, Product, Quantity, Transfer Date */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <ArrowRightLeft className="text-brand-600" /> New Transfer Form
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Source Warehouse</label>
                                    <select required value={formData.sourceWarehouse} onChange={(e) => setFormData({...formData, sourceWarehouse: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-brand-500 shadow-sm">
                                        <option value="">Select Source...</option>
                                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Destination Warehouse</label>
                                    <select required value={formData.destinationWarehouse} onChange={(e) => setFormData({...formData, destinationWarehouse: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-brand-500 shadow-sm">
                                        <option value="">Select Destination...</option>
                                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Product</label>
                                    <select required value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} disabled={!formData.sourceWarehouse || productLoading} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-brand-500 shadow-sm disabled:opacity-50">
                                        <option value="">{productLoading ? 'Loading Products...' : 'Select Product...'}</option>
                                        {availableProducts.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.quantity ?? 0})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Quantity</label>
                                    <input required type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-brand-500 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Transfer Date</label>
                                    <input required type="date" value={formData.transferDate} onChange={(e) => setFormData({...formData, transferDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-brand-500 shadow-sm" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingTransfer || !formData.product}
                                className="w-full mt-4 py-5 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSavingTransfer ? 'Creating Transfer...' : 'Initiate Transfer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTransfer;
