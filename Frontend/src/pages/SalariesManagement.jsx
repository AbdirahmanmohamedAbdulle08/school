import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, CreditCard, Search } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const SalariesManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [data, setData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    teacherId: '',
    amount: 0,
    walletId: '',
    month: '',
    paymentMethod: 'Cash',
    status: 'Paid',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSalaries, resUsers, resWallets] = await Promise.all([
        api.get('/salaries'),
        api.get('/users'),
        api.get('/wallets')
      ]);
      setData(resSalaries.data || []);
      const teacherList = (resUsers.data || []).filter(u => u.role === 'Teacher' || u.role === 'Super Admin');
      setTeachers(teacherList);
      setWallets(resWallets.data || []);
    } catch (error) {
      console.error('Failed to fetch salaries', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleWalletChange = (walletId) => {
    const wallet = wallets.find(w => w._id === walletId);
    let autoMethod = 'Cash';
    if (wallet) {
      const type = (wallet.type || '').toLowerCase();
      if (type.includes('bank')) autoMethod = 'Bank Transfer';
      else if (type.includes('mobile')) autoMethod = 'Mobile Money';
    }
    setFormData(prev => ({
      ...prev,
      walletId,
      paymentMethod: wallet ? autoMethod : prev.paymentMethod
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const initialWallet = wallets[0];
    let initialMethod = 'Cash';
    if (initialWallet) {
      const type = (initialWallet.type || '').toLowerCase();
      if (type.includes('bank')) initialMethod = 'Bank Transfer';
      else if (type.includes('mobile')) initialMethod = 'Mobile Money';
    }

    setFormData({
      teacherId: teachers[0]?._id || '',
      amount: 0,
      walletId: initialWallet?._id || '',
      month: currentMonth,
      paymentMethod: initialMethod,
      status: 'Paid',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      teacherId: item.teacherId?._id || item.teacherId || '',
      amount: item.amount || 0,
      walletId: item.walletId?._id || item.walletId || wallets[0]?._id || '',
      month: item.month || '',
      paymentMethod: item.paymentMethod || 'Cash',
      status: item.status || 'Paid',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacherId || !formData.amount) {
      showAlert({ type: 'warning', title: 'Validation Error', message: 'Teacher and salary amount are required.' });
      return;
    }
    try {
      if (editingItem) {
        const res = await api.put(`/salaries/${editingItem._id}`, formData);
        setData(prev => prev.map(i => i._id === editingItem._id ? (res.data || { ...i, ...formData }) : i));
        showAlert({ type: 'success', title: 'Updated', message: 'Salary record updated.' });
      } else {
        const res = await api.post('/salaries', formData);
        setData(prev => [res.data, ...prev]);
        showAlert({ type: 'success', title: 'Success', message: 'Teacher salary disbursed successfully.' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      showAlert({ type: 'danger', title: 'Error', message: error.response?.data?.message || 'Failed to save salary record.' });
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm({ type: 'warning', title: 'Delete Salary?', message: 'This action cannot be undone.', confirmText: 'Yes, delete', cancelText: 'Cancel', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/salaries/${item._id}`);
      setData(prev => prev.filter(i => i._id !== item._id));
      showAlert({ type: 'success', title: 'Deleted', message: 'Salary record deleted.' });
    } catch (error) {
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to delete salary record.' });
    }
  };

  const filteredData = data.filter(item => {
    const name = item.teacherId?.fullName || (teachers.find(t => t._id === item.teacherId)?.fullName) || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.month || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Salaries...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <CreditCard size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Teacher Salaries</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Payroll & Disbursements</p>
          </div>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">
          <Plus size={18} strokeWidth={3} /> Disburse Salary
        </button>
      </div>

      <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md">
        <Search size={18} className="text-slate-400 mr-3" />
        <input type="text" placeholder="Search by teacher name or month..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Teacher</th>
                <th className="px-8 py-5">Month</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Paid From Wallet</th>
                <th className="px-8 py-5">Method</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.teacherId?.fullName || (teachers.find(t => t._id === item.teacherId)?.fullName) || 'Teacher'}
                  </td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">{item.month || '-'}</td>
                  <td className="px-8 py-6 text-sm font-black text-violet-600 dark:text-violet-400">${item.amount}</td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.walletId?.name || (wallets.find(w => w._id === item.walletId)?.name) || 'Main Cash'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">{item.paymentMethod || '-'}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{item.status}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button onClick={() => openEditModal(item)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan="6" className="px-8 py-10 text-center text-slate-400 text-sm font-medium">No salary records found. Click "Disburse Salary" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingItem ? 'Edit Salary Record' : 'Disburse Teacher Salary'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Select Teacher *</label>
                <select required value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white">
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName || t.username}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Month *</label>
                  <input type="month" required value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Amount ($) *</label>
                  <input type="number" min="1" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Disbursement Wallet / Account *</label>
                <select
                  required
                  value={formData.walletId}
                  onChange={(e) => handleWalletChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Wallet --</option>
                  {wallets.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.type} - Balance: ${w.balance || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Money">Mobile Money (Evc Plus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Notes</label>
                <input type="text" placeholder="Optional notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-xs uppercase shadow-lg hover:bg-violet-700">
                  {editingItem ? 'Save Changes' : 'Disburse Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalariesManagement;
