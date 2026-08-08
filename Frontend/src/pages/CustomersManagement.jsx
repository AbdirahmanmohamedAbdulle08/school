import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { useAlert } from '../components/common/alerts/useAlert';
import {
  UserCircle,
  Plus,
  Search,
  Filter,
  Star,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  MoreVertical,
  X,
  CheckCircle2,
  ArrowRight,
  Heart,
  Zap,
  MapPin,
  ClipboardList,
  Edit2,
  Trash2,
  DollarSign,
  Receipt,
  ShieldCheck,
  Banknote,
  Building,
  Info,
  CircleOff,
  UserCheck,
  Check
} from 'lucide-react';
import { userHasPermission } from '../utils/permissionUtils';

const CustomersManagement = ({ user }) => {
  const { showAlert, showConfirm } = useAlert();
  const isAdminUser = user?.roles?.some(role => {
    const roleName = String(role?.name || '').toLowerCase();
    return roleName.includes('admin') || roleName.includes('owner') || roleName.includes('system') || roleName.includes('super');
  }) || String(user?.role || '').toLowerCase().includes('admin') || String(user?.role || '').toLowerCase().includes('owner');
  const canReadCustomers = userHasPermission(user, 'Vendors & Clients', 'Read', 'Business Clients') ||
    userHasPermission(user, 'People', 'Read', 'Customers') || isAdminUser;
  const canWriteCustomers = userHasPermission(user, 'Vendors & Clients', 'Write', 'Business Clients') ||
    userHasPermission(user, 'People', 'Write', 'Customers') || isAdminUser;
  const canExecuteCustomers = userHasPermission(user, 'Vendors & Clients', 'Execute', 'Business Clients') ||
    userHasPermission(user, 'People', 'Execute', 'Customers') || isAdminUser;
  const canReceiveCustomerPayments = canWriteCustomers || canExecuteCustomers;
  const canExportCustomers = userHasPermission(user, 'Vendors & Clients', 'Export', 'Business Clients') ||
    userHasPermission(user, 'People', 'Export', 'Customers') || isAdminUser;
  const [customers, setCustomers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCustomers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const [customersRes, walletsRes] = await Promise.all([
        api.get(`/customers?page=${page}&limit=50&search=${search}`),
        api.get('/finance/wallets')
      ]);
      const data = customersRes.data;
      setCustomers(data.customers || []);
      setTotalPages(data.pages || 1);
      setCurrentPage(Number(data.page) || 1);
      setWallets(walletsRes.data.wallets || walletsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      showToast(error.response?.data?.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: '0',
    creditLimit: '0',
    notes: '',
    status: 'Active'
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    walletId: '',
    notes: ''
  });

  const showToast = (message, type = 'success') => {
    showAlert({
      type,
      title: type === 'error' ? 'Uh oh!' : 'Woohoo!',
      message,
      buttonText: type === 'error' ? 'Try again' : 'Continue'
    });
  };

  const filteredCustomers = useMemo(() => {
    if (activeFilter === 'With Balance') return customers.filter(c => Number(c.outstandingBalance || 0) > 0);
    if (activeFilter === 'No Balance') return customers.filter(c => Number(c.outstandingBalance || 0) <= 0);
    return customers;
  }, [customers, activeFilter]);

  const paymentWallets = useMemo(() => {
    if (paymentForm.method === 'Cash') {
      return wallets;
    }
    if (paymentForm.method === 'Bank') {
      return wallets.filter(wallet => wallet.type === 'Bank Account');
    }
    return wallets;
  }, [wallets, paymentForm.method]);

  useEffect(() => {
    if (paymentWallets.length && !paymentWallets.some(wallet => wallet._id === paymentForm.walletId)) {
      setPaymentForm(prev => ({ ...prev, walletId: paymentWallets[0]._id }));
    }
  }, [paymentWallets, paymentForm.walletId]);

  const handleOpenAdd = () => {
    if (!canWriteCustomers) {
      showToast('You do not have permission to register customers.', 'error');
      return;
    }
    setSelectedCustomer(null);
    setCustomerForm({ name: '', phone: '', email: '', address: '', openingBalance: '0', creditLimit: '0', notes: '', status: 'Active' });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    if (!canWriteCustomers) {
      showToast('You do not have permission to edit customers.', 'error');
      return;
    }
    setSelectedCustomer(cust);
    setCustomerForm({
      name: cust.name,
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address?.street || '',
      openingBalance: (cust.outstandingBalance || 0).toString(),
      creditLimit: (cust.creditLimit || 0).toString(),
      notes: cust.notes || '',
      status: cust.isActive ? 'Active' : 'Inactive'
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenPayment = (cust) => {
    if (!canReceiveCustomerPayments) {
      showToast('You do not have permission to receive customer payments.', 'error');
      return;
    }
    setSelectedCustomer(cust);
    const cashWallet = wallets.find(wallet => ['Cash', 'Petty Cash'].includes(wallet.type));
    setPaymentForm({ amount: '', method: 'Cash', walletId: cashWallet?._id || '', notes: '' });
    setIsPaymentModalOpen(true);
  };

  const handleOpenDetails = (cust) => {
    setSelectedCustomer(cust);
    setIsDetailsModalOpen(true);
  };

  const handleOpenLedger = async (cust) => {
    try {
      setSelectedCustomer(cust);
      const { data } = await api.get(`/customers/${cust._id}/ledger`);
      setLedgerEntries(data.entries || []);
      setIsLedgerModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch customer ledger:', error);
      showToast(error.response?.data?.message || 'Failed to load client ledger', 'error');
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveCustomer = async (e) => {
    e.preventDefault();
    if (!canWriteCustomers) {
      showToast('You do not have permission to save customers.', 'error');
      return;
    }
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email || undefined,
        address: { street: customerForm.address },
        creditLimit: Number(customerForm.creditLimit),
        outstandingBalance: Number(customerForm.openingBalance),
        notes: customerForm.notes,
        isActive: customerForm.status === 'Active'
      };

      if (selectedCustomer) {
        await api.put(`/customers/${selectedCustomer._id}`, payload);
      } else {
        await api.post('/customers', payload);
      }

      setIsAddEditModalOpen(false);
      fetchCustomers();
      showToast(selectedCustomer ? 'Client updated successfully' : 'Client registered successfully');
    } catch (error) {
      console.error('Failed to save customer:', error);
      showToast(error.response?.data?.message || error.message || 'Error saving customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!canWriteCustomers) {
      showToast('You do not have permission to delete customers.', 'error');
      return;
    }
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete customer?',
      message: 'Are you sure you want to delete this customer?',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
      showToast('Client deleted successfully');
    } catch (error) {
      console.error('Failed to delete customer:', error);
      showToast(error.response?.data?.message || 'Error deleting customer', 'error');
    }
  };

  const savePayment = async (e) => {
    e.preventDefault();
    if (!canReceiveCustomerPayments) {
      showToast('You do not have permission to receive customer payments.', 'error');
      return;
    }
    if (isSubmitting) return;
    const amount = Number(paymentForm.amount);
    const outstandingBalance = Number(selectedCustomer?.outstandingBalance || 0);

    if (!amount || amount <= 0) {
      showToast('Payment amount must be greater than zero.', 'error');
      return;
    }
    if (outstandingBalance <= 0) {
      showToast('This customer has no outstanding balance to receive.', 'error');
      return;
    }
    if (amount > outstandingBalance) {
      showToast(`Payment cannot exceed customer balance of $${outstandingBalance.toFixed(2)}.`, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/customers/${selectedCustomer._id}/payments`, {
        amount,
        method: paymentForm.method,
        walletId: paymentForm.walletId,
        notes: paymentForm.notes
      });
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'Cash', walletId: '', notes: '' });
      showToast('Payment received and wallet updated');
      fetchCustomers(currentPage, searchTerm);
    } catch (error) {
      console.error('Failed to save payment:', error);
      showToast(error.response?.data?.message || 'Error receiving payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCustomer = (cust) => {
    if (!canExportCustomers) {
      showToast('You do not have permission to export customers.', 'error');
      return;
    }
    const rows = [
      ['Name', cust.name],
      ['Phone', cust.phone || ''],
      ['Email', cust.email || ''],
      ['Address', cust.address?.street || ''],
      ['Outstanding Balance', cust.outstandingBalance || 0],
      ['Credit Limit', cust.creditLimit || 0],
      ['Status', cust.isActive ? 'Active' : 'Inactive']
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `client-${cust.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showToast('Client file exported');
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* 1. Page Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
            <UserCircle size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Customers</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Global Client Registry & Credit Control Hub</p>
          </div>
        </div>
        {canWriteCustomers && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 group border border-slate-700 shadow-xl"
            >
              <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
              Add Customer
            </button>
          </div>
        )}
      </div>

      {/* 2. Search and Filtering Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/20">
          <div className="relative group w-full md:w-[450px]">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by Name or Phone..."
              className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-semibold outline-none focus:ring-8 focus:ring-brand-500/5 transition-all dark:text-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
              {['All', 'With Balance', 'No Balance'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === filter ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-brand-600'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Customers Table */}
        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Identity</th>
                <th className="px-10 py-6">Phone Number</th>
                <th className="px-10 py-6">Ledger Balance</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Row Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((cust) => (
                <tr key={cust._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{cust.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{cust._id.substring(0, 12)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    {cust.phone || 'N/A'}
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                      <p className={`text-lg font-black tabular-nums leading-none ${(cust.outstandingBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${(cust.outstandingBalance || 0).toFixed(2)}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Limit: ${cust.creditLimit || 0}
                      </p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`mx-auto px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit flex items-center gap-2 border shadow-sm ${cust.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cust.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {cust.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {canWriteCustomers && (
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-600 transition-all shadow-sm active:scale-90"
                          title="Edit Customer"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canReceiveCustomerPayments && (
                        <button
                          onClick={() => handleOpenPayment(cust)}
                          className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Receive Payment"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenLedger(cust)}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-amber-600 transition-all shadow-sm active:scale-90"
                        title="View Ledger"
                      >
                        <Receipt size={16} />
                      </button>
                      {canWriteCustomers && (
                        <button
                          onClick={() => handleDeleteCustomer(cust._id)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-300 hover:text-rose-500 transition-all shadow-sm active:scale-90"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔢 Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => fetchCustomers(page, searchTerm)}
        />
      </div>

      {/* 4. Add / Edit Customer Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsAddEditModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[56px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-12 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                  {selectedCustomer ? <Edit2 size={32} /> : <Plus size={32} strokeWidth={3} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                    {selectedCustomer ? 'Edit Client Node' : 'Register New Client'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">Capture unique identifiers and credit parameters.</p>
                </div>
              </div>
              <button onClick={() => setIsAddEditModalOpen(false)} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={saveCustomer} className="p-12 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Legal Name *</label>
                  <input required type="text" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="e.g. Ahmed Yusuf" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number *</label>
                  <input required type="text" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="+252 61 XXX XXXX" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address (Optional)</label>
                  <input type="email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="client@procare.so" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Physical Address</label>
                  <input type="text" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="District, Street..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Opening Balance ($)</label>
                  <input type="number" value={customerForm.openingBalance} onChange={e => setCustomerForm({ ...customerForm, openingBalance: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Credit Limit ($)</label>
                  <input type="number" value={customerForm.creditLimit} onChange={e => setCustomerForm({ ...customerForm, creditLimit: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-rose-500/10 shadow-inner" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Administrative Notes</label>
                  <textarea rows={3} value={customerForm.notes} onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })} placeholder="Add unique client preferences or historical info..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none resize-none" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Status</label>
                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[20px] w-fit">
                    <button type="button" onClick={() => setCustomerForm({ ...customerForm, status: 'Active' })} className={`px-8 py-2.5 rounded-[14px] text-[10px] font-black uppercase transition-all ${customerForm.status === 'Active' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400'}`}>Active</button>
                    <button type="button" onClick={() => setCustomerForm({ ...customerForm, status: 'Inactive' })} className={`px-8 py-2.5 rounded-[14px] text-[10px] font-black uppercase transition-all ${customerForm.status === 'Inactive' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-400'}`}>Inactive</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-10 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="w-full sm:w-auto px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 w-full px-10 py-5 bg-brand-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Processing...' : 'Commit Registry Entry'} <ArrowRight size={20} strokeWidth={3} className={`group-hover:translate-x-1 transition-transform ${isSubmitting ? 'hidden' : ''}`} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {isDetailsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsDetailsModalOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-[44px] bg-white shadow-2xl dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 px-10 py-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-brand-600 text-white flex items-center justify-center font-black text-xl">
                  {selectedCustomer.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase leading-none">{selectedCustomer.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-400">{selectedCustomer.phone || 'No phone recorded'}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Email', selectedCustomer.email || 'N/A'],
                ['Address', selectedCustomer.address?.street || 'N/A'],
                ['Credit Limit', `$${Number(selectedCustomer.creditLimit || 0).toFixed(2)}`],
                ['Outstanding', `$${Number(selectedCustomer.outstandingBalance || 0).toFixed(2)}`],
                ['Status', selectedCustomer.isActive ? 'Active' : 'Inactive'],
                ['Client ID', selectedCustomer._id]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-2 break-words text-sm font-black text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
              {selectedCustomer.notes && (
                <div className="sm:col-span-2 rounded-3xl bg-brand-50 p-5 dark:bg-brand-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-500">Notes</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Ledger Modal */}
      {isLedgerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsLedgerModalOpen(false)} />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[44px] bg-white shadow-2xl dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 px-10 py-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-amber-500 text-white flex items-center justify-center">
                  <Receipt size={26} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase leading-none">Client Ledger</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-400">{selectedCustomer.name}</p>
                </div>
              </div>
              <button onClick={() => setIsLedgerModalOpen(false)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-3xl bg-rose-50 p-5 dark:bg-rose-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Current Balance</p>
                  <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-300">${Number(selectedCustomer.outstandingBalance || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-5 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Payments</p>
                  <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">{ledgerEntries.length}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credit Limit</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">${Number(selectedCustomer.creditLimit || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4">Wallet</th>
                      <th className="px-6 py-4 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ledgerEntries.length ? ledgerEntries.map(entry => (
                      <tr key={entry._id}>
                        <td className="px-6 py-4 text-sm font-bold text-slate-500">{entry.date}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">{entry.reference}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-500">{entry.wallet?.name || 'Wallet'}</td>
                        <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">${Number(entry.credit || 0).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-sm font-bold text-slate-400">No payment history yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {canReceiveCustomerPayments && (
              <button onClick={() => {
                setIsLedgerModalOpen(false);
                handleOpenPayment(selectedCustomer);
              }} className="w-full rounded-3xl bg-emerald-600 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700">
                Receive Payment
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Receive Payment Modal */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl border border-emerald-500/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-950">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-600/30">
                  <DollarSign size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Receive Funds</h3>
                  <p className="text-sm text-emerald-400 mt-2">Posting to: {selectedCustomer.name}</p>
                </div>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={savePayment} className="p-8 space-y-6">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Balance</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">${Number(selectedCustomer.outstandingBalance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Limit</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">${Number(selectedCustomer.creditLimit || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      required
                      autoFocus
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={Number(selectedCustomer.outstandingBalance || 0) || undefined}
                      placeholder="0.00"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all dark:text-white"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
                {Number(paymentForm.amount || 0) > Number(selectedCustomer.outstandingBalance || 0) && (
                  <p className="mt-2 text-xs font-black uppercase tracking-wider text-rose-600">
                    Payment cannot exceed customer balance of ${Number(selectedCustomer.outstandingBalance || 0).toFixed(2)}.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Processing Channel</label>
                <div className="grid grid-cols-2 gap-3 rounded-3xl bg-slate-100 p-1.5 dark:bg-slate-800">
                  {[
                    { id: 'Cash', icon: <Banknote size={18} /> },
                    { id: 'Bank', icon: <Building size={18} /> }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        const nextWallets = method.id === 'Cash' ? wallets : wallets.filter(wallet => wallet.type === 'Bank Account');
                        setPaymentForm({ ...paymentForm, method: method.id, walletId: nextWallets[0]?._id || '' });
                      }}
                      className={`flex items-center justify-center gap-3 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${paymentForm.method === method.id
                        ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                        : 'text-slate-400 hover:text-emerald-600'
                        }`}
                    >
                      {method.icon}
                      {method.id}
                    </button>
                  ))}
                </div>
              </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receiving Wallet</label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{paymentWallets.length} available</span>
                </div>
                {paymentWallets.length > 0 ? (
                  <select
                    required
                    value={paymentForm.walletId}
                    onChange={e => setPaymentForm({ ...paymentForm, walletId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all dark:text-white appearance-none"
                  >
                    <option value="">Select wallet...</option>
                    {paymentWallets.map(wallet => (
                      <option key={wallet._id} value={wallet._id}>
                        {wallet.name} - {wallet.type} (Bal: ${Number(wallet.balance || 0).toFixed(2)})
                      </option>
                      ))}
                  </select>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-800 dark:bg-slate-800/50">
                    <p className="text-sm font-black text-slate-500">No wallets found for {paymentForm.method}.</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Create a wallet in Finance before receiving this payment.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Notes</label>
                <input
                  type="text"
                  placeholder="e.g. October service payment"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-inner"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <button type="submit" disabled={isSubmitting || !paymentForm.walletId || Number(paymentForm.amount || 0) <= 0 || Number(paymentForm.amount || 0) > Number(selectedCustomer.outstandingBalance || 0)} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Saving Payment...' : 'Authorize & Save Payment'} <Check size={20} strokeWidth={3} className="group-hover:scale-125 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomersManagement;
