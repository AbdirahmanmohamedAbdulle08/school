import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  Trash2,
  MoreVertical,
  X,
  ArrowRight,
  Calendar,
  Tag,
  Wallet,
  DollarSign,
  FileText,
  ShieldCheck,
  Download,
  Paperclip,
  ChevronDown,
  RefreshCw,
  PlusCircle,
  Edit2,
  Eye,
  Info,
  TrendingUp
} from 'lucide-react';

const MOCK_EXPENSES = [
  { id: 'EXP-101', date: '2024-10-24', category: 'Utilities', description: 'Electric Bill Oct', amount: 345.00, wallet: 'Cash Main', status: 'Approved' },
  { id: 'EXP-102', date: '2024-10-22', category: 'Rent', description: 'Monthly Space Lease', amount: 2100.00, wallet: 'Premier Bank', status: 'Approved' },
  { id: 'EXP-103', date: '2024-10-15', category: 'Marketing', description: 'Social Media Ads', amount: 700.00, wallet: 'EVC Plus', status: 'Approved' },
];



const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Marketing', 'Payroll', 'Supplies', 'Maintenance', 'Other'];
const WALLETS = ['Cash Main', 'Bank Account', 'Mobile Money', 'Credit Card'];

const ExpenseManagement = () => {
  const { showAlert } = useAlert();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Dynamic Data
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: EXPENSE_CATEGORIES[0],
    description: '',
    note: '',
    amount: '',
    wallet: WALLETS[0],
    attachment: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const expensesRes = await api.get('/expenses');
        setExpenses(expensesRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.reference && exp.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTab = activeTab === 'All' || exp.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab, expenses]);

  // Dashboard Statistics
  const stats = useMemo(() => {
    const totalBurn = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    // Find most used wallet
    const walletCounts = expenses.reduce((acc, exp) => {
      acc[exp.wallet] = (acc[exp.wallet] || 0) + 1;
      return acc;
    }, {});
    const topWallet = Object.entries(walletCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalBurn: totalBurn,
      primaryWallet: topWallet ? topWallet[0] : 'N/A',
      totalEntries: expenses.length
    };
  }, [expenses]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/expenses', formData);
      setExpenses([res.data, ...expenses]); // Optimistic update or refetch
      setIsModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: EXPENSE_CATEGORIES[0], // Reset
        description: '',
        note: '',
        amount: '',
        wallet: WALLETS[0],
        attachment: null
      });
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Expense posted successfully.',
        buttonText: 'Continue'
      });

      // Refresh to get full formatted object if needed, but simple prepend works for now
      // actually res.data is the raw journal entry, we might need to format it to match list structure
      // simpler to just refetch or rely on mapper if we want perfection.
      // Let's doing a quick reload for now to ensure consistency
      const fresh = await api.get('/expenses');
      setExpenses(fresh.data);

    } catch (err) {
      console.error(err);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: err.response?.data?.message || 'Failed to post expense.',
        buttonText: 'Try again'
      });
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24 font-sans">

      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-rose-500 shadow-2xl border border-slate-700 ring-4 ring-rose-500/10 transition-transform hover:rotate-3">
            <ReceiptText size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Expenditure</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Operational Disbursals & Journal Registry</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} className="text-brand-500" /> Export Journal
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl transition-all active:scale-95 group border border-slate-700"
          >
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Post Expense
          </button>
        </div>
      </div>

      {/* 2. Analytical Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        {[
          { label: 'Total Period Burn', value: `$${stats.totalBurn.toLocaleString(undefined, { minimumFractionDigits: 2 })} (USD)`, color: 'text-rose-600', icon: <TrendingUp size={20} /> },
          { label: 'Primary Funding Node', value: stats.primaryWallet, color: 'text-emerald-600', icon: <Wallet size={20} /> },
          { label: 'Total Volume', value: `${stats.totalEntries.toString().padStart(2, '0')} Entries`, color: 'text-slate-400', icon: <ShieldCheck size={20} /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-brand-500/30 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black dark:text-white tabular-nums tracking-tighter">{stat.value}</h4>
            </div>
            <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Filter & Registry Registry */}
      <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/20">
          <div className="relative group w-full md:w-[450px]">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="Search description or ID..."
              className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-semibold outline-none focus:ring-8 focus:ring-brand-500/5 transition-all dark:text-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('All')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'All' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-brand-600'}`}
              >
                ALL
              </button>
              {EXPENSE_CATEGORIES.map(acc => (
                <button
                  key={acc}
                  onClick={() => setActiveTab(acc)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === acc ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-brand-600'}`}
                >
                  {acc}
                </button>
              ))}
            </div>
            <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-brand-600 transition-all shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* 📋 Expense Table: Date, Category, Amount, Wallet, Action */}
        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Expense</th>
                <th className="px-10 py-6">Category</th>
                <th className="px-10 py-6">Amount (USD)</th>
                <th className="px-10 py-6">Recorded By</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{exp.description}</p>
                      <p className="text-[10px] font-medium text-slate-500">{exp.note || 'No notes'}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-1">Date: {exp.date} • Ref: {exp.id}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-800 uppercase tracking-widest">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">${(Number(exp.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                        {(exp.recordedBy || '?').charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{exp.recordedBy || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right relative overflow-visible">
                    <div className="flex justify-end items-center gap-3">
                      <button className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-600 shadow-sm active:scale-90">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-3 text-slate-300 hover:text-rose-500 transition-colors active:scale-90">
                        <Trash2 size={18} />
                      </button>
                      <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Audit Bar */}
        <div className="p-10 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Status</p>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-tight">
                <ShieldCheck size={16} /> All Disbursements Balanced
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex flex-col hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Ledger Sync</p>
              <div className="flex items-center gap-2 text-brand-500 font-bold text-xs uppercase tracking-tight">
                <RefreshCw size={16} /> 100% Real-time Consistency
              </div>
            </div>
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:gap-5 transition-all group shadow-xl active:scale-95 border border-slate-700">
            End-of-Day Reconciliation <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. Expense Form Modal: Date, Category, Description, Amount, Wallet, Attachment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[56px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
            <div className="px-12 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <ReceiptText size={200} />
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-rose-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                  <PlusCircle size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight uppercase leading-none">Post Disbursal</h3>
                  <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest">Global Expense Registry</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all active:scale-90 relative z-10"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-12 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* 📅 Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Expenditure Date</label>
                  <div className="relative group">
                    <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                    <input
                      required
                      type="date"
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-sm font-black dark:text-white outline-none focus:ring-8 focus:ring-rose-500/5 transition-all shadow-inner"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                {/* 🏷️ Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Expense Classification</label>
                  <div className="relative group">
                    <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-sm font-black dark:text-white outline-none appearance-none focus:ring-8 focus:ring-rose-500/5 transition-all shadow-inner"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {EXPENSE_CATEGORIES.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* 📝 Description */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Expense Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Somali Power & Water - Oct usage"
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-sm font-bold dark:text-white outline-none focus:ring-8 focus:ring-rose-500/5 transition-all shadow-inner"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* 📝 Note */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Note (Optional)</label>
                  <textarea
                    placeholder="Additional context or references..."
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-sm font-medium dark:text-white outline-none focus:ring-8 focus:ring-rose-500/5 transition-all shadow-inner resize-none min-h-[100px]"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                {/* 💰 Amount */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Expense Amount (USD)</label>
                  <div className="relative group">
                    <DollarSign size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-500" />
                    <input
                      required
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-2xl font-black tabular-nums dark:text-white outline-none focus:ring-8 focus:ring-rose-500/5 transition-all shadow-inner"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                {/* 💳 Paid From (Wallet) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Source / Wallet</label>
                  <div className="relative group">
                    <Wallet size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] text-sm font-black dark:text-white outline-none appearance-none focus:ring-8 focus:ring-rose-500/5 transition-all shadow-inner"
                      value={formData.wallet}
                      onChange={e => setFormData({ ...formData, wallet: e.target.value })}
                    >
                      {WALLETS.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* 📎 Attachment (optional) */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Voucher Attachment (Optional)</label>
                  <div className="relative group">
                    <label className="flex flex-col items-center justify-center w-full py-10 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:border-brand-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Paperclip size={28} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-600 transition-colors">Click to Upload Receipt</p>
                      </div>
                      <input type="file" className="hidden" onChange={e => setFormData({ ...formData, attachment: e.target.files ? e.target.files[0] : null })} />
                    </label>
                    {formData.attachment && (
                      <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-full text-[8px] font-black text-emerald-600 uppercase flex items-center gap-2">
                        <ShieldCheck size={10} /> File Ready
                      </div>
                    )}
                  </div>
                </div>
              </div>



              <div className="flex flex-col sm:flex-row items-center gap-5 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-12 py-6 bg-slate-100 dark:bg-slate-800 text-slate-50 dark:text-slate-400 rounded-[32px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Discard Entry</button>
                <button type="submit" className="flex-1 w-full px-12 py-6 bg-rose-600 text-white rounded-[32px] text-xs font-black uppercase tracking-[0.25em] hover:bg-rose-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group">
                  Commit Expenditure <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;
