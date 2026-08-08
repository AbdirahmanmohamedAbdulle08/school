import React, { useState, useEffect, useRef } from 'react';
import { 
    Building2, Layers, LayoutDashboard, Package, Plus, Trash2, 
    Edit2, ChevronRight, ChevronDown, Move, Info, X, 
    ArrowRightLeft, History, Barcode, Printer, Download, Upload, 
    FileText, Search, Grid, MapPin, CheckCircle2, QrCode, 
    Activity
} from 'lucide-react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import Papa from 'papaparse';
import { useAlert } from '../components/common/alerts/useAlert';

const LocationIcon = ({ type, size = 18 }) => {
    switch (type) {
        case 'Zone': return <MapPin size={size} />;
        case 'Rack': return <Grid size={size} />;
        case 'Shelf': return <Layers size={size} />;
        case 'Bin': return <Box size={size} />;
        default: return <Building2 size={size} />;
    }
};

const Box = ({ size }) => <Package size={size} />;

const TreeNode = ({ node, level = 0, onAdd, onEdit, onDelete, onViewBin, onTransfer, onPrint }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isWarehouseRoot = node.type === 'Warehouse';

    return (
        <div className="w-full">
            <div 
                className={`flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group ${level === 0 ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''}`}
                style={{ paddingLeft: `${(level * 32) + 16}px` }}
            >
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ${!hasChildren && 'opacity-0 cursor-default'}`}
                        disabled={!hasChildren}
                    >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    
                    <div 
                        className="flex items-center gap-3 text-slate-700 dark:text-slate-300 cursor-pointer group"
                        onClick={() => node.type === 'Bin' && onViewBin(node)}
                    >
                        <div className={`p-2 rounded-xl transition-all ${
                            node.type === 'Zone' ? 'bg-brand-500/10 text-brand-600' :
                            node.type === 'Rack' ? 'bg-brand-500/10 text-brand-600' :
                            node.type === 'Shelf' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-emerald-500/10 text-emerald-600'
                        }`}>
                            <LocationIcon type={node.type} size={20} />
                        </div>
                        <div>
                           <div className="font-black text-sm uppercase tracking-tight group-hover:text-brand-600 transition-colors">{node.name}</div>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{node.type}</span>
                              {node.barcode && (
                                <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">#{node.barcode}</span>
                              )}
                           </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onPrint(node)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 transition-all"
                        title="Print Label"
                    >
                        <Printer size={16} />
                    </button>
                    
                    {node.type === 'Bin' ? (
                        <button 
                            onClick={() => onViewBin(node)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 transition-all"
                            title="View Contents"
                        >
                            <Info size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => onAdd(node)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 transition-all"
                            title={`Add Child`}
                        >
                            <Plus size={16} />
                        </button>
                    )}
                    
                    {!isWarehouseRoot && (
                        <>
                            <button 
                                onClick={() => onEdit(node)}
                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition-all"
                                title="Edit"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => onDelete(node)}
                                className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="flex flex-col w-full">
                    {node.children.map(child => (
                        <TreeNode 
                            key={child._id} node={child} level={level + 1} 
                            onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} 
                            onViewBin={onViewBin} onTransfer={onTransfer} onPrint={onPrint}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const WarehouseStructure = () => {
    const { showAlert, showConfirm } = useAlert();
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('all');
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ type: null, data: null });
    const [formData, setFormData] = useState({ type: 'Zone', name: '', barcode: '', description: '' });
    const [binContents, setBinContents] = useState([]);
    const [isFetchingContents, setIsFetchingContents] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        if (selectedWarehouseId) fetchTree();
    }, [selectedWarehouseId]);

    const fetchWarehouses = async () => {
        try {
            const { data } = await api.get('/warehouses?all=true');
            setWarehouses(data);
            if (data.length > 0 && !selectedWarehouseId) setSelectedWarehouseId('all');
        } catch (error) {}
    };

    const fetchTree = async () => {
        setLoading(true);
        try {
            const { data } = selectedWarehouseId === 'all'
                ? await api.get('/locations/tree-all')
                : await api.get(`/locations/tree/${selectedWarehouseId}`);
            setTreeData(data);
        } catch (error) {} finally {
            setLoading(false);
        }
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const locations = results.data.map(row => ({
                    type: row.Type,
                    name: row.Name,
                    parentName: row.ParentName,
                    barcode: row.Barcode,
                    description: row.Description
                }));

                try {
                    if (selectedWarehouseId === 'all') {
                        showAlert({
                            type: 'warning',
                            title: 'Select a warehouse',
                            message: 'Choose one warehouse before importing a CSV layout.',
                            buttonText: 'Got it'
                        });
                        return;
                    }
                    await api.post('/locations/bulk', {
                        warehouseId: selectedWarehouseId,
                        locations
                    });
                    fetchTree();
                } catch (error) {
                    showAlert({
                        type: 'error',
                        title: 'Import failed',
                        message: 'Please check CSV format.',
                        buttonText: 'Try again'
                    });
                }
            }
        });
    };

    const generateLabelPDF = (node) => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });
        const canvas = document.getElementById(`qr-gen-${node._id}`);
        if (!canvas) {
            showAlert({
                type: 'info',
                title: 'QR not ready',
                message: 'Please wait for the QR code to render before printing.',
                buttonText: 'Got it'
            });
            return;
        }
        const qrImage = canvas.toDataURL('image/png');

        doc.setFillColor(245, 247, 250);
        doc.rect(0, 0, 100, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`${node.type.toUpperCase()} IDENTIFIER`, 5, 10);
        
        doc.addImage(qrImage, 'PNG', 5, 20, 35, 35);
        doc.setFontSize(22);
        doc.text(node.name, 45, 32);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Warehouse: ${warehouses.find(w => w._id === (node.warehouseId || selectedWarehouseId))?.name || 'All Warehouses'}`, 45, 40);
        
        doc.setFontSize(12);
        doc.setFont('courier', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`CODE: ${node.barcode || 'N/A'}`, 45, 52);
        
        doc.save(`Label_${node.name}.pdf`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modal.type === 'add') {
                const warehouseId = modal.data?.type === 'Warehouse' ? modal.data._id : (modal.data?.warehouseId || selectedWarehouseId);
                const parentId = modal.data && modal.data.type !== 'Warehouse' ? modal.data._id : null;
                await api.post('/locations', { ...formData, warehouseId, parentId });
            } else if (modal.type === 'edit') {
                await api.put(`/locations/${modal.data._id}`, formData);
            }
            setModal({ type: null, data: null });
            fetchTree();
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: error.response?.data?.message || 'Failed to save.',
                buttonText: 'Try again'
            });
        }
    };

    const getAllBins = (nodes) => {
        let bins = [];
        nodes.forEach(n => {
            if (n.type === 'Bin') bins.push(n);
            if (n.children) bins = bins.concat(getAllBins(n.children));
        });
        return bins;
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 dark:bg-brand-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl border border-slate-700 ring-8 ring-brand-500/5 transition-transform hover:rotate-3">
                        <Layers size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Warehouse Map</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
                            <Grid size={14} /> Hierarchical Topology: Zone → Rack → Shelf → Bin
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <input 
                        type="file" ref={fileInputRef} className="hidden" 
                        accept=".csv" onChange={handleImportCSV} 
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        disabled={selectedWarehouseId === 'all'}
                        className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Upload size={18} className="text-brand-500" /> Bulk Import
                    </button>
                    <button 
                        onClick={() => {
                            if (selectedWarehouseId === 'all') {
                                showAlert({
                                    type: 'info',
                                    title: 'Choose a branch',
                                    message: 'Select a specific warehouse or use the plus button on a warehouse row.',
                                    buttonText: 'Got it'
                                });
                                return;
                            }
                            setFormData({ type: 'Zone', name: '', barcode: '', description: '' });
                            setModal({ type: 'add', data: null });
                        }}
                        className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-700 hover:shadow-2xl hover:shadow-brand-600/30 transition-all active:scale-95 shadow-xl shadow-brand-500/20"
                    >
                        <Plus size={20} strokeWidth={3} /> Define Zone
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left: Structure Tree */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            {warehouses.length === 0 ? (
                                <span className="text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-xl">No Warehouses Found! Please configure a warehouse first.</span>
                            ) : (
                                <select
                                    value={selectedWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-3 font-black text-[10px] uppercase tracking-widest shadow-sm outline-none appearance-none cursor-pointer hover:border-brand-500/30 transition-colors"
                                >
                                    <option value="all">All Warehouses</option>
                                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                </select>
                            )}
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-brand-500"></div> Zone
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-brand-500"></div> Rack
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Bin
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-[600px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96">
                                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">Syncing Node Topology...</span>
                            </div>
                        ) : treeData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <LayoutDashboard size={48} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Empty Floor Plan</h3>
                                <p className="text-slate-500 max-w-sm mt-3 font-medium">Use the bulk import feature to initialize nodes or define your first zone manually.</p>
                                <button onClick={() => {setFormData({ type: 'Zone', name: '', barcode: '', description: '' }); setModal({ type: 'add', data: null });}} className="mt-8 text-brand-600 font-black uppercase tracking-widest text-[10px] hover:underline">Add First Zone Node →</button>
                            </div>
                        ) : (
                            <div className="flex flex-col w-full pb-12">
                                {treeData.map(rootNode => (
                                    <TreeNode 
                                        key={rootNode._id} node={rootNode} 
                                        onAdd={(p) => {
                                            let ct = p.type === 'Warehouse' ? 'Zone' : 'Rack';
                                            if (p.type === 'Rack') ct = 'Shelf';
                                            if (p.type === 'Shelf') ct = 'Bin';
                                            setFormData({ type: ct, name: '', barcode: '', description: '' });
                                            setModal({ type: 'add', data: p });
                                        }} 
                                        onEdit={(n) => {
                                            setFormData({ type: n.type, name: n.name, barcode: n.barcode || '', description: n.description || '' });
                                            setModal({ type: 'edit', data: n });
                                        }} 
                                        onDelete={async (node) => {
                                            const ok = await showConfirm({
                                                type: 'warning',
                                                title: 'Decommission node?',
                                                message: `Permanently decommission node ${node.name}?`,
                                                confirmText: 'Decommission',
                                                cancelText: 'Cancel',
                                                danger: true
                                            });
                                            if (!ok) return;
                                            try { await api.delete(`/locations/${node._id}`); fetchTree(); } catch (error) {
                                                showAlert({
                                                    type: 'error',
                                                    title: 'Uh oh!',
                                                    message: error.response?.data?.message || 'Failed to decommission node.',
                                                    buttonText: 'Try again'
                                                });
                                            }
                                        }} 
                                        onViewBin={async (node) => {
                                            setBinContents([]); setModal({ type: 'contents', data: node });
                                            setIsFetchingContents(true);
                                            try { const { data } = await api.get(`/inventory-locations/locations/${node._id}`); setBinContents(data); } 
                                            catch (error) {} finally { setIsFetchingContents(false); }
                                        }} 
                                        onTransfer={(n) => setModal({ type: 'transfer', data: n })}
                                        onPrint={generateLabelPDF}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Statistics & Guides */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight text-sm">
                            <Activity size={20} className="text-brand-500" /> Topology Pulse
                        </h3>
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest block mb-2">Active Storage Nodes</span>
                                <div className="flex items-end justify-between">
                                   <span className="text-3xl font-black tabular-nums dark:text-white">{getAllBins(treeData).length}</span>
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Operational</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    const allBins = getAllBins(treeData);
                                    if (allBins.length === 0) return;
                                    allBins.forEach((bin, i) => setTimeout(() => generateLabelPDF(bin), i * 600));
                                }}
                                className="w-full mt-4 py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95"
                            >
                                <Printer size={18} /> Bulk Print Tags
                            </button>
                        </div>
                    </div>

                    <div className="bg-brand-600 text-white rounded-[44px] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                            <QrCode size={120} />
                        </div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-4 text-brand-200">Import Specification</h3>
                        <div className="text-sm font-medium leading-relaxed opacity-90 mb-8">
                            Initialize your warehouse layout instantly via CSV mapping. Required headers: <br/>
                            <div className="font-mono text-[10px] bg-brand-700/50 p-3 rounded-2xl mt-4 block leading-loose">
                                Type [Zone/Rack/Shelf/Bin]<br/>
                                Name, ParentName, Barcode
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                const csvContent = "Type,Name,ParentName,Barcode,Description\nZone,Cold Zone,,CZ-001,Cold Storage\nRack,Rack A1,Cold Zone,CZ-R1,Primary Rack\nShelf,Shelf 01,Rack A1,CZ-R1-S1,Top Shelf\nBin,Bin A1,Shelf 01,CZ-R1-S1-B1,Final Bin";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'layout_template.csv';
                                a.click();
                            }}
                            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-6 py-3 rounded-2xl transition-all active:scale-95"
                        >
                            <Download size={16} /> Sample Map
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden QR Generator */}
            <div className="hidden">
                {treeData && (function renderQRs(nodes) {
                    let qrs = [];
                    nodes.forEach(n => {
                        qrs.push(<QRCodeCanvas key={n._id} id={`qr-gen-${n._id}`} value={n.barcode || n.name} size={512} level="H" />);
                        if (n.children) qrs = qrs.concat(renderQRs(n.children));
                    });
                    return qrs;
                })(treeData)}
            </div>

            {/* Modals ... */}
            {modal.type === 'contents' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-300">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-brand-500/10 rounded-[24px] flex items-center justify-center text-brand-500"><Package size={30} /></div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{modal.data.name}</h2>
                                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{modal.data.barcode || 'NO BARCODE'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => generateLabelPDF(modal.data)} className="p-5 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all"><Printer size={20} /></button>
                                <button onClick={() => setModal({ type: null, data: null })} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-rose-500 transition-all"><X size={24} /></button>
                            </div>
                        </div>
                        <div className="p-10 max-h-[60vh] overflow-y-auto">
                            {isFetchingContents ? (
                                <div className="py-20 flex justify-center"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : binContents.length === 0 ? (
                                <div className="py-20 text-center text-slate-400">
                                    <Package size={80} className="mx-auto mb-6 opacity-5" />
                                    <p className="font-black uppercase tracking-widest text-[10px]">Bin Content: Null</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {binContents.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-brand-500/20 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-600 font-black shadow-sm border border-slate-100 dark:border-slate-800 text-lg">{item.quantity}</div>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight">{item.productId?.name}</div>
                                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Batch: {item.batchNumber || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Expiry Date</div>
                                                <div className="text-xs font-black dark:text-white tabular-nums">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {(modal.type === 'add' || modal.type === 'edit') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {modal.type === 'add' ? `Define ${formData.type}` : 'Modify Node'}
                                </h2>
                                <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-1">Configure Topology Level</p>
                            </div>
                            <button onClick={() => setModal({ type: null, data: null })} className="p-3 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Node Identification Name</label>
                                <input 
                                    required type="text" value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner dark:text-white"
                                    placeholder={formData.type + " Name/No."}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Universal Node Code</label>
                                <div className="relative">
                                    <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" value={formData.barcode}
                                        onChange={e => setFormData({...formData, barcode: e.target.value})}
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner dark:text-white"
                                        placeholder="Scan or Generate"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, barcode: Math.random().toString(36).substring(2, 12).toUpperCase()})}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-600 uppercase hover:underline"
                                    >
                                        Auto-Gen
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-6 bg-brand-600 hover:bg-brand-700 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/30 transition-all active:scale-95">
                                Save Topology Config
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseStructure;
