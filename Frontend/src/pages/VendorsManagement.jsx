import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { useAlert } from '../components/common/alerts/useAlert';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  MoreVertical,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Banknote,
  Receipt,
  CircleOff,
  Smartphone,
  Building,
  DollarSign,
  Info,
  Check,
  Briefcase,
  History,
  Trash2
} from 'lucide-react';

const VendorsManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [vendors, setVendors] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors(1, searchTerm, activeFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, activeFilter]);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchVendors = async (page = 1, search = searchTerm, filter = activeFilter) => {
    try {
      setLoading(true);
      const payable = filter === 'With Payable' ? 'with' : filter === 'No Payable' ? 'none' : '';
      const { data } = await api.get(`/vendors?page=${page}&limit=50&search=${encodeURIComponent(search)}&payable=${payable}`);
      setVendors(data.vendors || []);
      setTotalPages(data.pages || 1);
      setCurrentPage(Number(data.page) || 1);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const { data } = await api.get('/finance/wallets');
      setWallets(Array.isArray(data) ? data.filter(wallet => wallet.status !== 'Disabled') : []);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [ledger, setLedger] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Form states
  const [vendorForm, setVendorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: '0',
    paymentTerms: '',
    notes: '',
    status: 'Active'
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    walletId: '',
    notes: ''
  });

  const filteredVendors = vendors; // Using backend filtering for search now

  const handleOpenAdd = () => {
    setSelectedVendor(null);
    setVendorForm({ name: '', phone: '', email: '', address: '', openingBalance: '0', paymentTerms: '', notes: '', status: 'Active' });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (ven) => {
    setSelectedVendor(ven);
    setVendorForm({
      name: ven.name,
      phone: ven.phone || '',
      email: ven.email || '',
      address: ven.address?.street || '',
      openingBalance: (ven.outstandingBalance || 0).toString(),
      paymentTerms: ven.paymentTerms || '',
      notes: ven.notes || '',
      status: ven.isActive ? 'Active' : 'Inactive'
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenPayment = (ven) => {
    setSelectedVendor(ven);
    setPaymentForm({ amount: '', walletId: wallets[0]?._id || '', notes: '' });
    setIsPaymentModalOpen(true);
  };

  const handleOpenLedger = async (ven) => {
    try {
      setSelectedVendor(ven);
      setLedger(null);
      setIsLedgerModalOpen(true);
      const { data } = await api.get(`/vendors/${ven._id}/ledger`);
      setLedger(data);
    } catch (error) {
      console.error('Failed to load vendor ledger:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to load ledger.',
        buttonText: 'Try again'
      });
      setIsLedgerModalOpen(false);
    }
  };

  const saveVendor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: vendorForm.name,
        phone: vendorForm.phone,
        email: vendorForm.email || undefined,
        address: { street: vendorForm.address },
        outstandingBalance: Number(vendorForm.openingBalance),
        paymentTerms: vendorForm.paymentTerms,
        notes: vendorForm.notes,
        isActive: vendorForm.status === 'Active'
      };

      if (selectedVendor) {
        await api.put(`/vendors/${selectedVendor._id}`, payload);
      } else {
        await api.post('/vendors', payload);
      }

      setIsAddEditModalOpen(false);
      fetchVendors(currentPage);
    } catch (error) {
      console.error('Failed to save vendor:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: `Error saving vendor: ${error.response?.data?.message || error.message}`,
        buttonText: 'Try again'
      });
    }
  };

  const handleDeleteVendor = async (id) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete vendor?',
      message: 'Are you sure you want to delete this vendor?',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/vendors/${id}`);
      fetchVendors(currentPage);
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Error deleting vendor.',
        buttonText: 'Try again'
      });
    }
  };

  const savePayment = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;
    const amount = Number(paymentForm.amount);
    const payableBalance = Number(selectedVendor.outstandingBalance || 0);
    const selectedWallet = wallets.find(wallet => wallet._id === paymentForm.walletId);

    if (!amount || amount <= 0) {
      showAlert({
        type: 'error',
        title: 'Invalid amount',
        message: 'Payment amount must be greater than zero.',
        buttonText: 'OK'
      });
      return;
    }

    if (amount > payableBalance) {
      showAlert({
        type: 'error',
        title: 'Too much payment',
        message: `You cannot pay more than this vendor payable balance of $${payableBalance.toFixed(2)}.`,
        buttonText: 'OK'
      });
      return;
    }

    if (!selectedWallet) {
      showAlert({
        type: 'error',
        title: 'Select wallet',
        message: 'Please select a wallet to make this payment.',
        buttonText: 'OK'
      });
      return;
    }

    if (amount > Number(selectedWallet.balance || 0)) {
      showAlert({
        type: 'error',
        title: 'Not enough money',
        message: `${selectedWallet.name} has only $${Number(selectedWallet.balance || 0).toFixed(2)} available.`,
        buttonText: 'OK'
      });
      return;
    }

    try {
      setIsSaving(true);
      await api.post(`/vendors/${selectedVendor._id}/payments`, {
        amount,
        walletId: paymentForm.walletId,
        notes: paymentForm.notes,
        date: new Date().toISOString().slice(0, 10)
      });
      setIsPaymentModalOpen(false);
      await Promise.all([fetchVendors(currentPage), fetchWallets()]);
    } catch (error) {
      console.error('Failed to save payment:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to save payment.',
        buttonText: 'Try again'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalPayable = vendors.reduce((sum, vendor) => sum + Math.max(0, vendor.outstandingBalance || 0), 0);
  const activeVendors = vendors.filter(vendor => vendor.isActive).length;
  const inactiveVendors = vendors.length - activeVendors;
  const selectedPaymentWallet = wallets.find(wallet => wallet._id === paymentForm.walletId);
  const paymentAmount = Number(paymentForm.amount) || 0;
  const selectedVendorPayable = Number(selectedVendor?.outstandingBalance || 0);

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Page Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
            <Truck size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Vendors</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Supply Chain registry & accounts payable Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 group border border-slate-700 shadow-xl"
          >
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Add Vendor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Vendors</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{vendors.length}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{activeVendors} active, {inactiveVendors} inactive</p>
        </div>
        <div className="premium-card p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding Payable</p>
          <p className="mt-2 text-3xl font-black text-rose-600">${totalPayable.toFixed(2)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Across current filtered list</p>
        </div>
        <div className="premium-card p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Wallets</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{wallets.length}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Available for supplier payments</p>
        </div>
      </div>

      {/* Search and Filtering Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/20">
          <div className="relative group w-full md:w-[450px]">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by Vendor Name or Phone..."
              className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-semibold outline-none focus:ring-8 focus:ring-brand-500/5 transition-all dark:text-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
              {['All', 'With Payable', 'No Payable'].map(filter => (
                <button
                  key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === filter ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-brand-600'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Vendor Identity</th>
                <th className="px-10 py-6">Phone Number</th>
                <th className="px-10 py-6">Outstanding Payable</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Row Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-10 py-20 text-center text-sm font-black uppercase tracking-widest text-slate-400">Loading vendors...</td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-10 py-20 text-center text-sm font-black uppercase tracking-widest text-slate-400">No vendors found.</td>
                </tr>
              ) : filteredVendors.map((ven) => (
                <tr key={ven._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors rounded-2xl shadow-inner group-hover:scale-110">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{ven.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{ven._id.substring(0, 12)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    {ven.phone || 'N/A'}
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                      <p className={`text-lg font-black tabular-nums leading-none ${(ven.outstandingBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${(ven.outstandingBalance || 0).toFixed(2)}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Terms: {ven.paymentTerms || 'Standard'}
                      </p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`mx-auto px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit flex items-center gap-2 border shadow-sm ${ven.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ven.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {ven.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(ven)}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-600 transition-all shadow-sm active:scale-90"
                        title="Edit Vendor"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenPayment(ven)}
                        className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/50 rounded-xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                        title="Make Payment"
                      >
                        <Banknote size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenLedger(ven)}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-amber-600 transition-all shadow-sm active:scale-90"
                        title="View Ledger"
                      >
                        <Receipt size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(ven._id)}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-300 hover:text-rose-500 transition-all shadow-sm active:scale-90"
                        title="Delete Vendor"
                      >
                        <Trash2 size={16} />
                      </button>
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
          onPageChange={(page) => fetchVendors(page, searchTerm, activeFilter)}
        />
      </div>

      {/* Add / Edit Vendor Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsAddEditModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[56px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-12 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                  {selectedVendor ? <Edit2 size={32} /> : <Plus size={32} strokeWidth={3} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                    {selectedVendor ? 'Edit Partner Node' : 'Register Supplier'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">Configure procurement parameters and payment terms.</p>
                </div>
              </div>
              <button onClick={() => setIsAddEditModalOpen(false)} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={saveVendor} className="p-12 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vendor Name *</label>
                  <input required type="text" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} placeholder="e.g. Somali Beauty Supplies" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number *</label>
                  <input required type="text" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} placeholder="+252 61 XXX XXXX" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                  <input type="email" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} placeholder="accounts@supplier.so" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Address</label>
                  <input type="text" value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} placeholder="Market, District..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Opening Payable ($)</label>
                  <input type="number" value={vendorForm.openingBalance} onChange={e => setVendorForm({ ...vendorForm, openingBalance: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-rose-500/10 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Terms</label>
                  <input type="text" value={vendorForm.paymentTerms} onChange={e => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })} placeholder="e.g. Net 30, COD..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none shadow-inner" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Administrative Notes</label>
                  <textarea rows={3} value={vendorForm.notes} onChange={e => setVendorForm({ ...vendorForm, notes: e.target.value })} placeholder="Specific supply categories or contract details..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none resize-none" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vendor Status</label>
                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[20px] w-fit">
                    <button type="button" onClick={() => setVendorForm({ ...vendorForm, status: 'Active' })} className={`px-8 py-2.5 rounded-[14px] text-[10px] font-black uppercase transition-all ${vendorForm.status === 'Active' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400'}`}>Active</button>
                    <button type="button" onClick={() => setVendorForm({ ...vendorForm, status: 'Inactive' })} className={`px-8 py-2.5 rounded-[14px] text-[10px] font-black uppercase transition-all ${vendorForm.status === 'Inactive' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-400'}`}>Inactive</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-10 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="w-full sm:w-auto px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 w-full px-10 py-5 bg-brand-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group">
                  Commit Supplier Entry <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Payment Modal */}
      {isPaymentModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md animate-in fade-in" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 md:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20">
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Make Vendor Payment</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Record disbursement and update payable balance</p>
                </div>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="rounded-2xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800"><X size={22} /></button>
            </div>

            <form onSubmit={savePayment} className="grid max-h-[82vh] overflow-y-auto md:grid-cols-[0.9fr_1.1fr] custom-scrollbar">
              <aside className="relative overflow-hidden bg-slate-950 p-7 text-white md:p-8">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(30deg, rgba(255,255,255,.18) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,.18) 87.5%, rgba(255,255,255,.18))', backgroundSize: '56px 96px' }} />
                <div className="relative space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-300">Supplier</p>
                    <h4 className="mt-2 text-3xl font-black tracking-tight">{selectedVendor.name}</h4>
                    <p className="mt-2 text-sm font-semibold text-slate-400">{selectedVendor.phone || 'No phone'}{selectedVendor.email ? ` • ${selectedVendor.email}` : ''}</p>
                  </div>

                  <div className="rounded-3xl bg-white/8 p-5 ring-1 ring-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Payable</p>
                    <p className="mt-2 text-4xl font-black tabular-nums text-rose-300">${(selectedVendor.outstandingBalance || 0).toFixed(2)}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">Payment will reduce this balance after it is saved.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Terms</p>
                      <p className="mt-1 text-sm font-black">{selectedVendor.paymentTerms || 'Standard'}</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status</p>
                      <p className={`mt-1 text-sm font-black ${selectedVendor.isActive ? 'text-emerald-300' : 'text-rose-300'}`}>{selectedVendor.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="space-y-7 p-7 md:p-8">
                <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Amount</label>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm dark:bg-slate-900">
                      <DollarSign size={26} />
                    </div>
                    <input
                      required
                      autoFocus
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={selectedVendorPayable || undefined}
                      placeholder="0.00"
                      className="min-w-0 flex-1 border-none bg-transparent p-0 text-4xl font-black tabular-nums text-slate-900 shadow-none outline-none placeholder:text-slate-300 focus:ring-0 dark:text-white dark:placeholder:text-slate-700"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    />
                  </div>
                  {paymentAmount > selectedVendorPayable && (
                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-rose-600">
                      Payment cannot exceed payable balance of ${selectedVendorPayable.toFixed(2)}.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pay From Wallet</label>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{wallets.length} available</span>
                  </div>
                  {wallets.length === 0 ? (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                      No active wallets found. Create a wallet before recording vendor payments.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {wallets.map((wallet) => (
                        <button
                          key={wallet._id}
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, walletId: wallet._id })}
                          className={`flex items-center gap-4 rounded-3xl border p-4 text-left transition-all ${paymentForm.walletId === wallet._id
                            ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-lg shadow-rose-500/10 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'
                            : 'border-slate-100 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-rose-500/30'
                            }`}
                        >
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${paymentForm.walletId === wallet._id ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                            {wallet.type === 'Bank Account' ? <Building size={20} /> : wallet.type === 'Mobile Money' ? <Smartphone size={20} /> : <Banknote size={20} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black">{wallet.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{wallet.type}</p>
                          </div>
                          <p className="shrink-0 text-sm font-black tabular-nums">${(wallet.balance || 0).toFixed(2)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Example: Settling supplier balance for latest delivery"
                    className="w-full resize-none rounded-3xl bg-slate-50 px-5 py-4 text-sm font-bold dark:bg-slate-950/40"
                    value={paymentForm.notes}
                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-500">Payment amount</span>
                    <span className="text-slate-900 dark:text-white">${paymentAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-500">Remaining payable</span>
                    <span className="text-rose-600">${Math.max(0, selectedVendorPayable - paymentAmount).toFixed(2)}</span>
                  </div>
                  {selectedPaymentWallet && paymentAmount > Number(selectedPaymentWallet.balance || 0) && (
                    <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-black uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                      Not enough money. {selectedPaymentWallet.name} has ${Number(selectedPaymentWallet.balance || 0).toFixed(2)}.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="rounded-3xl bg-slate-100 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button>
                  <button type="submit" disabled={isSaving || wallets.length === 0 || paymentAmount <= 0 || paymentAmount > selectedVendorPayable || (selectedPaymentWallet && paymentAmount > Number(selectedPaymentWallet.balance || 0))} className="flex flex-1 items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-4 text-xs font-black uppercase tracking-[0.22em] text-white shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSaving ? 'Saving Payment...' : 'Save Payment'} <Check size={18} strokeWidth={3} />
                  </button>
                </div>
              </section>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger Modal */}
      {isLedgerModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md animate-in fade-in" onClick={() => setIsLedgerModalOpen(false)} />
          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl">
                  <Receipt size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Vendor Ledger</h3>
                  <p className="text-sm text-slate-400 mt-2">{selectedVendor.name}</p>
                </div>
              </div>
              <button onClick={() => setIsLedgerModalOpen(false)} className="p-3 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={22} /></button>
            </div>

            <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {!ledger ? (
                <div className="py-20 text-center text-sm font-black uppercase tracking-widest text-slate-400">Loading ledger...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="premium-card p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purchases</p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">${(ledger.summary?.purchases || 0).toFixed(2)}</p>
                    </div>
                    <div className="premium-card p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payments</p>
                      <p className="mt-2 text-2xl font-black text-emerald-600">${(ledger.summary?.payments || 0).toFixed(2)}</p>
                    </div>
                    <div className="premium-card p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding</p>
                      <p className="mt-2 text-2xl font-black text-rose-600">${(ledger.summary?.outstandingBalance || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Reference</th>
                          <th>Debit</th>
                          <th>Credit</th>
                          <th>Status</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.entries?.length ? ledger.entries.map(entry => (
                          <tr key={`${entry.type}-${entry.id}`}>
                            <td className="font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-pill ${entry.type === 'Payment' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'}`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="font-black text-slate-900 dark:text-white">{entry.reference}</td>
                            <td className="font-black text-rose-600 tabular-nums">${(entry.debit || 0).toFixed(2)}</td>
                            <td className="font-black text-emerald-600 tabular-nums">${(entry.credit || 0).toFixed(2)}</td>
                            <td className="text-xs font-black uppercase tracking-wider text-slate-400">{entry.status}</td>
                            <td className="text-sm font-medium text-slate-500">{entry.note}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-sm font-bold text-slate-400">No ledger entries yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Partner Terms Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsTermsModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-[40px] bg-white p-8 shadow-2xl dark:bg-slate-900">
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Partner Terms Guide</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">Use clear terms like COD, Net 7, Net 15, Net 30, or custom contract notes.</p>
              </div>
              <button onClick={() => setIsTermsModalOpen(false)} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['COD - paid on delivery', 'Net 7 - pay within 7 days', 'Net 15 - pay within 15 days', 'Net 30 - pay within 30 days'].map(term => (
                <div key={term} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{term}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Integrity Bar */}
      <div className="p-8 bg-slate-50 dark:bg-slate-950/40 rounded-[48px] border border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <Info size={20} className="text-brand-500 shrink-0" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            Procurement datasets are synchronized with <span className="text-brand-500">Global Ledger Nodes</span>. Any liability adjustments for the current period require <span className="text-rose-500">Authorized Reconciliation</span>.
          </p>
        </div>
        <button onClick={() => setIsTermsModalOpen(true)} className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600 transition-all shadow-sm shrink-0">
          Review Partner Terms
        </button>
      </div>
    </div>
  );
};

export default VendorsManagement;
