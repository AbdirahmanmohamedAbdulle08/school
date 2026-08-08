import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Edit2,
  Trash2,
  Search,
  Tags,
  ArrowLeftRight,
  Save,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Scale
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';
import { digitsOnly } from '../utils/somaliPhone';

const PAYMENT_METHODS = ['Mobile Money', 'Bank'];

const METHODS_WITH_PARTIES = ['Mobile Money', 'Bank'];

// Per-method phone/account hints.
//  • Bank account number: 6–7 digits.
//  • Mobile Money: any number is accepted (e.g. 2526172882, 61…, 061…).
const PHONE_RULES = {
  Bank: { label: 'Bank number must be 6 to 7 digits' },
  'Mobile Money': { label: 'Enter the payer mobile number' }
};

// Returns an error string if the value is present but does not match the
// method's rule; empty string means valid (or nothing to validate).
// Mobile Money accepts any number — only Bank enforces a length.
const phoneError = (method, value) => {
  const d = digitsOnly(value);
  if (!d) return '';
  if (method === 'Bank') {
    return d.length >= 6 && d.length <= 7 ? '' : PHONE_RULES.Bank.label;
  }
  return '';
};

const emptyCategoryForm = () => ({
  title: '',
  type: 'Income',
  description: ''
});

const emptyTransactionForm = () => ({
  type: 'Income',
  categoryId: '',
  amount: '',
  method: 'Mobile Money',
  walletId: '',
  senderPhone: '',
  senderName: '',
  senderEntityType: '',
  senderEntityId: '',
  receiverPhone: '',
  receiverName: '',
  receiverEntityType: '',
  receiverEntityId: '',
  date: new Date().toISOString().split('T')[0],
  description: ''
});

const CashbookManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [activePanel, setActivePanel] = useState('category');

  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [payerOptions, setPayerOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm());
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');

  const [transactionForm, setTransactionForm] = useState(emptyTransactionForm());
  const [editingEntry, setEditingEntry] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [senderLocked, setSenderLocked] = useState(false);
  const [receiverLocked, setReceiverLocked] = useState(false);
  const [receiverAuto, setReceiverAuto] = useState(false);
  const [payerInfo, setPayerInfo] = useState(null);
  const [monthsToPay, setMonthsToPay] = useState(1);

  // The most a responsible payer may pay: the current month's outstanding balance
  // plus a full monthly fee for each additional month being pre-paid.
  const maxPayable = (payerInfo && payerInfo.kind === 'responsible')
    ? Number(payerInfo.totalBalance || 0) + Number(payerInfo.totalMonthlyFee || 0) * Math.max(0, monthsToPay - 1)
    : null;

  // When the number of pre-paid months changes, re-fill the amount with the new cap.
  useEffect(() => {
    if (payerInfo && payerInfo.kind === 'responsible') {
      const max = Number(payerInfo.totalBalance || 0) + Number(payerInfo.totalMonthlyFee || 0) * Math.max(0, monthsToPay - 1);
      setTransactionForm((prev) => ({ ...prev, amount: max }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsToPay]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [catRes, entryRes, walletRes, guardRes, studRes] = await Promise.all([
        api.get('/cashbook/categories'),
        api.get('/cashbook/entries'),
        api.get('/wallets'),
        api.get('/guardians'),
        api.get('/students')
      ]);
      setCategories(catRes.data || []);
      setEntries(entryRes.data || []);
      const walletList = walletRes.data || [];
      setWallets(walletList);

      // Build the type-and-select payer list (guardians + students' fathers), unique by number.
      const optMap = new Map();
      (guardRes.data?.guardians || guardRes.data || []).forEach((g) => {
        const ph = digitsOnly(g.phone);
        if (ph && !optMap.has(ph)) optMap.set(ph, g.fullName || g.name || '');
      });
      (studRes.data?.students || studRes.data || []).forEach((s) => {
        const ph = digitsOnly(s.fatherPhone);
        if (ph && !optMap.has(ph)) optMap.set(ph, s.fatherName || '');
      });
      setPayerOptions([...optMap.entries()].map(([phone, name]) => ({ phone, name })));
      // Default the form to the first active wallet if none picked yet.
      const firstWallet = walletList.find((w) => w.status !== 'Disabled') || walletList[0];
      if (firstWallet) {
        setTransactionForm((prev) => (prev.walletId ? prev : { ...prev, walletId: firstWallet._id }));
      }
    } catch (error) {
      console.error('Failed to load cashbook', error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to load cashbook data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // For incoming money (Income) via Bank / Mobile Money, the receiver is the
  // institute. If the chosen wallet has an account number, fill the receiver
  // automatically; otherwise leave it blank so it can be typed manually.
  useEffect(() => {
    const isIncome = transactionForm.type === 'Income';
    const methodOk = ['Bank', 'Mobile Money'].includes(transactionForm.method);
    const wallet = wallets.find((w) => w._id === transactionForm.walletId);
    if (isIncome && methodOk && wallet?.accountNumber) {
      setReceiverAuto(true);
      setTransactionForm((prev) =>
        prev.receiverPhone === wallet.accountNumber && prev.receiverName === wallet.name
          ? prev
          : {
              ...prev,
              receiverPhone: wallet.accountNumber,
              receiverName: wallet.name,
              receiverEntityType: 'manual',
              receiverEntityId: ''
            }
      );
    } else {
      setReceiverAuto(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionForm.type, transactionForm.method, transactionForm.walletId, wallets]);

  const lookupPhone = useCallback(async (phone, side) => {
    const cleaned = digitsOnly(phone);
    if (cleaned.length < 4) return;

    // Only look up once the number matches the method's digit rule.
    if (phoneError(transactionForm.method, cleaned)) {
      return;
    }

    try {
      const res = await api.get('/cashbook/lookup', { params: { phone: cleaned, purpose: side } });
      const { found, name, entityType, entityId, payerInfo: info } = res.data || {};

      if (side === 'sender') {
        if (found) {
          // Auto-fill the amount with what the payer still owes (they can edit it).
          const owed = info?.kind === 'responsible' ? Number(info.totalBalance || 0) : 0;
          setTransactionForm((prev) => ({
            ...prev,
            senderName: name,
            senderEntityType: entityType === 'teacher' ? 'user' : entityType,
            senderEntityId: entityId || '',
            amount: owed > 0 ? owed : prev.amount
          }));
          setSenderLocked(true);
          setPayerInfo(info || null);
          setMonthsToPay(1);
        } else {
          setSenderLocked(false);
          setPayerInfo(null);
        }
      } else {
        if (found) {
          setTransactionForm((prev) => ({
            ...prev,
            receiverName: name,
            receiverEntityType: entityType === 'teacher' ? 'teacher' : entityType === 'user' ? 'user' : entityType,
            receiverEntityId: entityId || ''
          }));
          setReceiverLocked(true);
        } else {
          setReceiverLocked(false);
        }
      }
    } catch {
      if (side === 'sender') {
        setSenderLocked(false);
        setPayerInfo(null);
      } else setReceiverLocked(false);
    }
  }, [transactionForm.method]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (transactionForm.senderPhone) lookupPhone(transactionForm.senderPhone, 'sender');
    }, 400);
    return () => clearTimeout(t);
  }, [transactionForm.senderPhone, lookupPhone]);

  useEffect(() => {
    // Skip lookup when the receiver is auto-filled from the institute wallet account.
    if (receiverAuto) return;
    const t = setTimeout(() => {
      if (transactionForm.receiverPhone) lookupPhone(transactionForm.receiverPhone, 'receiver');
    }, 400);
    return () => clearTimeout(t);
  }, [transactionForm.receiverPhone, lookupPhone, receiverAuto]);

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm());
    setEditingCategory(null);
  };

  const resetTransactionForm = () => {
    setTransactionForm(emptyTransactionForm());
    setEditingEntry(null);
    setSenderLocked(false);
    setReceiverLocked(false);
    setPayerInfo(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.title.trim()) {
      showAlert({ type: 'warning', title: 'Validation', message: 'Category title is required.' });
      return;
    }
    try {
      if (editingCategory) {
        const res = await api.put(`/cashbook/categories/${editingCategory._id}`, categoryForm);
        setCategories((prev) => prev.map((c) => (c._id === editingCategory._id ? res.data : c)));
        showAlert({ type: 'success', title: 'Updated', message: 'Category updated.' });
      } else {
        const res = await api.post('/cashbook/categories', categoryForm);
        setCategories((prev) => [...prev, res.data].sort((a, b) => a.title.localeCompare(b.title)));
        showAlert({ type: 'success', title: 'Saved', message: 'Category created.' });
      }
      resetCategoryForm();
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save category.'
      });
    }
  };

  const handleCategoryEdit = (item) => {
    setEditingCategory(item);
    setCategoryForm({
      title: item.title || '',
      type: item.type || 'Income',
      description: item.description || ''
    });
    setActivePanel('category');
  };

  const handleCategoryDelete = async (item) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete category?',
      message: 'Categories used by transactions cannot be deleted.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/cashbook/categories/${item._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== item._id));
      showAlert({ type: 'success', title: 'Deleted', message: 'Category removed.' });
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete category.'
      });
    }
  };

  const validateTransaction = () => {
    if (!transactionForm.categoryId) {
      showAlert({ type: 'warning', title: 'Validation', message: 'Select a category.' });
      return false;
    }
    if (!transactionForm.amount || Number(transactionForm.amount) <= 0) {
      showAlert({ type: 'warning', title: 'Validation', message: 'Enter a valid amount.' });
      return false;
    }
    // A fee payer may never pay more than they owe (current month + any pre-paid months).
    if (maxPayable !== null && Number(transactionForm.amount) > maxPayable + 0.001) {
      showAlert({
        type: 'warning',
        title: 'Amount too high',
        message: maxPayable > 0
          ? `This payer only owes ${fmtMoney(maxPayable)} for ${monthsToPay} month(s). Reduce the amount, or increase the months to pay ahead.`
          : `This payer has no outstanding balance for the current month. Increase the months to pre-pay future fees.`
      });
      return false;
    }
    const senderErr = phoneError(transactionForm.method, transactionForm.senderPhone);
    if (senderErr) {
      showAlert({ type: 'warning', title: 'Sender number', message: senderErr });
      return false;
    }
    // Institute account numbers are auto-filled from the wallet and not held to
    // the sender digit rules, so only validate a manually typed receiver.
    if (!receiverAuto) {
      const receiverErr = phoneError(transactionForm.method, transactionForm.receiverPhone);
      if (receiverErr) {
        showAlert({ type: 'warning', title: 'Receiver number', message: receiverErr });
        return false;
      }
    }
    return true;
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!validateTransaction()) return;

    const payload = {
      ...transactionForm,
      amount: Number(transactionForm.amount),
      senderPhone: digitsOnly(transactionForm.senderPhone),
      receiverPhone: digitsOnly(transactionForm.receiverPhone)
    };

    try {
      if (editingEntry) {
        const res = await api.put(`/cashbook/entries/${editingEntry._id}`, payload);
        setEntries((prev) => prev.map((x) => (x._id === editingEntry._id ? res.data : x)));
        showAlert({ type: 'success', title: 'Updated', message: 'Transaction updated.' });
      } else {
        const res = await api.post('/cashbook/entries', payload);
        setEntries((prev) => [res.data, ...prev]);
        showAlert({ type: 'success', title: 'Saved', message: 'Transaction recorded.' });
      }
      resetTransactionForm();
      fetchAll();
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save transaction.'
      });
    }
  };

  const handleTransactionEdit = (item) => {
    setEditingEntry(item);
    setTransactionForm({
      type: item.categoryId?.type || 'Income',
      categoryId: item.categoryId?._id || item.categoryId || '',
      amount: item.amount ?? '',
      method: item.method || 'Mobile Money',
      walletId: item.walletId?._id || item.walletId || '',
      senderPhone: item.senderPhone || '',
      senderName: item.senderName || '',
      senderEntityType: item.senderEntityType || '',
      senderEntityId: item.senderEntityId || '',
      receiverPhone: item.receiverPhone || '',
      receiverName: item.receiverName || '',
      receiverEntityType: item.receiverEntityType || '',
      receiverEntityId: item.receiverEntityId || '',
      date: item.date || new Date().toISOString().split('T')[0],
      description: item.description || ''
    });
    setSenderLocked(!!item.senderEntityType && item.senderEntityType !== 'manual');
    setReceiverLocked(!!item.receiverEntityType && item.receiverEntityType !== 'manual');
    setActivePanel('transaction');
  };

  const handleTransactionDelete = async (item) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete transaction?',
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/cashbook/entries/${item._id}`);
      setEntries((prev) => prev.filter((x) => x._id !== item._id));
      showAlert({ type: 'success', title: 'Deleted', message: 'Transaction removed.' });
    } catch (error) {
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to delete transaction.' });
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.title || '').toLowerCase().includes(categorySearch.toLowerCase()) ||
    (c.type || '').toLowerCase().includes(categorySearch.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];

  const filteredEntries = entries.filter((item) => {
    const cat = item.categoryId;
    const catId = cat?._id || cat;
    if (filterType !== 'All' && cat?.type !== filterType) return false;
    if (filterCategory !== 'All' && String(catId) !== String(filterCategory)) return false;
    const d = item.date || '';
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });

  // Categories offered in the filter dropdown respect the chosen type filter.
  const filterCategoryOptions = categories.filter((c) => filterType === 'All' || c.type === filterType);

  const showReceiverFields = METHODS_WITH_PARTIES.includes(transactionForm.method);
  const categoriesForType = categories.filter((c) => c.type === transactionForm.type);
  const senderPhoneErr = phoneError(transactionForm.method, transactionForm.senderPhone);
  const receiverPhoneErr = phoneError(transactionForm.method, transactionForm.receiverPhone);
  const phoneHint = PHONE_RULES[transactionForm.method]?.label || '';

  const totals = entries.reduce(
    (acc, item) => {
      const amt = Number(item.amount) || 0;
      if (item.categoryId?.type === 'Income') acc.income += amt;
      else if (item.categoryId?.type === 'Expense') acc.expense += amt;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const netBalance = totals.income - totals.expense;
  const fmtMoney = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading Cashbook...</div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <Wallet size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Cashbook
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">
              Categories &amp; all money movements
            </p>
          </div>
        </div>

        <div className="flex rounded-[20px] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setActivePanel('category')}
            className={`flex items-center gap-2 px-8 py-4 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
              activePanel === 'category'
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Tags size={16} /> Category
          </button>
          <button
            type="button"
            onClick={() => setActivePanel('transaction')}
            className={`flex items-center gap-2 px-8 py-4 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
              activePanel === 'transaction'
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowLeftRight size={16} /> Transaction
          </button>
        </div>
      </div>

      {activePanel === 'category' && (
        <div className="space-y-8">
          <form
            onSubmit={handleCategorySubmit}
            className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 space-y-6"
          >
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-800 dark:text-white">
              {editingCategory ? 'Edit category' : 'New category'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Student fee, Salary, Rent"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Type</label>
                <select
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-xs uppercase tracking-wider"
              >
                <Save size={16} /> {editingCategory ? 'Update category' : 'Save category'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs uppercase text-slate-600 dark:text-slate-300"
                >
                  <RotateCcw size={16} /> Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md">
            <Search size={18} className="text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5">Title</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Description</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCategories.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-white">{item.title}</td>
                    <td className="px-8 py-6">
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                          item.type === 'Income'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500">{item.description || '—'}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCategoryEdit(item)}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 hover:text-brand-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCategoryDelete(item)}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 hover:text-rose-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-sm">
                      No categories yet. Add one above (e.g. Student payment, Salary, Expense).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePanel === 'transaction' && (
        <div className="space-y-8">
          {categories.length === 0 && (
            <p className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-6 py-4 text-sm font-medium">
              Create at least one category first (use the Category tab).
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Income</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{fmtMoney(totals.income)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <TrendingDown size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Expense</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{fmtMoney(totals.expense)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${netBalance >= 0 ? 'bg-brand-100 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'}`}>
                <Scale size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Balance</p>
                <p className={`text-2xl font-black ${netBalance >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-amber-600 dark:text-amber-400'}`}>{fmtMoney(netBalance)}</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleTransactionSubmit}
            className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 space-y-6"
          >
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-800 dark:text-white">
              {editingEntry ? 'Edit transaction' : 'New transaction'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Type</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, type: e.target.value, categoryId: '' })
                  }
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-black uppercase tracking-wide outline-none ${
                    transactionForm.type === 'Income'
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Category</label>
                <select
                  required
                  value={transactionForm.categoryId}
                  onChange={(e) => setTransactionForm({ ...transactionForm, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">
                    {categoriesForType.length === 0
                      ? `No ${transactionForm.type} categories yet`
                      : `Select ${transactionForm.type} category`}
                  </option>
                  {categoriesForType.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Method</label>
                <select
                  value={transactionForm.method}
                  onChange={(e) => setTransactionForm({ ...transactionForm, method: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Institute Wallet / Account</label>
                <select
                  value={transactionForm.walletId}
                  onChange={(e) => setTransactionForm({ ...transactionForm, walletId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Auto (active wallet)</option>
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}{w.accountNumber ? ` · ${w.accountNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payer / Sender</p>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Payer phone</label>
                    <input
                      type="text"
                      list="payer-phone-options"
                      autoComplete="off"
                      value={transactionForm.senderPhone}
                      onChange={(e) => {
                        setSenderLocked(false);
                        setPayerInfo(null);
                        setTransactionForm({
                          ...transactionForm,
                          senderPhone: e.target.value,
                          senderEntityType: '',
                          senderEntityId: ''
                        });
                      }}
                      placeholder={transactionForm.method === 'Bank' ? 'Select a payer or type a bank number' : 'Select a payer or type a number'}
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white ${
                        senderPhoneErr
                          ? 'border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <datalist id="payer-phone-options">
                      {payerOptions.map((o) => (
                        <option key={o.phone} value={o.phone}>
                          {o.name ? `${o.name} — ${o.phone}` : o.phone}
                        </option>
                      ))}
                    </datalist>
                    {senderPhoneErr ? (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-bold">{senderPhoneErr}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">{phoneHint}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Payer name</label>
                    <input
                      type="text"
                      readOnly={senderLocked}
                      value={transactionForm.senderName}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          senderName: e.target.value,
                          senderEntityType: 'manual',
                          senderEntityId: ''
                        })
                      }
                      placeholder={senderLocked ? '' : 'Type name if not in system'}
                      className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 ${
                        senderLocked
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}
                    />
                    {senderLocked && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                        Matched from institute records
                      </p>
                    )}
                  </div>
                </div>

                {showReceiverFields && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {receiverAuto ? 'Receiver (institute account)' : 'Receiver (teacher / other)'}
                  </p>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      {receiverAuto ? 'Institute account number' : 'Phone'}
                    </label>
                    <input
                      type="text"
                      readOnly={receiverAuto}
                      value={transactionForm.receiverPhone}
                      onChange={(e) => {
                        setReceiverLocked(false);
                        setTransactionForm({
                          ...transactionForm,
                          receiverPhone: e.target.value,
                          receiverEntityType: '',
                          receiverEntityId: ''
                        });
                      }}
                      placeholder={transactionForm.method === 'Bank' ? 'Bank number (6–7 digits)' : '61…/62… or 061…/062…'}
                      className={`w-full px-4 py-3 rounded-xl border text-slate-900 dark:text-white ${
                        receiverAuto
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 font-mono'
                          : !receiverAuto && receiverPhoneErr
                          ? 'bg-slate-50 dark:bg-slate-800 border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {receiverAuto ? (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                        Auto-filled from the institute wallet account
                      </p>
                    ) : receiverPhoneErr ? (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-bold">{receiverPhoneErr}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">{phoneHint}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Name</label>
                    <input
                      type="text"
                      readOnly={receiverLocked || receiverAuto}
                      value={transactionForm.receiverName}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          receiverName: e.target.value,
                          receiverEntityType: 'manual',
                          receiverEntityId: ''
                        })
                      }
                      placeholder={receiverLocked ? '' : 'Type name if not in system'}
                      className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 ${
                        receiverLocked || receiverAuto
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}
                    />
                    {receiverLocked && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                        Matched from institute records (e.g. teacher)
                      </p>
                    )}
                  </div>
                </div>
                )}
              </div>

            {/* Amount — sits under the payer. Auto-filled with the money owed when a
                payer in the system is matched; edit it to pay only what he has. */}
            {payerInfo && payerInfo.kind === 'responsible' && Number(payerInfo.totalMonthlyFee || 0) > 0 && (
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Months to pay</label>
                <select
                  value={monthsToPay}
                  onChange={(e) => setMonthsToPay(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 12].map((m) => (
                    <option key={m} value={m}>{m} month{m > 1 ? 's' : ''} · {fmtMoney(Number(payerInfo.totalBalance || 0) + Number(payerInfo.totalMonthlyFee || 0) * (m - 1))}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                max={maxPayable !== null ? maxPayable : undefined}
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-black"
              />
              {payerInfo && payerInfo.kind === 'responsible' && maxPayable !== null && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  Max payable for {monthsToPay} month{monthsToPay > 1 ? 's' : ''}: {fmtMoney(maxPayable)}. The payer cannot pay more than they owe.
                </p>
              )}
            </div>

            {payerInfo && payerInfo.kind === 'staff' && (
              <div className="rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-400 mb-2">
                  Staff record · {payerInfo.role}
                </p>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Monthly salary</p>
                    <p className="text-2xl font-black text-brand-600 dark:text-brand-300">{fmtMoney(payerInfo.salary)}</p>
                  </div>
                  {payerInfo.lastSalary && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Last paid ({payerInfo.lastSalary.month})</p>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-200">
                        {fmtMoney(payerInfo.lastSalary.amount)}
                        <span className="text-[10px] ml-2 font-bold text-slate-400">{payerInfo.lastSalary.status}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {payerInfo && payerInfo.kind === 'responsible' && payerInfo.count > 0 && (() => {
              const entered = Number(transactionForm.amount) || 0;
              // What will still be owed after the amount currently in the form is paid.
              const remainingAfter = Math.max(0, payerInfo.totalBalance - entered);
              const isPartial = entered > 0 && entered < payerInfo.totalBalance;
              return (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-5">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    {transactionForm.senderName ? `${transactionForm.senderName} · ` : ''}Responsible payer
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {payerInfo.count} student{payerInfo.count === 1 ? '' : 's'} · {payerInfo.month}
                  </span>
                </div>

                {/* Money summary — total fee, paid, remaining. */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total fee</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{fmtMoney(payerInfo.totalMonthlyFee)}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Paid ({payerInfo.month})</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{fmtMoney(payerInfo.totalPaid)}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Remaining</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400">{fmtMoney(payerInfo.totalBalance)}</p>
                  </div>
                </div>

                {/* Progress bar of paid vs. total fee. */}
                {payerInfo.totalMonthlyFee > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      <span>Collected {fmtMoney(payerInfo.totalPaid)}</span>
                      <span>{Math.round((payerInfo.totalPaid / payerInfo.totalMonthlyFee) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (payerInfo.totalPaid / payerInfo.totalMonthlyFee) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Per-student remaining money table. */}
                {Array.isArray(payerInfo.students) && payerInfo.students.length > 0 && (
                  <div className="mt-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden bg-white/70 dark:bg-slate-900/50">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-emerald-100 dark:border-emerald-900/50">
                          <th className="px-4 py-2">Student</th>
                          <th className="px-4 py-2 text-right">Fee</th>
                          <th className="px-4 py-2 text-right">Paid</th>
                          <th className="px-4 py-2 text-right">Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50 dark:divide-emerald-900/30">
                        {payerInfo.students.map((s) => (
                          <tr key={s.studentId}>
                            <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                            <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{fmtMoney(s.monthlyFee)}</td>
                            <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{fmtMoney(s.totalPaid)}</td>
                            <td className={`px-4 py-2 text-right font-black ${s.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                              {fmtMoney(s.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-emerald-200 dark:border-emerald-800 font-black text-slate-900 dark:text-white">
                          <td className="px-4 py-2 uppercase text-[10px] text-slate-500">Total</td>
                          <td className="px-4 py-2 text-right">{fmtMoney(payerInfo.totalMonthlyFee)}</td>
                          <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{fmtMoney(payerInfo.totalPaid)}</td>
                          <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400">{fmtMoney(payerInfo.totalBalance)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {isPartial && (
                  <p className="mt-3 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    Partial payment — {fmtMoney(remainingAfter)} will still be owed and can be paid another day.
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {payerInfo.totalBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setTransactionForm((prev) => ({ ...prev, amount: payerInfo.totalBalance }))}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-wider"
                    >
                      Pay full remaining ({fmtMoney(payerInfo.totalBalance)})
                    </button>
                  )}
                  {payerInfo.totalBalance > 0 && entered > 0 && entered !== payerInfo.totalBalance && (
                    <button
                      type="button"
                      onClick={() => setTransactionForm((prev) => ({ ...prev, amount: '' }))}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-500 text-[11px] font-black uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Clear amount
                    </button>
                  )}
                </div>
              </div>
              );
            })()}

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Description</label>
              <textarea
                rows={2}
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Notes about this payment or expense"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={categories.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider"
              >
                <Save size={16} /> {editingEntry ? 'Update transaction' : 'Save transaction'}
              </button>
              {editingEntry && (
                <button
                  type="button"
                  onClick={resetTransactionForm}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs uppercase text-slate-600 dark:text-slate-300"
                >
                  <RotateCcw size={16} /> Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search size={16} className="text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter transactions</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setFilterCategory('All');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="All">All types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="All">All categories</option>
                  {filterCategoryOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} · {c.type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">From date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">To date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setDateFrom(today);
                  setDateTo(today);
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-black uppercase tracking-wider"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider"
              >
                All dates
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType('All');
                  setFilterCategory('All');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider"
              >
                Reset
              </button>
              <span className="ml-auto text-[11px] font-bold text-slate-400">
                {filteredEntries.length} result{filteredEntries.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-5">Date</th>
                    <th className="px-6 py-5">Category</th>
                    <th className="px-6 py-5">Type</th>
                    <th className="px-6 py-5">Payer</th>
                    <th className="px-6 py-5">Sender</th>
                    <th className="px-6 py-5">Receiver</th>
                    <th className="px-6 py-5">Method</th>
                    <th className="px-6 py-5 text-right">Amount</th>
                    <th className="px-6 py-5 text-right">Remaining</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEntries.map((item) => {
                    const cat = item.categoryId;
                    const isIncome = cat?.type === 'Income';
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">
                          {item.date ? new Date(item.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">
                          {cat?.title || '—'}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {cat?.type || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {item.senderName || '—'}
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{item.senderPhone || '—'}</td>
                        <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{item.receiverPhone || '—'}</td>
                        <td className="px-6 py-5 text-sm text-slate-500">{item.method}</td>
                        <td
                          className={`px-6 py-5 text-sm font-black text-right whitespace-nowrap ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '−'}{fmtMoney(item.amount)}
                        </td>
                        <td className="px-6 py-5 text-sm font-black text-right whitespace-nowrap">
                          {item.feeRemaining != null ? (
                            <span className={item.feeRemaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              ${fmtMoney(item.feeRemaining)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleTransactionEdit(item)}
                              className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 hover:text-brand-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTransactionDelete(item)}
                              className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 hover:text-rose-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-8 py-10 text-center text-slate-400 text-sm">
                        No transactions yet. Record income, expenses, fees, salaries, and more here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashbookManagement;
