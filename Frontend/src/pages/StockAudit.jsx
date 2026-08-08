import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';
import {
    ClipboardCheck,
    Plus,
    Search,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Building,
    MapPin,
    Package,
    BarChart3,
    ArrowRight,
    ChevronRight,
    History,
    Save,
    Trash2,
    X,
    User,
    ArrowDownLeft
} from 'lucide-react';

const StockAudit = () => {
    const { showAlert, showConfirm } = useAlert();
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);
    const [bins, setBins] = useState([]);
    const [products, setProducts] = useState([]);
    const [binProducts, setBinProducts] = useState([]);
    
    const [view, setView] = useState('LIST'); // 'LIST', 'NEW', 'SESSION', 'REPORT'
    const [selectedAudit, setSelectedAudit] = useState(null);

    // New Audit Form
    const [newAuditForm, setNewAuditForm] = useState({
        warehouseId: '',
        notes: ''
    });

    // Recording Form
    const [recordForm, setRecordForm] = useState({
        bin: '',
        product: '',
        physicalQuantity: 0
    });

    const [liveSystemQty, setLiveSystemQty] = useState(0);
    const [isCheckingSystem, setIsCheckingSystem] = useState(false);
    const [isLoadingBinProducts, setIsLoadingBinProducts] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [auditsRes, warehousesRes, productsRes, binsRes] = await Promise.all([
                api.get('/audit'),
                api.get('/warehouses'),
                api.get('/products'),
                api.get('/locations?type=Bin')
            ]);
            setAudits(auditsRes.data);
            setWarehouses(warehousesRes.data);
            setProducts(productsRes.data.products || productsRes.data);
            setBins(binsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!recordForm.bin) {
            setBinProducts([]);
            setLiveSystemQty(0);
            return;
        }

        fetchBinProducts(recordForm.bin);
    }, [recordForm.bin]);

    useEffect(() => {
        if (!recordForm.product) {
            setLiveSystemQty(0);
            return;
        }

        const quantity = binProducts
            .filter(item => item.productId?._id === recordForm.product)
            .reduce((total, item) => total + Number(item.quantity || 0), 0);
        setLiveSystemQty(quantity);
    }, [binProducts, recordForm.product]);

    const fetchBinProducts = async (binId) => {
        setIsLoadingBinProducts(true);
        setIsCheckingSystem(true);
        try {
            const { data } = await api.get(`/inventory-locations/locations/${binId}`);
            setBinProducts(data.filter(item => item.productId));
        } catch (error) {
            setBinProducts([]);
            setLiveSystemQty(0);
        } finally {
            setIsLoadingBinProducts(false);
            setIsCheckingSystem(false);
        }
    };

    const uniqueBinProducts = Array.from(
        new Map(binProducts.map(item => [item.productId._id, item.productId])).values()
    );

    const handleStartAudit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/audit', newAuditForm);
            setAudits([data, ...audits]);
            handleOpenSession(data);
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: 'Failed to start audit.',
                buttonText: 'Try again'
            });
        }
    };

    const handleOpenSession = async (audit) => {
        try {
            const { data } = await api.get(`/audit/${audit._id}`);
            setSelectedAudit(data);
            setView('SESSION');
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: 'Failed to load audit session.',
                buttonText: 'Try again'
            });
        }
    };

    const handleRecordCount = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/audit/record-count', {
                auditId: selectedAudit._id,
                binId: recordForm.bin,
                productId: recordForm.product,
                physicalQuantity: Number(recordForm.physicalQuantity)
            });
            setSelectedAudit(data);
            setRecordForm({ bin: '', product: '', physicalQuantity: 0 });
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: 'Count recorded.',
                buttonText: 'Continue'
            });
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: error.response?.data?.message || 'Failed to record count.',
                buttonText: 'Try again'
            });
        }
    };

    const handleCompleteAudit = async (id) => {
        const ok = await showConfirm({
            type: 'warning',
            title: 'Complete audit?',
            message: 'All variances will be finalized.',
            confirmText: 'Complete audit',
            cancelText: 'Cancel'
        });
        if (!ok) return;
        try {
            await api.put(`/audit/${id}/complete`);
            fetchInitialData();
            setView('LIST');
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: 'Audit completed successfully.',
                buttonText: 'Continue'
            });
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: 'Failed to complete audit.',
                buttonText: 'Try again'
            });
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'In-Progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'Cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-slate-900 dark:bg-brand-600 text-white rounded-[32px] shadow-2xl shadow-brand-500/20 animate-pulse-subtle">
                        <ClipboardCheck size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Stock Audit</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-70 flex items-center gap-2">
                           <MapPin size={14} /> Physical Count & Variance Checking
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {view === 'LIST' ? (
                        <button
                            onClick={() => setView('NEW')}
                            className="flex items-center justify-center gap-3 px-10 py-5 bg-brand-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-brand-700 transition-all active:scale-95 shadow-2xl shadow-brand-500/30"
                        >
                            <Plus size={20} strokeWidth={3} />
                            Start Audit Session
                        </button>
                    ) : (
                        <button
                            onClick={() => { setView('LIST'); setSelectedAudit(null); }}
                            className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-brand-600 hover:border-brand-600 transition-all shadow-sm"
                        >
                            <ChevronRight className="rotate-180 inline-block mr-2" size={16} /> Back to Dashboard
                        </button>
                    )}
                </div>
            </div>

            {/* View: Audit List */}
            {view === 'LIST' && (
                <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-10 py-7">Audit ID</th>
                                    <th className="px-8 py-7">Warehouse</th>
                                    <th className="px-8 py-7">Status</th>
                                    <th className="px-8 py-7 text-center">Items</th>
                                    <th className="px-8 py-7">Conducted By</th>
                                    <th className="px-8 py-7">Created On</th>
                                    <th className="px-10 py-7 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {audits.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-10 py-24 text-center">
                                            <Package size={64} className="mx-auto text-slate-100 mb-6" strokeWidth={1} />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active audit sessions</p>
                                        </td>
                                    </tr>
                                ) : audits.map((audit) => (
                                    <tr key={audit._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm group-hover:text-brand-600 transition-colors">{audit.auditNo}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400"><Building size={14} /></div>
                                                <span className="font-bold text-slate-600 dark:text-slate-300">{audit.warehouse?.name || 'Global'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${getStatusStyle(audit.status)}`}>
                                                {audit.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center font-black text-slate-500">{audit.items?.length || 0}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                                                <User size={14} className="opacity-40" />
                                                {audit.createdBy?.username || 'Admin'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs text-slate-400 font-medium">{new Date(audit.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                                        <td className="px-10 py-6 text-right">
                                            <button 
                                                onClick={() => handleOpenSession(audit)} 
                                                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all shadow-sm"
                                            >
                                                Open Session
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View: New Audit Form */}
            {view === 'NEW' && (
                <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-12 duration-500">
                    <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-10">
                        <div className="mb-10 text-center">
                            <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-[32px] flex items-center justify-center text-brand-600 mx-auto mb-6"><Plus size={32} /></div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Audit</h2>
                            <p className="text-slate-500 font-medium italic mt-2 opacity-70 text-sm">Initialize a physical stock check session.</p>
                        </div>
                        <form onSubmit={handleStartAudit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operating Warehouse</label>
                                <select 
                                    required 
                                    value={newAuditForm.warehouseId} 
                                    onChange={(e) => setNewAuditForm({...newAuditForm, warehouseId: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-500/20 rounded-[24px] px-6 py-5 font-bold text-slate-900 dark:text-white shadow-inner outline-none transition-all"
                                >
                                    <option value="">Choose a location...</option>
                                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose / Notes</label>
                                <textarea 
                                    value={newAuditForm.notes} 
                                    onChange={(e) => setNewAuditForm({...newAuditForm, notes: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-500/20 rounded-[24px] px-6 py-5 font-bold text-slate-900 dark:text-white shadow-inner outline-none transition-all h-32 resize-none"
                                    placeholder="Quarterly audit, damaged stock check..."
                                />
                            </div>
                            <button type="submit" className="w-full py-6 bg-slate-900 dark:bg-brand-600 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                                Initialize Audit
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* View: Active Session */}
            {view === 'SESSION' && selectedAudit && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                    {/* LEFT: Counting Form */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-xl p-10 lg:sticky lg:top-8">
                            <div className="flex items-center gap-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600"><Plus size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Count</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Session: {selectedAudit.auditNo}</p>
                                </div>
                            </div>

                            <form onSubmit={handleRecordCount} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bin Location</label>
                                    <select 
                                        required 
                                        value={recordForm.bin} 
                                        onChange={(e) => setRecordForm({...recordForm, bin: e.target.value, product: ''})} 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[20px] px-5 py-4 font-bold text-slate-900 dark:text-white shadow-inner outline-none text-xs"
                                    >
                                        <option value="">Select Bin...</option>
                                        {bins.filter(b => (b.warehouseId?._id || b.warehouseId) === selectedAudit.warehouse?._id).map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product</label>
                                    <select 
                                        required 
                                        value={recordForm.product} 
                                        disabled={!recordForm.bin || isLoadingBinProducts || uniqueBinProducts.length === 0}
                                        onChange={(e) => setRecordForm({...recordForm, product: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[20px] px-5 py-4 font-bold text-slate-900 dark:text-white shadow-inner outline-none text-xs disabled:opacity-50"
                                    >
                                        <option value="">
                                            {!recordForm.bin ? 'Select Bin First...' : isLoadingBinProducts ? 'Loading Products...' : uniqueBinProducts.length === 0 ? 'No Products In This Bin' : 'Select Product...'}
                                        </option>
                                        {uniqueBinProducts.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Live Variance Preview - Matches "Inputs: System Qty, Physical Qty, Difference" */}
                                {(recordForm.bin && recordForm.product) && (
                                    <div className="grid grid-cols-2 gap-4 p-5 bg-slate-900 rounded-[28px] text-white animate-in zoom-in-95 duration-300">
                                        <div className="space-y-1">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">System Qty</label>
                                            <div className="text-xl font-black">{isCheckingSystem ? '...' : liveSystemQty}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Diff</label>
                                            <div className={`text-xl font-black ${Number(recordForm.physicalQuantity) - liveSystemQty < 0 ? 'text-rose-400' : Number(recordForm.physicalQuantity) - liveSystemQty > 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                                                {isCheckingSystem ? '...' : (Number(recordForm.physicalQuantity) - liveSystemQty > 0 ? `+${Number(recordForm.physicalQuantity) - liveSystemQty}` : Number(recordForm.physicalQuantity) - liveSystemQty)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Quantity</label>
                                    <input 
                                        required 
                                        type="number" 
                                        min="0"
                                        value={recordForm.physicalQuantity} 
                                        onChange={(e) => setRecordForm({...recordForm, physicalQuantity: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[20px] px-5 py-5 font-black text-slate-900 dark:text-white shadow-inner outline-none text-2xl text-center"
                                    />
                                </div>
                                <button type="submit" className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
                                    Record Physical Count
                                </button>
                            </form>

                            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    onClick={() => handleCompleteAudit(selectedAudit._id)} 
                                    disabled={selectedAudit.status === 'Completed'}
                                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
                                >
                                    Finalize Session
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Audit Report (Variance Checking) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Reports Section: Missing stock, Overstock, Audit variance */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Missing Stock</div>
                                <div className="flex items-end justify-between">
                                    <div className="text-3xl font-black text-rose-600">-{selectedAudit.items?.filter(i => i.status === 'Missing').reduce((acc, i) => acc + Math.abs(i.difference), 0) || 0}</div>
                                    <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase">{selectedAudit.items?.filter(i => i.status === 'Missing').length} Items</div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Overstock</div>
                                <div className="flex items-end justify-between">
                                    <div className="text-3xl font-black text-blue-600">+{selectedAudit.items?.filter(i => i.status === 'Overstock').reduce((acc, i) => acc + i.difference, 0) || 0}</div>
                                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">{selectedAudit.items?.filter(i => i.status === 'Overstock').length} Items</div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Audit Variance</div>
                                <div className="flex items-end justify-between">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{(selectedAudit.items?.filter(i => i.status !== 'Matched').length / (selectedAudit.items?.length || 1) * 100).toFixed(1)}%</div>
                                    <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">Net Error</div>
                                </div>
                            </div>
                        </div>

                        {/* Variance Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                    <BarChart3 size={20} className="text-brand-600" /> Variance Audit Log
                                </h3>
                                <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-brand-600 shadow-sm"><Save size={18} /></button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-10 py-6">Product</th>
                                            <th className="px-6 py-6">Bin Location</th>
                                            <th className="px-6 py-6 text-center">System</th>
                                            <th className="px-6 py-6 text-center">Physical</th>
                                            <th className="px-6 py-6 text-center">Variance</th>
                                            <th className="px-10 py-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedAudit.items?.length === 0 ? (
                                            <tr><td colSpan="6" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No items recorded yet</td></tr>
                                        ) : selectedAudit.items?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                                <td className="px-10 py-6">
                                                    <div className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xs">{item.product?.name}</div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                        <MapPin size={12} className="opacity-40" />
                                                        {item.bin?.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center font-bold text-slate-400">{item.systemQuantity}</td>
                                                <td className="px-6 py-6 text-center font-black text-slate-900 dark:text-white">{item.physicalQuantity}</td>
                                                <td className={`px-6 py-6 text-center font-black ${item.difference < 0 ? 'text-rose-500' : item.difference > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                                                    <span className="text-sm">{item.difference > 0 ? `+${item.difference}` : item.difference}</span>
                                                </td>
                                                <td className="px-10 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                                                        item.status === 'Matched' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                        item.status === 'Missing' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                                                        'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockAudit;
