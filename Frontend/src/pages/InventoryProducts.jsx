import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, Filter, Plus, MoreVertical, Edit2, Trash2, Tag,
  X, DollarSign, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2,
  Download, Command, Eye, History, Barcode, Boxes, RefreshCw,
  PlusCircle, Layers, Scale, Clock, CircleOff, Loader2, Camera, Upload, FileDown, FileUp, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const InventoryProducts = ({ user, currentRole }) => {
  const { showAlert, showConfirm } = useAlert();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stats, setStats] = useState({ totalValue: 0, lowStockCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    unit: '',
    cost: 0,
    price: 0,
    reorderLevel: 10,
    expiryTracking: false,
    productImage: null,
    status: 'Active'
  });

  useEffect(() => {
    fetchInitialData();
    fetchProducts();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        api.get('/categories'),
        api.get('/units')
      ]);
      setCategories(catRes.data || []);
      setUnits(unitRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      setProducts(data.products || []);
      setStats({
        totalValue: data.stats?.totalValue || 0,
        lowStockCount: data.stats?.lowStockCount || 0,
        total: data.total || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '', sku: '', barcode: '', category: categories[0]?.name || '', unit: units[0]?.shortCode || '',
      cost: 0, price: 0, reorderLevel: 10,
      expiryTracking: false, productImage: null, status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || '',
      category: prod.category || '',
      unit: prod.unit || '',
      cost: prod.cost,
      price: prod.price,
      reorderLevel: prod.reorderLevel,
      expiryTracking: prod.expiryRequired || false,
      productImage: prod.image || null,
      status: prod.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          productImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        cost: Number(formData.cost),
        price: Number(formData.price),
        reorderLevel: Number(formData.reorderLevel),
        expiryRequired: formData.expiryTracking, // Mapping to backend field
        image: formData.productImage // Mapping productImage to image for backend
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: err.response?.data?.message || 'Failed to save product.',
        buttonText: 'Try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prodId) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete product?',
      message: 'This product will be removed from inventory.',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${prodId}`);
      fetchProducts();
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to delete product.',
        buttonText: 'Try again'
      });
    }
  };

  // Export Features
  const exportData = (type) => {
    showAlert({
      type: 'info',
      title: 'Export started',
      message: `Exporting product catalog to ${type}...`,
      buttonText: 'Continue'
    });
    // Implementation logic for CSV/PDF would go here
  };

  const handleImport = () => {
    showAlert({
      type: 'info',
      title: 'Import products',
      message: 'Select a CSV file to import products.',
      buttonText: 'Continue'
    });
  };

  const filteredProducts = useMemo(() => products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">

      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-brand-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl border border-slate-700 ring-8 ring-slate-900/5 transition-transform hover:rotate-3">
            <Package size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Products Registry</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
              <Layers size={14} /> Master Product Catalog & SKU Management
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleImport} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
            <FileUp size={18} className="text-brand-500" /> Import CSV
          </button>
          <button onClick={() => exportData('Excel')} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
            <FileDown size={18} className="text-emerald-500" /> Export Excel/PDF
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3 py-5 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-brand-500/20 transition-all active:scale-95 group"
          >
            <PlusCircle size={18} strokeWidth={2} className="group-hover:rotate-90 transition-transform" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Products', value: stats.total, icon: <Boxes />, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-500/10' },
          { label: 'Inventory Value', value: `$${stats.totalValue.toLocaleString()}`, icon: <DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Low Stock Items', value: stats.lowStockCount, icon: <AlertTriangle />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          { label: 'Active SKUs', value: products.filter(p => p.status === 'Active').length, icon: <ShieldCheck />, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-brand-500">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{stat.value}</h4>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Main Container: Search, Filter, Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">

        {/* Controls */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative group w-full lg:w-1/3">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by SKU, Name or Barcode..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-3xl font-bold text-slate-900 dark:text-white outline-none shadow-sm transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              {['All', 'Low Stock', 'Out of Stock'].map(f => (
                <button key={f} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${f === 'All' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{f}</button>
              ))}
            </div>
            <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-brand-600 shadow-sm"><Filter size={20} /></button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-7">Image</th>
                <th className="px-6 py-7">SKU / Barcode</th>
                <th className="px-8 py-7">Product</th>
                <th className="px-8 py-7">Category</th>
                <th className="px-8 py-7 text-center">Qty</th>
                <th className="px-8 py-7">Price</th>
                <th className="px-8 py-7">Status</th>
                <th className="px-10 py-7 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="px-10 py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-500" /></td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="8" className="px-10 py-20 text-center text-slate-400 italic font-medium uppercase tracking-widest text-[10px]">Registry entry not found.</td></tr>
              ) : currentItems.map((prod) => (
                <tr key={prod._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-10 py-6">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {prod.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={24} />}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm mb-1">{prod.sku}</div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest"><Barcode size={12} /> {prod.barcode || 'NO-BC'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{prod.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{prod.unit || 'PC'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{prod.category || 'General'}</span>
                  </td>
                  <td className="px-8 py-6 text-center font-black tabular-nums">
                    <div className={`${prod.quantity <= (prod.reorderLevel || 10) ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{prod.quantity}</div>
                    {prod.quantity <= (prod.reorderLevel || 10) && <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest mt-1 animate-pulse">Low Stock</div>}
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-emerald-600 dark:text-emerald-500 tracking-tight">${prod.price?.toLocaleString()}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Cost: ${prod.cost}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${prod.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10'}`}>
                      {prod.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenEdit(prod)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-brand-600 transition-colors shadow-sm"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(prod._id)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-rose-600 transition-colors shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} Entries</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 disabled:opacity-30 hover:text-brand-600 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-brand-600 text-white shadow-xl' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 disabled:opacity-30 hover:text-brand-600 transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-12">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/20"><Plus size={28} /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingProduct ? 'Update Product Node' : 'Register New SKU'}</h2>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1 italic">Fill the specifications for the catalog registry.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                 {/* Product Image */}
                 <div className="col-span-2 flex items-center gap-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800">
                   <label htmlFor="img-upload" className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 relative group overflow-hidden cursor-pointer">
                     {formData.productImage ? <img src={formData.productImage} className="w-full h-full object-cover" /> : <Camera size={32} />}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                       <Upload size={20} className="text-white" />
                     </div>
                   </label>
                   <div className="flex-1">
                     <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Product Image</h4>
                     <p className="text-xs text-slate-500 font-medium leading-relaxed">Upload a clear photo for visual identification in the dashboard and reports.</p>
                     <input 
                       type="file" 
                       className="hidden" 
                       id="img-upload" 
                       accept="image/*"
                       onChange={handleImageChange}
                     />
                     <label htmlFor="img-upload" className="inline-block mt-4 text-[10px] font-black text-brand-600 uppercase tracking-widest cursor-pointer hover:underline">Choose File...</label>
                   </div>
                 </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all" placeholder="Enter full name..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU</label>
                    <input required type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all" placeholder="PRO-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Barcode</label>
                    <input type="text" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all" placeholder="7890123..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none">
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                    <select required value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none">
                      {units.map(u => <option key={u._id} value={u.shortCode}>{u.name} ({u.shortCode})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost Price ($)</label>
                    <input required type="number" step="0.01" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-emerald-600 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price ($)</label>
                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-emerald-600 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reorder Level</label>
                    <input required type="number" value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-rose-600 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Tracking</label>
                    <div className="flex items-center gap-4 py-4 px-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, expiryTracking: !formData.expiryTracking })}
                        className={`w-14 h-8 rounded-full transition-all relative ${formData.expiryTracking ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.expiryTracking ? 'left-7' : 'left-1 shadow-sm'}`} />
                      </button>
                      <span className="text-xs font-bold text-slate-500 uppercase">{formData.expiryTracking ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-3 px-14 py-5 bg-brand-600 hover:bg-brand-700 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-brand-500/30 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {editingProduct ? 'Finalize Changes' : 'Initialize SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryProducts;
