import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus, Search, Calendar, Tag, Wallet, DollarSign, Download, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const INCOME_CATEGORIES = ['Product Sales', 'Delivery Charges', 'Storage Fees', 'Warehouse Rental', 'Miscellaneous Income'];

const FinanceIncome = () => {
  const { showAlert, showConfirm } = useAlert();
  const [income, setIncome] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [formData, setFormData] = useState({
    _id: null,
    title: '',
    category: INCOME_CATEGORIES[0],
    amount: '',
    date: new Date().toISOString().split('T')[0],
    walletId: '',
    clientId: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [incomeRes, walletsRes, clientsRes] = await Promise.all([
        api.get('/finance/income'),
        api.get('/finance/wallets'),
        api.get('/customers')
      ]);
      setIncome(incomeRes.data);
      setWallets(walletsRes.data);
      setClients(clientsRes.data.customers || clientsRes.data.clients || clientsRes.data || []);
      
      if (walletsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, walletId: walletsRes.data[0]._id }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/finance/income/${formData._id}`, formData);
      } else {
        await api.post('/finance/income', formData);
      }
      setIsModalOpen(false);
      fetchData();
      setFormData({
        _id: null, title: '', category: INCOME_CATEGORIES[0], amount: '', 
        date: new Date().toISOString().split('T')[0], 
        walletId: wallets.length > 0 ? wallets[0]._id : '', 
        clientId: '', description: ''
      });
    } catch (error) {
      console.error('Failed to save income:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to save income.',
        buttonText: 'Try again'
      });
    }
  };

  const handleEdit = (inc) => {
    setFormData({
      _id: inc._id,
      title: inc.title,
      category: inc.category,
      amount: inc.amount,
      date: inc.date,
      walletId: inc.walletId?._id || '',
      clientId: inc.clientId?._id || '',
      description: inc.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete income?',
      message: 'This will remove the amount from the wallet balance.',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/finance/income/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete income:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to delete income.',
        buttonText: 'Try again'
      });
    }
  };

  const filteredIncome = React.useMemo(() => {
    return income.filter(inc => {
      const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inc.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || inc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [income, searchTerm, selectedCategory]);

  const totalIncome = filteredIncome.reduce((acc, inc) => acc + (inc.amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-8 h-8 text-emerald-500" />
            Income Tracking
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Record product sales, delivery charges, and service fees.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({
              _id: null, title: '', category: INCOME_CATEGORIES[0], amount: '', 
              date: new Date().toISOString().split('T')[0], 
              walletId: wallets.length > 0 ? wallets[0]._id : '', 
              clientId: '', description: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" /> Record Income
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-medium">Total Income</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-600">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Tag className="w-5 h-5" />
            <h3 className="font-medium">Total Entries</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{income.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Income Records</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search income..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="All">All Categories</option>
              {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-sm">
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Wallet/Destination</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">Loading income records...</td></tr>
              ) : filteredIncome.map(inc => (
                <tr key={inc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-white">{inc.title}</div>
                    <div className="text-xs text-slate-500">{inc.date} • {inc.reference}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-medium">
                      {inc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600">${(inc.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{inc.walletId?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{inc.clientId?.name || 'N/A'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(inc)} className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(inc._id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {formData._id ? 'Edit Income' : 'Record New Income'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Income Title *</label>
                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Storage Fee - Client X" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input required type="date" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (USD) *</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Received Into Wallet *</label>
                  <select required className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500" value={formData.walletId} onChange={e => setFormData({...formData, walletId: e.target.value})}>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name} ({w.type})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client (Optional)</label>
                <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Income</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceIncome;
