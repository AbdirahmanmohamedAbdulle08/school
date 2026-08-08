import React, { useState, useEffect } from 'react';
import { 
    Package, ArrowRightLeft, Search, Truck, 
    FileText, CheckCircle2, ChevronRight, X, Clock, Building2, Printer
} from 'lucide-react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import { useAlert } from '../components/common/alerts/useAlert';

const DispatchingOperations = () => {
    const { showAlert } = useAlert();
    const [activeTab, setActiveTab] = useState('PACK'); // 'PACK' or 'DISPATCH'
    const [sales, setSales] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [useCustomLogistics, setUseCustomLogistics] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState({ isOpen: false, sale: null });
    
    // Shipment essentials only; order context is shown as a compact summary in the modal.
    const [dispatchForm, setDispatchForm] = useState({
        courier: '', trackingNumber: '', dispatchDate: new Date().toISOString().split('T')[0], status: 'Shipped',
        driverId: '', vehicleId: '', driverName: '', driverPhone: '', vehiclePlate: '', deliveryAddress: ''
    });

    useEffect(() => {
        fetchSales();
        fetchLogisticsData();
    }, []);

    const fetchLogisticsData = async () => {
        try {
            const [driversRes, vehiclesRes] = await Promise.all([
                api.get('/drivers'),
                api.get('/vehicles')
            ]);
            // Only Active drivers/vehicles ideally, but let's fetch all for now
            setDrivers(driversRes.data);
            setVehicles(vehiclesRes.data);
        } catch (error) {
            console.error('Failed to fetch logistics data', error);
        }
    };

    const fetchSales = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sales?limit=1000');
            setSales((data.sales || data).filter(s => ['Picked', 'Packed', 'Shipped'].includes(s.status)));
        } catch (error) {
            console.error('Failed to fetch sales for dispatch', error);
        } finally {
            setLoading(false);
        }
    };

    const getEntityId = (entity) => {
        if (!entity) return '';
        return typeof entity === 'string' ? entity : entity._id || '';
    };

    const handleRegisteredDriverChange = (driverId) => {
        const driver = drivers.find(dr => dr._id === driverId);
        const assignedVehicleId = getEntityId(driver?.assignedVehicle);
        const assignedVehicle = vehicles.find(vehicle => vehicle._id === assignedVehicleId);

        setDispatchForm(prev => ({
            ...prev,
            courier: 'Internal',
            driverId: driver?._id || '',
            driverName: driver?.name || '',
            driverPhone: driver?.phone || '',
            vehicleId: assignedVehicle?._id || '',
            vehiclePlate: assignedVehicle?.vehicleNumber || ''
        }));
    };

    const handleRegisteredVehicleChange = (vehicleId) => {
        const vehicle = vehicles.find(vh => vh._id === vehicleId);
        const defaultDriverId = getEntityId(vehicle?.defaultDriver);
        const assignedDriver = drivers.find(driver =>
            driver._id === defaultDriverId || getEntityId(driver.assignedVehicle) === vehicle?._id
        );

        setDispatchForm(prev => ({
            ...prev,
            courier: 'Internal',
            vehicleId: vehicle?._id || '',
            vehiclePlate: vehicle?.vehicleNumber || '',
            driverId: assignedDriver?._id || '',
            driverName: assignedDriver?.name || '',
            driverPhone: assignedDriver?.phone || ''
        }));
    };

    const selectRegisteredFleet = () => {
        setUseCustomLogistics(false);
        setDispatchForm(prev => ({ ...prev, courier: 'Internal' }));
    };

    const selectExternalCourier = () => {
        setUseCustomLogistics(true);
        setDispatchForm(prev => ({
            ...prev,
            courier: prev.courier === 'Internal' ? '' : prev.courier,
            driverId: '',
            vehicleId: ''
        }));
    };

    const handlePack = async (saleId) => {
        try {
            await api.put(`/sales/${saleId}/status`, { status: 'Packed' });
            fetchSales();
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: 'Failed to update status to Packed.',
                buttonText: 'Try again'
            });
        }
    };

    const generatePackingSlip = (sale) => {
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('PACKING SLIP', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Order Ref: ${sale.invoiceNo || sale._id.substring(sale._id.length - 8).toUpperCase()}`, 20, 40);
        doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 40);

        doc.setLineWidth(0.5);
        doc.line(20, 60, 190, 60);

        doc.setFontSize(10);
        doc.text('Item / Product', 20, 70);
        doc.text('Qty Picked', 150, 70);
        
        doc.line(20, 75, 190, 75);

        doc.setFont('helvetica', 'normal');
        let y = 85;
        sale.items.forEach(item => {
            doc.text(item.productName || 'Unknown Product', 20, y);
            doc.text(item.pickedQuantity?.toString() || item.quantity.toString(), 150, y);
            y += 10;
        });

        doc.line(20, y, 190, y);
        doc.setFont('helvetica', 'italic');
        doc.text('Please verify contents upon receipt.', 105, y + 20, { align: 'center' });

        doc.save(`PackingSlip_${sale.invoiceNo || sale._id.substring(sale._id.length - 8)}.pdf`);
    };

    const handleDispatchSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/sales/${modal.sale._id}/dispatch`, {
                carrier: dispatchForm.courier,
                trackingNumber: dispatchForm.trackingNumber,
                expectedDeliveryDate: dispatchForm.dispatchDate,
                driverId: useCustomLogistics ? undefined : dispatchForm.driverId,
                vehicleId: useCustomLogistics ? undefined : dispatchForm.vehicleId,
                driverName: dispatchForm.driverName,
                driverPhone: dispatchForm.driverPhone,
                vehiclePlate: dispatchForm.vehiclePlate,
                deliveryAddress: dispatchForm.deliveryAddress
            });
            setModal({ isOpen: false, sale: null });
            setDispatchForm({
                courier: '', trackingNumber: '', dispatchDate: new Date().toISOString().split('T')[0], status: 'Shipped',
                driverId: '', vehicleId: '', driverName: '', driverPhone: '', vehiclePlate: '', deliveryAddress: ''
            });
            setUseCustomLogistics(false);
            fetchSales();
            showAlert({
                type: 'success',
                title: 'Woohoo!',
                message: 'Order successfully dispatched.',
                buttonText: 'Continue'
            });
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: error.response?.data?.message || 'Failed to dispatch order.',
                buttonText: 'Try again'
            });
        }
    };

    const filteredSales = sales.filter(s => 
        (s.invoiceNo || s._id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toPack = filteredSales.filter(s => s.status === 'Picked');
    const toDispatch = filteredSales.filter(s => s.status === 'Packed');
    const shippedHistory = filteredSales.filter(s => s.status === 'Shipped'); // For the table history

    // Use active tab to determine which list to show in the table
    let activeList = [];
    if (activeTab === 'PACK') activeList = toPack;
    else if (activeTab === 'DISPATCH') activeList = toDispatch;
    else activeList = shippedHistory;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-4">
                        <Truck className="text-brand-600" size={32} strokeWidth={3} />
                        Dispatching Operations
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic opacity-70">Pack picked orders and dispatch them via logistics couriers.</p>
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

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <button 
                    onClick={() => setActiveTab('PACK')}
                    className={`px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'PACK' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Package size={14} /> To Pack <span className="ml-1 bg-black/10 px-2 py-0.5 rounded-full">{toPack.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('DISPATCH')}
                    className={`px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'DISPATCH' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Truck size={14} /> To Dispatch <span className="ml-1 bg-black/10 px-2 py-0.5 rounded-full">{toDispatch.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <CheckCircle2 size={14} /> History <span className="ml-1 bg-black/10 px-2 py-0.5 rounded-full">{shippedHistory.length}</span>
                </button>
            </div>

            {/* Dispatch Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5">Order No</th>
                                <th className="px-4 py-5">Client</th>
                                <th className="px-4 py-5 text-center">Items</th>
                                <th className="px-4 py-5">Packed By</th>
                                <th className="px-4 py-5">Status</th>
                                <th className="px-4 py-5">Date</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activeList.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                        No orders found in this section.
                                    </td>
                                </tr>
                            ) : activeList.map((order, index) => (
                                <tr key={order._id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                        {order.invoiceNo || order._id.substring(order._id.length - 8).toUpperCase()}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-bold">
                                        {order.customerName || 'Walk-in'}
                                    </td>
                                    <td className="px-4 py-4 text-center font-black text-slate-500">
                                        {order.items?.length || 0}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-500">
                                        {order.status === 'Picked' ? 'Pending' : 'System Staff'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            order.status === 'Picked' ? 'bg-slate-100 text-slate-600' :
                                            order.status === 'Packed' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-500 font-medium">
                                        {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {order.status === 'Picked' && (
                                            <>
                                                <button onClick={() => generatePackingSlip(order)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-100 hover:text-brand-600 transition-colors" title="Print Packing Slip">
                                                    <Printer size={16} />
                                                </button>
                                                <button onClick={() => handlePack(order._id)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-colors">
                                                    Mark Packed
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'Packed' && (
                                            <>
                                                <button onClick={() => generatePackingSlip(order)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-100 hover:text-brand-600 transition-colors" title="Print Packing Slip">
                                                    <Printer size={16} />
                                                </button>
                                                <button onClick={() => setModal({ isOpen: true, sale: order })} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-colors">
                                                    Mark Shipped
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'Shipped' && (
                                            <button onClick={() => generatePackingSlip(order)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-100 hover:text-brand-600 transition-colors" title="Print Packing Slip">
                                                <Printer size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dispatch / Shipment Form Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-3xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_36px_100px_-24px_rgba(15,23,42,0.6)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-6 border-b border-slate-100 bg-slate-50/80 p-7 dark:border-slate-800 dark:bg-slate-800/40">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-600/20">
                                    <Truck size={26} strokeWidth={3} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-500">Dispatch Operation</p>
                                    <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                        Mark Order Shipped
                                    </h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal({ isOpen: false, sale: null })}
                                className="rounded-2xl bg-white p-3 text-slate-400 shadow-sm transition-all hover:text-rose-500 dark:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleDispatchSubmit} className="max-h-[78vh] overflow-y-auto p-7">
                            <div className="mb-7 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30">
                                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Client</p>
                                    <p className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">{modal.sale?.customerName || 'Walk-in'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30">
                                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Order</p>
                                    <p className="mt-1 truncate text-sm font-black uppercase text-slate-900 dark:text-white">{modal.sale?.invoiceNo || modal.sale?._id.substring(modal.sale._id.length - 8)}</p>
                                </div>
                                <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
                                    <p className="text-[9px] font-black uppercase tracking-[0.22em] opacity-70">Next Status</p>
                                    <p className="mt-1 text-sm font-black uppercase">Shipped</p>
                                </div>
                            </div>

                            <div className="mb-7 rounded-[24px] border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950/20">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={selectRegisteredFleet}
                                        className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!useCustomLogistics ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        Registered Fleet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={selectExternalCourier}
                                        className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${useCustomLogistics ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        External Courier
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div>
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Courier</span>
                                    <input
                                        required
                                        type="text"
                                        value={useCustomLogistics ? dispatchForm.courier : 'Internal'}
                                        onChange={e => setDispatchForm({...dispatchForm, courier: e.target.value})}
                                        readOnly={!useCustomLogistics}
                                        className={`w-full rounded-2xl border px-5 py-4 text-sm font-black outline-none transition-all dark:text-white ${
                                            useCustomLogistics
                                                ? 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800'
                                                : 'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300'
                                        }`}
                                        placeholder={useCustomLogistics ? 'DHL, FedEx, local courier...' : 'Internal'}
                                    />
                                </div>
                                <div>
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tracking No.</span>
                                    <input required type="text" value={dispatchForm.trackingNumber} onChange={e => setDispatchForm({...dispatchForm, trackingNumber: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-mono text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="TRK-123456789" />
                                </div>
                                <div>
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ship Date</span>
                                    <input required type="date" value={dispatchForm.dispatchDate} onChange={e => setDispatchForm({...dispatchForm, dispatchDate: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Driver</span>
                                    {!useCustomLogistics ? (
                                        <select
                                            value={dispatchForm.driverId}
                                            onChange={e => handleRegisteredDriverChange(e.target.value)}
                                            required={!useCustomLogistics}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">Select driver...</option>
                                            {drivers.map(d => {
                                                const assignedVehicle = vehicles.find(vehicle => vehicle._id === getEntityId(d.assignedVehicle));
                                                return (
                                                    <option key={d._id} value={d._id}>
                                                        {d.name}{assignedVehicle ? ` - ${assignedVehicle.vehicleNumber}` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    ) : (
                                        <input type="text" value={dispatchForm.driverName} onChange={e => setDispatchForm({...dispatchForm, driverName: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Driver name" />
                                    )}
                                </div>
                                <div>
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Vehicle</span>
                                    {!useCustomLogistics ? (
                                        <select
                                            value={dispatchForm.vehicleId}
                                            onChange={e => handleRegisteredVehicleChange(e.target.value)}
                                            required={!useCustomLogistics}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">Select vehicle...</option>
                                            {vehicles.map(v => {
                                                const assignedDriver = drivers.find(driver =>
                                                    driver._id === getEntityId(v.defaultDriver) || getEntityId(driver.assignedVehicle) === v._id
                                                );
                                                return (
                                                    <option key={v._id} value={v._id}>
                                                        {v.vehicleNumber} ({v.type}){assignedDriver ? ` - ${assignedDriver.name}` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    ) : (
                                        <input type="text" value={dispatchForm.vehiclePlate} onChange={e => setDispatchForm({...dispatchForm, vehiclePlate: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Vehicle plate" />
                                    )}
                                </div>
                                {useCustomLogistics && (
                                    <div>
                                        <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Phone</span>
                                        <input type="text" value={dispatchForm.driverPhone} onChange={e => setDispatchForm({...dispatchForm, driverPhone: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="+252..." />
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Delivery Address</span>
                                    <input type="text" value={dispatchForm.deliveryAddress} onChange={e => setDispatchForm({...dispatchForm, deliveryAddress: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Optional destination or handoff notes" />
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 md:flex-row md:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModal({ isOpen: false, sale: null })}
                                    className="rounded-2xl px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="rounded-2xl bg-brand-600 px-9 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-2xl shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98]">
                                    Confirm Shipment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DispatchingOperations;
