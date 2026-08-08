import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Plus, Search, MoreVertical, Edit2, Trash2, ChevronRight,
  Filter, X, Layers, CheckCircle2, CircleOff, ArrowRight, ShieldCheck,
  Download, Command, Eye, History, Boxes, RefreshCw, BarChart3, Package,
  FolderTree, PlusCircle
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const InventoryCategories = () => {
  const { showAlert, showConfirm } = useAlert();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    parentCategory: '',
    description: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', parentCategory: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      parentCategory: cat.parentCategory || '',
      description: cat.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to save category.',
        buttonText: 'Try again'
      });
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete category?',
      message: 'This category will be removed.',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to delete category.',
        buttonText: 'Try again'
      });
    }
  };

  const filteredCategories = Array.isArray(categories) ? categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-brand-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl border border-slate-700 ring-8 ring-slate-900/5 transition-transform hover:rotate-3">
            <LayoutGrid size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Categories</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
              <FolderTree size={14} /> Classification Hierarchy & Segments
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-brand-500/20 transition-all active:scale-95 group"
        >
          <PlusCircle size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Add Category
        </button>
      </div>

      {/* Control Center */}
      <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative group w-full md:w-1/3">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search category registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-brand-500/20 rounded-3xl font-bold text-slate-900 dark:text-white outline-none shadow-sm transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-7">Category</th>
                <th className="px-10 py-7">Parent Category</th>
                <th className="px-10 py-7 text-center">Products Count</th>
                <th className="px-10 py-7 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="px-10 py-20 text-center text-slate-400">Loading taxonomy...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan="4" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No categories defined.</td></tr>
              ) : filteredCategories.map((cat) => (
                <tr key={cat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 text-brand-600 rounded-2xl flex items-center justify-center font-black shadow-inner border border-brand-100 dark:border-brand-900/30 group-hover:scale-110 transition-transform">
                        <Layers size={20} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{cat.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest truncate w-48">{cat.description || 'Global Segment'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2">
                       <FolderTree size={14} className="text-slate-300" />
                       <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">{cat.parentCategory || 'Top Level'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-xs text-slate-900 dark:text-white shadow-inner">
                       {cat.productsCount || 0} Products
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenEdit(cat)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-brand-600 shadow-sm"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(cat._id)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-rose-600 shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-12">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-full shadow-sm"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-12 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" placeholder="e.g. Antibiotics" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Category</label>
                <select value={formData.parentCategory} onChange={e => setFormData({...formData, parentCategory: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-slate-900 dark:text-white outline-none">
                  <option value="">None (Top Level)</option>
                  {categories.filter(c => c._id !== editingCategory?._id).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-slate-900 dark:text-white h-32 resize-none" placeholder="Context for this segment..." />
              </div>

              <div className="pt-10 flex justify-end gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button type="submit" className="px-14 py-5 bg-brand-600 hover:bg-brand-700 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-brand-500/30">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCategories;
