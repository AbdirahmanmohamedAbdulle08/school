import React, { useState, useEffect } from 'react';
import { 
    Package, ShoppingBag, Search, ChevronRight, 
    CheckCircle2, MapPin, ArrowRight, Camera, X, Building2, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import QRScanner from '../components/QRScanner';
import { useAlert } from '../components/common/alerts/useAlert';

const PickingOperations = () => {
    const { showAlert } = useAlert();
    const [view, setView] = useState('LIST'); // 'LIST', 'PICK'
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Picking State
    const [pickingItem, setPickingItem] = useState(null); 
    const [suggestedBins, setSuggestedBins] = useState([]);
    const [isFetchingBins, setIsFetchingBins] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sales?limit=1000'); 
            setOrders((data.sales || data).filter(s => s.status === 'Pending')); 
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPick = (order) => {
        setSelectedOrder(order);
        setView('PICK');
    };

    const handleSelectProduct = async (product) => {
        setPickingItem(product);
        setIsFetchingBins(true);
        try {
            const { data } = await api.get(`/picking/suggest-bins/${product.product}?warehouseId=${selectedOrder.warehouseId}`);
            setSuggestedBins(data);
        } catch (error) {
            console.error('Failed to fetch bins', error);
        } finally {
            setIsFetchingBins(false);
        }
    };

    const handleQRScan = (decodedText) => {
        setIsScannerOpen(false);
        const bin = suggestedBins.find(b => b.locationId.barcode === decodedText);
        if (bin) {
            handleConfirmPick(bin, pickingItem.quantity - (pickingItem.pickedQuantity || 0));
        } else {
            showAlert({
                type: 'warning',
                title: 'Bin mismatch',
                message: `This bin does not contain the required item or barcode is incorrect: ${decodedText}`,
                buttonText: 'Review'
            });
        }
    };

    const handleConfirmPick = async (bin, qty) => {
        try {
            await api.post('/picking/record-pick', {
                saleId: selectedOrder._id,
                productId: pickingItem.product,
                locationId: bin.locationId._id,
                quantity: qty,
                warehouseId: selectedOrder.warehouseId
            });
            
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: 'Item picked successfully.',
                buttonText: 'Continue'
            });
            setPickingItem(null);
            setSuggestedBins([]);
            
            const { data } = await api.get(`/sales/${selectedOrder._id}`);
            setSelectedOrder(data);
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: 'Failed to record pick.',
                buttonText: 'Try again'
            });
        }
    };

    const handlePackingConfirmation = async () => {
        // Feature: Packing confirmation (Moves status to Packed immediately from Pick screen if they want)
        try {
            await api.post(`/sales/${selectedOrder._id}/pack`);
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: 'Order successfully verified and marked as Packed.',
                buttonText: 'Continue'
            });
            setView('LIST');
            fetchOrders();
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: 'Failed to confirm packing.',
                buttonText: 'Try again'
            });
        }
    };

    const filteredOrders = orders.filter(o => 
        (o.invoiceNo || o._id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customerName || '')?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (view === 'PICK') {
        // Calculate if order is fully picked
        const isFullyPicked = selectedOrder.items.every(item => (item.pickedQuantity || 0) >= item.quantity);

        return (
            <div className="p-8 max-w-7xl mx-auto animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setView('LIST')}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-brand-600 transition-all shadow-sm"
                        >
                            <ChevronRight className="rotate-180" size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Picking: {selectedOrder.invoiceNo || selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}</h1>
                            <p className="text-slate-500 mt-1 font-medium italic opacity-70">Fulfill the pick list below.</p>
                        </div>
                    </div>
                    {isFullyPicked && (
                        <button onClick={handlePackingConfirmation} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-xs uppercase shadow-xl shadow-brand-500/30 flex items-center gap-2">
                            <CheckCircle2 size={18} /> Confirm Packing
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Pick List Table */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-fit">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-5">Product</th>
                                        <th className="px-4 py-5">Bin Location</th>
                                        <th className="px-4 py-5 text-center">Required Qty</th>
                                        <th className="px-4 py-5 text-center">Picked Qty</th>
                                        <th className="px-4 py-5">Picker</th>
                                        <th className="px-6 py-5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {selectedOrder.items.map((item, idx) => {
                                        const isDone = (item.pickedQuantity || 0) >= item.quantity;
                                        return (
                                            <tr key={idx} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isDone ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                                                <td className="px-6 py-6 font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {item.productName}
                                                </td>
                                                <td className="px-4 py-6 text-slate-500 font-medium text-sm">
                                                    {isDone ? 'Resolved' : 'TBD (Select)'}
                                                </td>
                                                <td className="px-4 py-6 text-center font-black text-slate-900 dark:text-white">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-6 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {item.pickedQuantity || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-6 text-sm text-slate-500 font-medium">
                                                    {isDone ? 'Current User' : '-'}
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    {!isDone ? (
                                                        <button 
                                                            onClick={() => handleSelectProduct(item)}
                                                            className="px-4 py-2 bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-200 transition-colors"
                                                        >
                                                            Find Bins
                                                        </button>
                                                    ) : (
                                                        <CheckCircle2 className="text-emerald-500 ml-auto" size={24} />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Picking Detail / Suggestions */}
                    <div className={`${pickingItem ? 'fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0 flex items-end lg:items-start lg:block' : 'hidden lg:block'} lg:col-span-1`}>
                        {pickingItem && (
                            <div className="bg-white dark:bg-slate-900 rounded-t-[40px] lg:rounded-[32px] border-t-4 border-brand-500 lg:border-2 lg:border-brand-500/20 shadow-2xl p-8 lg:sticky lg:top-8 animate-in slide-in-from-bottom-8 duration-300 w-full h-[80vh] lg:h-auto overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pick Options</h3>
                                    <button onClick={() => setPickingItem(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={28} /></button>
                                </div>

                                <div className="p-4 bg-slate-900 text-white rounded-2xl mb-8 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand-400"><Package size={20} /></div>
                                    <div className="text-sm font-black uppercase truncate flex-1">{pickingItem.productName}</div>
                                    <div className="text-xs font-black text-brand-500">{pickingItem.quantity - (pickingItem.pickedQuantity || 0)} REQ</div>
                                </div>

                                {isFetchingBins ? (
                                    <div className="py-12 flex justify-center"><div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
                                ) : suggestedBins.length === 0 ? (
                                    <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-center">
                                        <AlertCircle className="text-amber-500 mx-auto mb-3" size={32} />
                                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">No stock found in any bins for this warehouse!</p>
                                        <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-2 font-medium">Please receive new inventory or transfer stock to this branch to fulfill the order.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {suggestedBins.map((bin, idx) => (
                                            <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="text-brand-500" size={18} />
                                                        <span className="font-black text-slate-900 dark:text-white uppercase">{bin.locationId.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-500 mb-6 font-bold">
                                                    <span>Available: <span className="text-slate-900 dark:text-white">{bin.quantity}</span></span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleConfirmPick(bin, pickingItem.quantity - (pickingItem.pickedQuantity || 0))}
                                                        className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 size={14}/> Confirm Pick
                                                    </button>
                                                    <button 
                                                        onClick={() => { setIsScannerOpen(true); }}
                                                        className="p-4 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/30 hover:scale-105 transition-all"
                                                        title="Scan Item Barcode"
                                                    >
                                                        <Camera size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {!pickingItem && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center h-full flex flex-col items-center justify-center text-slate-400">
                                <ShoppingBag size={64} className="opacity-10 mb-4" />
                                <p className="font-bold text-sm">Select an item from the Pick List to see bin locations.</p>
                            </div>
                        )}
                    </div>
                </div>

                {isScannerOpen && (
                    <QRScanner 
                        onScan={handleQRScan} 
                        onClose={() => setIsScannerOpen(false)} 
                        title="Scan Item Barcode"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-4">
                        <ShoppingBag className="text-brand-600" size={32} strokeWidth={3} />
                        Picking Operations
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic opacity-70">Pick items to fulfill pending sales orders.</p>
                </div>

                <div className="relative group flex-1 max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search Order No or Client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-brand-500/5 shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100">
                    <CheckCircle2 size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-black text-slate-900 uppercase">No Pending Orders</h3>
                    <p className="text-slate-500">All orders have been picked.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map(order => (
                        <div key={order._id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all group">
                            <div className="mb-4">
                                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Order No</h4>
                                <p className="text-xl font-black text-slate-900 uppercase">{order.invoiceNo || order._id.substring(order._id.length - 8).toUpperCase()}</p>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-slate-600"><Building2 size={16} /><span className="font-bold truncate">{order.customerName || 'Walk-in'}</span></div>
                                <div className="flex items-center gap-3 text-slate-600"><Package size={16} /><span>{order.items.length} Items</span></div>
                            </div>
                            <button 
                                onClick={() => handleStartPick(order)}
                                className="w-full py-3 bg-brand-50 text-brand-700 rounded-xl font-black text-xs uppercase hover:bg-brand-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                Open Pick List <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PickingOperations;
