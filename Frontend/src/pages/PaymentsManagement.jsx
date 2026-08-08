import React, { useState, useEffect } from 'react';
import { Plus, X, Receipt, Edit2, Trash2, Search, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const PaymentsManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [data, setData] = useState([]);
  const [students, setStudents] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    amount: 0,
    walletId: '',
    month: new Date().toISOString().slice(0, 7),
    paymentMethod: 'Cash',
    status: 'Completed',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPayments, resStudents, resWallets] = await Promise.all([
        api.get('/payments'),
        api.get('/students'),
        api.get('/wallets')
      ]);
      setData(resPayments.data || []);
      setStudents(resStudents.data || []);
      const walletList = resWallets.data || [];
      setWallets(walletList);
    } catch (error) {
      console.error("Failed to fetch payments data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s._id === studentId);
    const registeredFee = student ? (student.monthlyFee ?? student.fee ?? student.classId?.monthlyFee ?? 0) : 0;
    setFormData(prev => ({
      ...prev,
      studentId,
      amount: registeredFee
    }));
  };

  const handleWalletChange = (walletId) => {
    const wallet = wallets.find(w => w._id === walletId);
    let autoMethod = 'Cash';
    if (wallet) {
      const type = (wallet.type || '').toLowerCase();
      if (type.includes('bank')) {
        autoMethod = 'Bank Transfer';
      } else if (type.includes('mobile')) {
        autoMethod = 'Mobile Money';
      } else {
        autoMethod = 'Cash';
      }
    }
    setFormData(prev => ({
      ...prev,
      walletId,
      paymentMethod: wallet ? autoMethod : prev.paymentMethod
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    const initialStudent = students[0];
    const initialFee = initialStudent ? (initialStudent.monthlyFee ?? initialStudent.fee ?? initialStudent.classId?.monthlyFee ?? 0) : 0;
    const initialWallet = wallets[0];
    let initialMethod = 'Cash';
    if (initialWallet) {
      const type = (initialWallet.type || '').toLowerCase();
      if (type.includes('bank')) initialMethod = 'Bank Transfer';
      else if (type.includes('mobile')) initialMethod = 'Mobile Money';
    }

    setFormData({
      studentId: initialStudent?._id || '',
      amount: initialFee,
      walletId: initialWallet?._id || '',
      month: new Date().toISOString().slice(0, 7),
      paymentMethod: initialMethod,
      status: 'Completed',
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      studentId: item.studentId?._id || item.studentId || '',
      amount: item.amount || 0,
      walletId: item.walletId?._id || item.walletId || wallets[0]?._id || '',
      month: item.month || new Date().toISOString().slice(0, 7),
      paymentMethod: item.paymentMethod || 'Cash',
      status: item.status || 'Completed',
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount) {
      showAlert({ type: 'warning', title: 'Validation Error', message: 'Student and valid amount are required.' });
      return;
    }

    try {
      if (editingItem) {
        const res = await api.put(`/payments/${editingItem._id}`, formData);
        setData(prev => prev.map(i => i._id === editingItem._id ? (res.data || { ...i, ...formData }) : i));
        showAlert({ type: 'success', title: 'Success', message: 'Payment record updated successfully.' });
      } else {
        const res = await api.post('/payments', formData);
        setData(prev => [res.data, ...prev]);
        showAlert({ type: 'success', title: 'Success', message: 'Fee payment recorded successfully.' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save payment", error);
      showAlert({ type: 'danger', title: 'Error', message: error.response?.data?.message || 'Failed to record payment.' });
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete Payment?',
      message: 'Are you sure you want to delete this payment record?',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    try {
      await api.delete(`/payments/${item._id}`);
      setData(prev => prev.filter(i => i._id !== item._id));
      showAlert({ type: 'success', title: 'Deleted', message: 'Payment record removed.' });
    } catch (error) {
      console.error("Failed to delete payment", error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to delete payment record.' });
    }
  };

  const getStudentInfo = (studentRef) => {
    if (typeof studentRef === 'object' && studentRef !== null) {
      return studentRef;
    }
    return students.find(s => s._id === studentRef) || {};
  };

  const filteredData = data.filter(item => {
    const student = getStudentInfo(item.studentId);
    const studentName = student.fullName || '';
    const studentNum = student.rollNumber || student.studentCode || student.fatherPhone || '';
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Student Payments...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-teal-400 shadow-2xl border border-slate-700 ring-4 ring-teal-400/10">
            <Receipt size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Student Payments</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Fee Collection & Invoices</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-3 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Record Fee Payment
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md">
        <Search size={18} className="text-slate-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Search by student name, roll number, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Main Payment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">#</th>
                <th className="px-6 py-5">Student Name</th>
                <th className="px-6 py-5">Student No. / Phone</th>
                <th className="px-6 py-5">Month / Date</th>
                <th className="px-6 py-5">Amount ($)</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Deposit Wallet</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((item, index) => {
                const student = getStudentInfo(item.studentId);
                const studentNumber = student.rollNumber || student.studentCode || student.fatherPhone || 'N/A';
                const isPaid = item.status === 'Completed';

                return (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-5 text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.fullName || 'Unknown Student'}</p>
                      {student.fatherName && <p className="text-[11px] text-slate-400 font-medium">Father: {student.fatherName}</p>}
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">
                        {studentNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.month || 'Current'}</p>
                      <p className="text-[11px] text-slate-400">{new Date(item.paymentDate || item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(item.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                        isPaid 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.walletId?.name || (wallets.find(w => w._id === item.walletId)?.name) || 'Main Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => openEditModal(item)} title="Edit Payment" className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item)} title="Delete Payment" className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-8 py-10 text-center text-slate-400 text-sm font-medium">No payments found. Click "Record Fee Payment" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal (Add / Edit Payment) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingItem ? 'Edit Payment Record' : 'Record Fee Payment'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Select Student *</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => {
                    const fee = s.monthlyFee ?? s.fee ?? s.classId?.monthlyFee ?? 0;
                    const num = s.rollNumber || s.studentCode || s.fatherPhone || '';
                    return (
                      <option key={s._id} value={s._id}>
                        {s.fullName} {num ? `[ID/Phone: ${num}]` : ''} {fee > 0 ? `($${fee}/mo)` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                    Auto-filled from student fee.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Payment Month</label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Deposit Wallet / Account *</label>
                <select
                  required
                  value={formData.walletId}
                  onChange={(e) => handleWalletChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Target Wallet --</option>
                  {wallets.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.type} - Balance: ${w.balance || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money (Evc Plus)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium"
                >
                  <option value="Completed">Paid (Completed)</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly fee payment"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold text-xs uppercase shadow-lg hover:bg-teal-700"
                >
                  {editingItem ? 'Save Changes' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;
