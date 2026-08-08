import React, { useState, useEffect } from 'react';
import { 
    Move, History, Search, MapPin, Package, 
    CheckCircle2, ArrowRightLeft, Building2, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const StockMovement = () => {
    const { showAlert } = useAlert();
    const [view, setView] = useState('FORM'); // 'FORM' or 'HISTORY'
    const [warehouses, setWarehouses] = useState([]);
    const [bins, setBins] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [binStock, setBinStock] = useState([]); // Stock for selected source bin
    const [movements, setMovements] = useState([]); // History table data
    const [loading, setLoading] = useState(false);

    // Form State exactly matching user specs
    const [form, setForm] = useState({
        fromBin: '',
        product: '', // Actually stores the stock item reference to get batch/qty
        toBin: '',
        quantity: 1,
        reason: 'Restocking'
    });

    useEffect(() => {
        fetchWarehouses();
        fetchMovements();
    }, []);

    useEffect(() => {
        if (selectedWarehouseId) {
            fetchBins();
            setForm({ fromBin: '', product: '', toBin: '', quantity: 1, reason: 'Restocking' });
            setBinStock([]);
        }
    }, [selectedWarehouseId]);

    const fetchWarehouses = async () => {
        try {
            const { data } = await api.get('/warehouses');
            setWarehouses(data);
            if (data.length > 0) setSelectedWarehouseId(data[0]._id);
        } catch (error) {}
    };

    const fetchBins = async () => {
        try {
            const { data } = await api.get('/locations?type=Bin');
            setBins(data.filter(b => b.warehouseId === selectedWarehouseId));
        } catch (error) {}
    };

    const getLocationLabel = (location, locationsById) => {
        if (!location) return '';
        if (typeof location === 'string') return locationsById[location] || location;
        return location.name || location.barcode || locationsById[location._id] || location._id || '';
    };

    const extractOtherLocationId = (reason) => {
        return reason?.match(/Bin\s+([a-f\d]{24})/i)?.[1] || '';
    };

    const buildTransferRows = (transactions) => {
        const locationsById = bins.reduce((acc, bin) => {
            acc[bin._id] = bin.name || bin.barcode || bin._id;
            return acc;
        }, {});
        const transferLogs = transactions
            .filter(item => item.type === 'Transfer')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        const used = new Set();

        return transferLogs.reduce((rows, item, index) => {
            if (used.has(item._id)) return rows;

            const qty = Math.abs(Number(item.quantityChange || 0));
            const itemLocationId = item.locationId?._id || item.locationId || '';
            const otherLocationId = extractOtherLocationId(item.reason);
            const isOutgoing = Number(item.quantityChange || 0) < 0;

            const pairIndex = transferLogs.findIndex((candidate, candidateIndex) => {
                if (candidateIndex === index || used.has(candidate._id)) return false;
                const candidateQty = Math.abs(Number(candidate.quantityChange || 0));
                const candidateLocationId = candidate.locationId?._id || candidate.locationId || '';
                const candidateOtherLocationId = extractOtherLocationId(candidate.reason);
                const secondsApart = Math.abs(new Date(candidate.date) - new Date(item.date)) <= 5000;

                return (
                    candidate.product === item.product &&
                    candidateQty === qty &&
                    Number(candidate.quantityChange || 0) === -Number(item.quantityChange || 0) &&
                    candidate.performedBy === item.performedBy &&
                    secondsApart &&
                    (
                        (otherLocationId && candidateLocationId === otherLocationId) ||
                        (candidateOtherLocationId && itemLocationId === candidateOtherLocationId)
                    )
                );
            });

            const pair = pairIndex >= 0 ? transferLogs[pairIndex] : null;
            if (pair) used.add(pair._id);
            used.add(item._id);

            const outgoing = isOutgoing ? item : pair;
            const incoming = isOutgoing ? pair : item;

            rows.push({
                id: item._id,
                product: item.productName,
                from: getLocationLabel(outgoing?.locationId, locationsById) || locationsById[extractOtherLocationId(incoming?.reason)] || 'Source Bin',
                to: getLocationLabel(incoming?.locationId, locationsById) || locationsById[extractOtherLocationId(outgoing?.reason)] || 'Destination Bin',
                qty,
                movedBy: item.performedBy || item.userId?.name || item.userId?.username || 'System',
                date: item.date,
                reason: item.reason
            });

            return rows;
        }, []);
    };

    const fetchMovements = async () => {
        try {
            const { data } = await api.get('/history?limit=1000');
            setMovements(buildTransferRows(data.history || []));
        } catch (error) {
            console.error('Failed to fetch stock movements:', error);
            setMovements([]);
        }
    };

    const fetchBinStock = async (binId) => {
        if (!binId) {
            setBinStock([]);
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(`/inventory-locations/locations/${binId}`);
            setBinStock(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSourceChange = (e) => {
        const binId = e.target.value;
        setForm({ ...form, fromBin: binId, product: '' });
        fetchBinStock(binId);
    };

    const handleMoveSubmit = async (e) => {
        e.preventDefault();
        
        if (form.fromBin === form.toBin) {
            showAlert({
                type: 'warning',
                title: 'Check bins',
                message: 'Source and destination bins cannot be the same.',
                buttonText: 'Review'
            });
            return;
        }

        const selectedStockItem = binStock.find(item => item.productId._id === form.product);
        if (!selectedStockItem) return;

        if (form.quantity > selectedStockItem.quantity) {
            showAlert({
                type: 'warning',
                title: 'Quantity unavailable',
                message: 'Cannot move more than available in the source bin.',
                buttonText: 'Review'
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/inventory-locations/bin-transfer', {
                warehouseId: selectedWarehouseId,
                productId: selectedStockItem.productId._id,
                fromLocationId: form.fromBin,
                toLocationId: form.toBin,
                quantity: Number(form.quantity),
                batchNumber: selectedStockItem.batchNumber,
                reason: form.reason // Pass reason if backend supports it in the future
            });
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: 'Stock moved successfully.',
                buttonText: 'Continue'
            });
            setForm({ fromBin: '', product: '', toBin: '', quantity: 1, reason: 'Restocking' });
            setBinStock([]);
            await fetchMovements();
            setView('HISTORY');
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: error.response?.data?.message || 'Transfer failed.',
                buttonText: 'Try again'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4 uppercase">
                        <ArrowRightLeft className="text-brand-600" size={32} strokeWidth={3} />
                        Stock Movement
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic opacity-70">Relocate inventory physically between bins.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <button 
                    onClick={() => setView('FORM')}
                    className={`px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${view === 'FORM' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Move size={14} /> Movement Form
                </button>
                <button 
                    onClick={() => setView('HISTORY')}
                    className={`px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${view === 'HISTORY' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <History size={14} /> Movement History
                </button>
            </div>

            {view === 'FORM' ? (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-8 animate-in fade-in">
                    <form onSubmit={handleMoveSubmit} className="space-y-8">
                        <div className="pb-8 border-b border-slate-100 dark:border-slate-800">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operating Warehouse</label>
                            <select 
                                value={selectedWarehouseId}
                                onChange={e => setSelectedWarehouseId(e.target.value)}
                                className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-l-4 border-brand-500 pl-3">Source & Product</h3>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">From Bin</label>
                                    <select required value={form.fromBin} onChange={handleSourceChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-inner">
                                        <option value="">Select Source Bin...</option>
                                        {bins.map(b => <option key={b._id} value={b._id}>{b.name} ({b.barcode || 'No Barcode'})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Product</label>
                                    <select required value={form.product} onChange={e => setForm({...form, product: e.target.value})} disabled={!form.fromBin || loading} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-inner disabled:opacity-50">
                                        <option value="">{loading ? 'Loading...' : 'Select Product...'}</option>
                                        {binStock.map(item => (
                                            <option key={item.productId._id} value={item.productId._id}>
                                                {item.productId.name} (Avail: {item.quantity} | Batch: {item.batchNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-l-4 border-brand-500 pl-3">Destination & Details</h3>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">To Bin</label>
                                    <select required value={form.toBin} onChange={e => setForm({...form, toBin: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-inner">
                                        <option value="">Select Destination Bin...</option>
                                        {bins.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Quantity</label>
                                        <input required type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-inner text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reason</label>
                                        <select required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-inner">
                                            <option value="Restocking">Restocking</option>
                                            <option value="Consolidation">Consolidation</option>
                                            <option value="Picking prep">Picking Prep</option>
                                            <option value="Damage segregation">Damage Segregation</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button type="submit" disabled={loading} className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-500/30 transition-all disabled:opacity-50">
                                {loading ? 'Moving Stock...' : 'Execute Stock Movement'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-5">Product</th>
                                    <th className="px-4 py-5">From</th>
                                    <th className="px-4 py-5">To</th>
                                    <th className="px-4 py-5 text-center">Qty</th>
                                    <th className="px-4 py-5">Moved By</th>
                                    <th className="px-6 py-5">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {movements.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.product}</td>
                                        <td className="px-4 py-4 text-rose-500 dark:text-rose-400 font-bold text-sm"><div className="flex items-center gap-1"><MapPin size={14}/> {item.from}</div></td>
                                        <td className="px-4 py-4 text-emerald-500 dark:text-emerald-400 font-bold text-sm"><div className="flex items-center gap-1"><MapPin size={14}/> {item.to}</div></td>
                                        <td className="px-4 py-4 text-center font-black text-slate-900 dark:text-white">{item.qty}</td>
                                        <td className="px-4 py-4 text-sm text-slate-500 font-medium">{item.movedBy}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.date).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockMovement;
