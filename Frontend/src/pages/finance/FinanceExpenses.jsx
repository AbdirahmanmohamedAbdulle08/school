import React, { useState, useEffect } from 'react';
import { ArrowDownRight, Plus, Search, Calendar, Tag, Wallet, DollarSign, Download, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const EXPENSE_CATEGORIES = ['Product Purchases', 'Fuel', 'Transport', 'Electricity', 'Water', 'Internet', 'Maintenance', 'Salaries', 'Packaging', 'Miscellaneous'];

const FinanceExpenses = () => {
  const { showAlert, showConfirm } = useAlert();
  const [expenses, setExpenses] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [formData, setFormData] = useState({
    _id: null,
    title: '',
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    date: new Date().toISOString().split('T')[0],
    walletId: '',
    vendorId: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, walletsRes, vendorsRes] = await Promise.all([
        api.get('/finance/expenses'),
        api.get('/finance/wallets'),
        api.get('/vendors')
      ]);
      setExpenses(expensesRes.data);
      setWallets(walletsRes.data);
      setVendors(vendorsRes.data.vendors || vendorsRes.data || []);
      
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
        await api.put(`/finance/expenses/${formData._id}`, formData);
      } else {
        await api.post('/finance/expenses', formData);
      }
      setIsModalOpen(false);
      fetchData();
      setFormData({
        _id: null, title: '', category: EXPENSE_CATEGORIES[0], amount: '', 
        date: new Date().toISOString().split('T')[0], 
        walletId: wallets.length > 0 ? wallets[0]._id : '', 
        vendorId: '', description: ''
      });
    } catch (error) {
      console.error('Failed to save expense:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to save expense.',
        buttonText: 'Try again'
      });
    }
  };

  const handleEdit = (exp) => {
    setFormData({
      _id: exp._id,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      walletId: exp.walletId?._id || '',
      vendorId: exp.vendorId?._id || '',
      description: exp.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete expense?',
      message: 'This will refund the amount back to the wallet.',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/finance/expenses/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to delete expense.',
        buttonText: 'Try again'
      });
    }
  };

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        exp.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const totalExpense = filteredExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowDownRight className="w-8 h-8 text-rose-500" />
            Operational Expenses
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Record purchases, utility bills, salaries, and maintenance costs.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({
              _id: null, title: '', category: EXPENSE_CATEGORIES[0], amount: '', 
              date: new Date().toISOString().split('T')[0], 
              walletId: wallets.length > 0 ? wallets[0]._id : '', 
              vendorId: '', description: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-5 h-5" /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-medium">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-rose-600">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Tag className="w-5 h-5" />
            <h3 className="font-medium">Total Entries</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{expenses.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Expense Records</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search expense..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                <th className="py-3 px-4">Wallet/Source</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">Loading expenses...</td></tr>
              ) : filteredExpenses.map(exp => (
                <tr key={exp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-white">{exp.title}</div>
                    <div className="text-xs text-slate-500">{exp.date} • {exp.reference}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 rounded-full text-xs font-medium">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-600">${(exp.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{exp.walletId?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{exp.vendorId?.name || 'N/A'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(exp)} className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(exp._id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors">
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
              {formData._id ? 'Edit Expense' : 'Record New Expense'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expense Title *</label>
                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Electric Bill October" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input required type="date" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (USD) *</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Source (Wallet) *</label>
                  <select required className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500" value={formData.walletId} onChange={e => setFormData({...formData, walletId: e.target.value})}>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name} ({w.type})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor (Optional)</label>
                <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500" value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})}>
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceExpenses;
