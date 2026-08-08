import React, { useState, useEffect } from 'react';
import { 
    Package, ArrowDownLeft, Search, Filter, ChevronRight, 
    CheckCircle2, Clock, Building2, MapPin, ArrowRight, Camera, Printer, Save, History, Barcode as BarcodeIcon, FileText, Plus
} from 'lucide-react';
import api from '../services/api';
import QRScanner from '../components/QRScanner';
import { useAlert } from '../components/common/alerts/useAlert';

const ReceivingOperations = () => {
    const { showAlert, showConfirm } = useAlert();
    const [view, setView] = useState('LIST'); // 'LIST', 'RECEIVE', 'HISTORY'
    const [purchases, setPurchases] = useState([]);
    const [receivedItems, setReceivedItems] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Receiving Form State
    const [isManual, setIsManual] = useState(false);
    const [formData, setFormData] = useState({
        purchaseId: '',
        purchaseOrder: '',
        vendor: '',
        warehouse: 'Main Store',
        status: 'Completed'
    });
    const [receiveItems, setReceiveItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [zones, setZones] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [activeScanRow, setActiveScanRow] = useState(null);

    const getLocationPath = (loc, list) => {
        let path = loc.name;
        let current = loc;
        while (current && current.parentId) {
            const parent = list.find(l => l._id === current.parentId);
            if (parent) {
                path = `${parent.name} → ${path}`;
                current = parent;
            } else {
                break;
            }
        }
        return path;
    };

    const isChildOfZone = (loc, zoneId, list) => {
        if (!zoneId) return true;
        let current = loc;
        while (current && current.parentId) {
            if (current.parentId === zoneId) return true;
            current = list.find(l => l._id === current.parentId);
        }
        return false;
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [purchasesRes, locationsRes, productsRes, historyRes, vendorsRes, warehousesRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/locations?all=true'),
                api.get('/products'),
                api.get('/history'),
                api.get('/vendors'),
                api.get('/warehouses?all=true')
            ]);
            
            const allPurchases = purchasesRes.data.purchases || purchasesRes.data;
            setPurchases(allPurchases);
            
            setAllLocations(locationsRes.data);
            setLocations(locationsRes.data.filter(l => l.type === 'Bin'));
            setZones(locationsRes.data.filter(l => l.type === 'Zone'));
            setProducts(productsRes.data.products || productsRes.data);
            setVendors(vendorsRes.data.vendors || vendorsRes.data);
            setWarehouses(warehousesRes.data.warehouses || warehousesRes.data);

            // Fetch and parse actual received history
            const transactions = historyRes.data.history || [];
            const received = transactions.filter(h => h.type === 'Received');
            
            setReceivedItems(received.map(h => ({
                id: h._id,
                product: h.productName,
                qty: h.quantityChange,
                bin: h.locationId?.name || 'Unassigned',
                batch: h.reason?.match(/Batch:?\s*([^\s,)]+)/)?.[1] || 'N/A',
                status: 'Completed',
                receivedBy: h.performedBy || 'System',
                date: h.createdAt || h.date
            })));
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartReceive = (purchase) => {
        setIsManual(false);
        setFormData({
            purchaseId: purchase._id,
            purchaseOrder: purchase.poNumber || purchase.invoiceNo,
            vendor: purchase.supplier,
            warehouse: purchase.warehouseId?._id || purchase.warehouseId || '',
            status: 'Completed'
        });
        
        const items = purchase.items.map(item => ({
            product: item.product,
            productName: item.productName,
            quantity: item.quantity,
            receivedQty: item.quantity,
            zoneId: '',
            locationId: '',
            batchNumber: '',
            expiryDate: '',
            receivingDate: new Date().toISOString().split('T')[0],
            condition: 'Good'
        }));
        setReceiveItems(items);
        setView('RECEIVE');
    };

    const handleMarkCompleted = async (purchaseId) => {
        const ok = await showConfirm({
            type: 'warning',
            title: 'Mark completed?',
            message: 'Mark this order as Completed?',
            confirmText: 'Mark completed',
            cancelText: 'Cancel'
        });
        if (!ok) return;
        try {
            await api.patch(`/purchases/${purchaseId}/status`, { status: 'Completed' });
            fetchInitialData();
        } catch (err) {
            console.error('Failed to update status', err);
            showAlert({
                type: 'error',
                title: 'Status update failed',
                message: err.response?.data?.message || 'The order could not be marked as completed. Please try again.',
                buttonText: 'Try again'
            });
        }
    };

    const handleManualReceive = () => {
        setIsManual(true);
        setFormData({
            purchaseId: 'manual',
            purchaseOrder: `MAN-${Date.now().toString().slice(-6)}`,
            vendor: '',
            warehouse: warehouses[0]?._id || '',
            status: 'Completed'
        });
        setReceiveItems([{
            product: '',
            productName: '',
            quantity: 1,
            receivedQty: 1,
            zoneId: '',
            locationId: '',
            batchNumber: '',
            expiryDate: '',
            receivingDate: new Date().toISOString().split('T')[0],
            condition: 'Good'
        }]);
        setView('RECEIVE');
    };

    const addManualItem = () => {
        setReceiveItems([...receiveItems, {
            product: '',
            productName: '',
            quantity: 1,
            receivedQty: 1,
            zoneId: '',
            locationId: '',
            batchNumber: '',
            expiryDate: '',
            receivingDate: new Date().toISOString().split('T')[0],
            condition: 'Good'
        }]);
    };

    const handleQRScan = (decodedText) => {
        setIsScannerOpen(false);
        const bin = locations.find(l => l.barcode === decodedText);
        if (bin) {
            const newItems = [...receiveItems];
            newItems[activeScanRow].locationId = bin._id;
            setReceiveItems(newItems);
            setFormData(prev => ({ ...prev, warehouse: bin.warehouseId }));
            setActiveScanRow(null);
        } else {
            showAlert({
                type: 'warning',
                title: 'Bin not found',
                message: `No receiving bin matches the scanned barcode: ${decodedText}`,
                buttonText: 'Review'
            });
        }
    };

    const handleReceiveSubmit = async (e) => {
        e.preventDefault();
        if (receiveItems.some(item => !item.locationId || !item.product)) {
            showAlert({
                type: 'warning',
                title: 'Missing Receiving Details',
                message: 'Please choose a product and assign a bin for every receiving line before submitting.',
                buttonText: 'Review'
            });
            return;
        }

        try {
            const payload = {
                items: receiveItems.map(item => ({
                    productId: item.product,
                    productName: item.productName,
                    receivedQty: Number(item.receivedQty),
                    locationId: item.locationId,
                    batchNumber: item.batchNumber?.trim() || '',
                    expiryDate: item.expiryDate || null
                })),
                warehouseId: formData.warehouse,
                vendor: formData.vendor,
                purchaseOrder: formData.purchaseOrder,
                status: formData.status
            };

            await api.post(`/purchases/${formData.purchaseId}/receive`, payload);

            setView('LIST');
            fetchInitialData();
            showAlert({
                type: 'success',
                title: 'Stock Received Successfully',
                message: `Inventory quantities and receiving history were updated. ${receiveItems.length} line${receiveItems.length === 1 ? '' : 's'} processed for ${formData.purchaseOrder}.`,
                buttonText: 'Continue'
            });
        } catch (error) {
            console.error('Failed to process receiving', error);
            showAlert({
                type: 'error',
                title: 'Receiving Failed',
                message: error.response?.data?.message || error.response?.data?.error || 'The receiving operation could not be completed.',
                buttonText: 'Try again'
            });
        }
    };

    // ==========================================
    // VIEW: RECEIVE FORM
    // ==========================================
    if (view === 'RECEIVE') {
        return (
            <>
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
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Receive Stock Form</h1>
                            <p className="text-slate-500 mt-1 font-medium italic opacity-70">
                                {isManual ? 'Manual Inventory Intake' : `Processing PO: ${formData.purchaseOrder}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { setActiveScanRow(0); setIsScannerOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                            <BarcodeIcon size={16} /> Scan Barcode
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50">
                            <Printer size={16} /> Print Receipt
                        </button>
                    </div>
                </div>

                {/* Form Inputs Header: Purchase Order, Vendor, Warehouse, Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Purchase Order</label>
                        <input 
                            type="text"
                            value={formData.purchaseOrder}
                            onChange={(e) => setFormData({...formData, purchaseOrder: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            placeholder="Enter PO #"
                        />
                    </div>
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor</label>
                        {isManual ? (
                            <select 
                                required
                                value={formData.vendor}
                                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 shadow-inner outline-none appearance-none cursor-pointer"
                            >
                                <option value="">Select Vendor...</option>
                                {vendors.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
                            </select>
                        ) : (
                            <input 
                                type="text"
                                disabled
                                value={formData.vendor}
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            />
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Warehouse</label>
                        <select
                            required
                            value={formData.warehouse}
                            onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 shadow-inner outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Select Warehouse...</option>
                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                        <select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 shadow-inner outline-none appearance-none cursor-pointer"
                        >
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden mb-12">
                    <form onSubmit={handleReceiveSubmit}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-5">Product</th>
                                        <th className="px-4 py-5 text-center">Quantity</th>
                                        <th className="px-4 py-5">Zone & Bin</th>
                                        <th className="px-4 py-5">Batch & Expiry</th>
                                        <th className="px-4 py-5">Rec. Date & Cond.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {receiveItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-6 min-w-[200px]">
                                                {isManual ? (
                                                    <select 
                                                        required
                                                        value={item.product}
                                                        onChange={(e) => {
                                                            const p = products.find(prod => prod._id === e.target.value);
                                                            const newItems = [...receiveItems];
                                                            newItems[index].product = e.target.value;
                                                            newItems[index].productName = p?.name;
                                                            setReceiveItems(newItems);
                                                        }}
                                                        className="w-full px-3 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-black uppercase dark:text-white shadow-inner"
                                                    >
                                                        <option value="">Select Product...</option>
                                                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{item.productName}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <input 
                                                    type="number"
                                                    value={item.receivedQty}
                                                    onChange={(e) => {
                                                        const newItems = [...receiveItems];
                                                        newItems[index].receivedQty = Number(e.target.value);
                                                        setReceiveItems(newItems);
                                                    }}
                                                    className="w-24 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-3 text-sm font-black dark:text-white text-center shadow-inner focus:ring-2 focus:ring-brand-500"
                                                />
                                            </td>
                                            <td className="px-4 py-6 space-y-2 min-w-[180px]">
                                                <select 
                                                    value={item.zoneId}
                                                    onChange={(e) => {
                                                        const selectedZone = zones.find(z => z._id === e.target.value);
                                                        const newItems = [...receiveItems];
                                                        newItems[index].zoneId = e.target.value;
                                                        newItems[index].locationId = '';
                                                        setReceiveItems(newItems);
                                                        if (selectedZone?.warehouseId) {
                                                            setFormData(prev => ({ ...prev, warehouse: selectedZone.warehouseId }));
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase dark:text-white shadow-sm"
                                                >
                                                    <option value="">Select Zone...</option>
                                                    {zones.map(z => {
                                                        const warehouse = warehouses.find(w => w._id === z.warehouseId);
                                                        return (
                                                            <option key={z._id} value={z._id}>
                                                                {z.name}{warehouse ? ` - ${warehouse.name}` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <select 
                                                    required
                                                    value={item.locationId}
                                                    onChange={(e) => {
                                                        const selectedBin = locations.find(l => l._id === e.target.value);
                                                        const newItems = [...receiveItems];
                                                        newItems[index].locationId = e.target.value;
                                                        setReceiveItems(newItems);
                                                        if (selectedBin?.warehouseId) {
                                                            setFormData(prev => ({ ...prev, warehouse: selectedBin.warehouseId }));
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase dark:text-white shadow-sm"
                                                >
                                                    <option value="">Select Bin...</option>
                                                    {locations
                                                        .filter(l => isChildOfZone(l, item.zoneId, allLocations))
                                                        .map(loc => (
                                                            <option key={loc._id} value={loc._id}>
                                                                {getLocationPath(loc, allLocations)}
                                                            </option>
                                                        ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-6 space-y-2">
                                                <input 
                                                    placeholder="Batch Number"
                                                    required
                                                    value={item.batchNumber}
                                                    onChange={(e) => {
                                                        const newItems = [...receiveItems];
                                                        newItems[index].batchNumber = e.target.value;
                                                        setReceiveItems(newItems);
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[11px] font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                                />
                                                <input 
                                                    type="date"
                                                    value={item.expiryDate}
                                                    onChange={(e) => {
                                                        const newItems = [...receiveItems];
                                                        newItems[index].expiryDate = e.target.value;
                                                        setReceiveItems(newItems);
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[11px] font-bold dark:text-white outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-6 space-y-2">
                                                <input 
                                                    type="date"
                                                    value={item.receivingDate}
                                                    onChange={(e) => {
                                                        const newItems = [...receiveItems];
                                                        newItems[index].receivingDate = e.target.value;
                                                        setReceiveItems(newItems);
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[11px] font-bold dark:text-white outline-none"
                                                />
                                                <select 
                                                    value={item.condition}
                                                    onChange={(e) => {
                                                        const newItems = [...receiveItems];
                                                        newItems[index].condition = e.target.value;
                                                        setReceiveItems(newItems);
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase dark:text-white shadow-sm"
                                                >
                                                    <option value="Good">Good</option>
                                                    <option value="Damaged">Damaged</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                            {isManual && (
                                <button type="button" onClick={addManualItem} className="text-brand-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline">
                                    <Plus size={16} /> Add Product Line
                                </button>
                            )}
                            <div className="flex gap-4 ml-auto">
                                <button 
                                    type="button"
                                    onClick={() => setView('LIST')}
                                    className="px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-brand-500/30 active:scale-95"
                                >
                                    <CheckCircle2 size={18} /> Receive
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {isScannerOpen && (
                    <QRScanner onScan={handleQRScan} onClose={() => setIsScannerOpen(false)} title="Scan Bin QR Code" />
                )}
            </div>
            </>
        );
    }

    // ==========================================
    // VIEW: HISTORY (Received Items Table)
    // ==========================================
    if (view === 'HISTORY') {
        return (
            <>
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
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Received Items Table</h1>
                            <p className="text-slate-500 mt-1 font-medium italic opacity-70">Log of all confirmed inventory arrivals.</p>
                        </div>
                    </div>
                    <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 shadow-sm"><Printer size={20} /></button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5">Product</th>
                                    <th className="px-4 py-5 text-center">Qty</th>
                                    <th className="px-4 py-5">Bin</th>
                                    <th className="px-4 py-5">Batch</th>
                                    <th className="px-4 py-5">Status</th>
                                    <th className="px-4 py-5 text-right">Received By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {receivedItems.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-6 font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{item.product}</td>
                                        <td className="px-4 py-6 text-center font-black text-slate-900 dark:text-white">{item.qty}</td>
                                        <td className="px-4 py-6 font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">{item.bin}</td>
                                        <td className="px-4 py-6 font-mono text-xs text-slate-500">{item.batch}</td>
                                        <td className="px-4 py-6">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">{item.status}</span>
                                        </td>
                                        <td className="px-4 py-6 text-right text-xs text-slate-500 font-bold uppercase">{item.receivedBy}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </>
        );
    }

    // ==========================================
    // VIEW: LIST (Pending Purchases)
    // ==========================================
    return (
        <>
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-brand-600 text-white rounded-[24px] shadow-xl shadow-brand-500/20">
                        <ArrowDownLeft size={32} strokeWidth={4} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Receiving Operations</h1>
                        <p className="text-slate-500 mt-2 font-medium italic opacity-70">Confirm and bin incoming inventory.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search PO or Vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-brand-500/5 transition-all text-sm font-medium"
                        />
                    </div>
                    <button 
                        onClick={handleManualReceive}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl"
                    >
                        <Plus size={18} strokeWidth={3} />
                        New Receipt
                    </button>
                    <button 
                        onClick={() => setView('HISTORY')}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-brand-600 shadow-sm transition-all"
                        title="View Received Log"
                    >
                        <History size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-xl"></div></div>
            ) : purchases.filter(p => (p.poNumber || p.invoiceNo)?.toLowerCase().includes(searchTerm.toLowerCase()) || p.supplier?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[44px] border border-slate-100 shadow-sm">
                    <Package size={64} className="mx-auto text-slate-100 dark:text-slate-800 mb-6" strokeWidth={1} />
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Pending Orders</h3>
                    <p className="text-slate-500 font-medium mb-8">All purchase orders are fully received.</p>
                    <button 
                        onClick={handleManualReceive}
                        className="inline-flex items-center gap-3 px-10 py-5 bg-brand-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-700 shadow-2xl shadow-brand-500/30 transition-all active:scale-95"
                    >
                        <Plus size={20} strokeWidth={3} /> Start Manual Receipt
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {purchases.filter(p => (p.poNumber || p.invoiceNo)?.toLowerCase().includes(searchTerm.toLowerCase()) || p.supplier?.toLowerCase().includes(searchTerm.toLowerCase())).map(purchase => (
                        <div key={purchase._id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl hover:border-brand-500/20 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                                {purchase.status === 'Completed' || purchase.status === 'Received' ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        <CheckCircle2 size={11} /> {purchase.status}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        <Clock size={11} /> {purchase.status}
                                    </span>
                                )}
                            </div>
                            <div className="mb-6 mt-2">
                                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">PO Number</h4>
                                <p className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tight">{purchase.poNumber || purchase.invoiceNo}</p>
                            </div>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-bold text-sm">
                                    <Building2 size={16} className="text-slate-300" />
                                    <span className="truncate">{purchase.supplier}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-bold text-sm">
                                    <Package size={16} className="text-slate-300" />
                                    <span>{purchase.items.length} Product Lines</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {purchase.status !== 'Completed' && purchase.status !== 'Received' && (
                                    <button 
                                        onClick={() => handleStartReceive(purchase)}
                                        className="w-full py-4 bg-slate-900 text-white dark:bg-brand-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-700 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group-hover:gap-4"
                                    >
                                        Process Receipt <ArrowRight size={16} />
                                    </button>
                                )}
                                {(purchase.status === 'Pending' || purchase.status === 'Draft' || purchase.status === 'Approved') && (
                                    <button 
                                        onClick={() => handleMarkCompleted(purchase._id)}
                                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={14} /> Mark as Received
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </>
    );
};

export default ReceivingOperations;
