import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Truck,
  Calendar,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  FileText,
  X,
  ArrowRight,
  TrendingUp,
  Trash2,
  Building2,
  CreditCard,
  Banknote,
  Receipt,
  Calculator,
  RefreshCw,
  Command,
  Eye,
  History,
  ShieldCheck,
  Download,
  FileDown,
  Edit2,
  ChevronLeft,
  Paperclip,
  Printer,
  Wallet,
  Tag,
  Scale,
  Percent,
  Save,
  ArrowRightLeft,
  AlertCircle,
  MapPin,
  Check
} from 'lucide-react';

const MOCK_PURCHASES = [
  { id: 'PO-8821', date: 'Oct 24, 2024', vendor: 'Somali Beauty Supplies', invoiceNo: 'SBS-99021', paymentType: 'Cash', warehouse: 'Mogadishu Main', total: 1240.00, paid: 1240.00, balance: 0, status: 'Received' },
  { id: 'PO-8820', date: 'Oct 22, 2024', vendor: 'Iron Core Gear', invoiceNo: 'ICG-771', paymentType: 'Credit', warehouse: 'Central Warehouse', total: 3500.00, paid: 1500.00, balance: 2000.00, status: 'Pending' },
];

import api from '../services/api';
import Pagination from '../components/Pagination';
import { useAlert } from '../components/common/alerts/useAlert';

const getUnitValue = (unit) => {
  if (!unit) return '';
  const value = typeof unit === 'string'
    ? unit
    : unit.symbol || unit.shortCode || unit.code || unit.name || '';
  return String(value).trim();
};

const getProductUnit = (product) => getUnitValue(product?.unit || product?.unitOfMeasure || product?.unitId);

const getUnitOptions = (units, selectedUnit = '') => {
  const values = units.map(getUnitValue).filter(Boolean);
  const selected = getUnitValue(selectedUnit);
  if (selected && !values.some(value => value.toLowerCase() === selected.toLowerCase())) {
    values.unshift(selected);
  }
  return Array.from(new Map(values.map(value => [value.toLowerCase(), value])).values());
};

const InventoryPurchase = () => {
  const { showAlert, showConfirm: openConfirm } = useAlert();
  const navigate = useNavigate();
  const [view, setView] = useState('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Real Data State
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]); // Fetch units for dropdown
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [financeWallets, setFinanceWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [warehouses, setBranches] = useState([]);

  // UI State
  const [walletAlert, setWalletAlert] = useState({ show: false, title: '', message: '', walletName: '', available: 0, required: 0 });
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);
  const [ledgerModal, setLedgerModal] = useState({ show: false, purchase: null });

  const showToast = (message, type = 'success') => {
    showAlert({
      type,
      title: type === 'error' ? 'Uh oh!' : type === 'info' ? 'Notice' : 'Woohoo!',
      message,
      buttonText: type === 'error' ? 'Try again' : 'Continue'
    });
  };

  const showConfirm = (title, message, onConfirm, isDestructive = false) => {
    openConfirm({
      type: 'warning',
      title,
      message,
      confirmText: isDestructive ? 'Yes, delete' : 'Confirm',
      cancelText: 'Cancel',
      danger: isDestructive
    }).then(ok => {
      if (ok) onConfirm?.();
    });
  };

  const formatCurrency = (value) => `$${(Number(value) || 0).toFixed(2)}`;

  const showWalletAlert = ({ title = 'Payment Blocked', message, walletName = '', available = 0, required = 0 }) => {
    setWalletAlert({ show: true, title, message, walletName, available, required });
  };


  // Form State
  const [formData, setFormData] = useState({
    vendor: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expectedArrivalDate: '',
    invoiceNo: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    paymentStatus: 'due', // NEW: 'due' or 'paid'
    payingBy: 'cash',    // NEW: 'cash', 'cheque', 'other'
    paymentType: 'Credit', // Internal mapper for backend
    dueDate: '',
    items: [],
    taxPercent: 5,
    discountAmount: 0,
    status: 'Completed',
    warehouseId: '',
    paymentAccountId: '',
    amountPaid: 0        // Link to the user's "amount" input
  });

  const resetPurchaseForm = () => {
    setEditingPurchaseId(null);
    setFormData({
      vendor: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      expectedArrivalDate: '',
      invoiceNo: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentType: 'Cash',
      paymentStatus: 'due',
      payingBy: 'cash',
      amountPaid: 0,
      dueDate: '',
      items: [],
      taxPercent: 5,
      discountAmount: 0,
      status: 'Completed',
      warehouseId: warehouses.find(b => b.is_default)?._id || warehouses[0]?._id || '',
      paymentAccountId: ''
    });
  };

  const fetchData = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const [purchasesRes, productsRes, unitsRes, vendorsRes, accountsRes, branchesRes, walletsRes] = await Promise.all([
        api.get(`/purchases?page=${page}&limit=50&search=${search}`),
        api.get('/products?limit=1000'),
        api.get('/units'),
        api.get('/vendors'),
        api.get('/accounts'),
        api.get('/warehouses'),
        api.get('/finance/wallets')
      ]);
      setPurchases(purchasesRes.data.purchases || []);
      setTotalPages(purchasesRes.data.pages || 1);
      setCurrentPage(Number(purchasesRes.data.page) || 1);
      setProducts(productsRes.data.products || []);
      setUnits(unitsRes.data);
      setVendors(vendorsRes.data.vendors || vendorsRes.data);
      setAccounts(accountsRes.data || []);
      setFinanceWallets(walletsRes.data.wallets || walletsRes.data || []);

      const branchesList = branchesRes.data.warehouses || branchesRes.data;
      setBranches(branchesList);

      // Set default warehouse if not already set
      if (!formData.warehouseId) {
        const defaultBranch = branchesList.find(b => b.is_default) || branchesList[0];
        if (defaultBranch) {
          setFormData(prev => ({ ...prev, warehouseId: defaultBranch._id }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);



  const [isQuickVendorModalOpen, setIsQuickVendorModalOpen] = useState(false);
  const [quickVendorForm, setQuickVendorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: '0',
    paymentTerms: '',
    notes: '',
    status: 'Active'
  });

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    paymentAccountId: '',
    notes: ''
  });

  const handleQuickAddVendor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: quickVendorForm.name,
        phone: quickVendorForm.phone,
        email: quickVendorForm.email || undefined,
        address: { street: quickVendorForm.address },
        outstandingBalance: Number(quickVendorForm.openingBalance),
        paymentTerms: quickVendorForm.paymentTerms,
        notes: quickVendorForm.notes,
        isActive: quickVendorForm.status === 'Active'
      };
      const { data } = await api.post('/vendors', payload);
      setVendors([...vendors, data]);
      setFormData({ ...formData, vendor: data.name });
      setIsQuickVendorModalOpen(false);
      setQuickVendorForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        openingBalance: '0',
        paymentTerms: '',
        notes: '',
        status: 'Active'
      });
      showToast('New vendor registered successfully');
    } catch (error) {
      console.error('Failed to create vendor:', error);
      showToast(error.response?.data?.message || 'Error creating vendor', 'error');
    }
  };

  const openPaymentModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPaymentForm({
      amount: purchase.balance || 0,
      paymentMethod: 'Cash',
      paymentAccountId: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
    setActiveMenuId(null);
  };

  const openViewModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsViewModalOpen(true);
    setActiveMenuId(null);
  };

  const openLedgerModal = (purchase) => {
    setLedgerModal({ show: true, purchase });
    setActiveMenuId(null);
  };

  const handleEditPurchase = (purchase) => {
    setActiveMenuId(null);

    const vendorName = purchase.supplier || '';
    const walletId = purchase.paymentAccountId?._id || purchase.paymentAccountId || '';
    const paidAmount = Number(purchase.amountPaid) || 0;

    setEditingPurchaseId(purchase._id);
    setFormData({
      vendor: vendorName,
      purchaseDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedArrivalDate: purchase.expectedArrivalDate ? new Date(purchase.expectedArrivalDate).toISOString().split('T')[0] : '',
      invoiceNo: purchase.invoiceNo || '',
      paymentStatus: paidAmount > 0 && Number(purchase.balance || 0) <= 0 ? 'paid' : 'due',
      payingBy: purchase.paymentMethod || 'cash',
      paymentType: purchase.paymentMethod || 'Credit',
      dueDate: purchase.dueDate ? new Date(purchase.dueDate).toISOString().split('T')[0] : '',
      items: (purchase.items || []).map(item => ({
        id: item._id || Math.random().toString(36).substr(2, 9),
        productId: item.product?._id || item.product || '',
        name: item.productName || item.name || item.product?.name || '',
        unit: item.unit || getProductUnit(item.product),
        qty: Number(item.quantity || item.qty || 1),
        cost: Number(item.cost || 0)
      })),
      taxPercent: purchase.totalCost ? Math.round(((Number(purchase.taxAmount) || 0) / Math.max(Number(purchase.totalCost) - (Number(purchase.taxAmount) || 0) + (Number(purchase.discountAmount) || 0), 1)) * 100) : 5,
      discountAmount: Number(purchase.discountAmount) || 0,
      status: purchase.status || 'Pending',
      warehouseId: purchase.warehouseId?._id || purchase.warehouseId || '',
      paymentAccountId: walletId,
      amountPaid: paidAmount,
      notes: purchase.notes || ''
    });
    setView('CREATE');
  };


  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    try {
      await api.post(`/purchases/${selectedPurchase._id}/payments`, {
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentAccountId: paymentForm.paymentAccountId,
        notes: paymentForm.notes
      });
      showToast('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      fetchData(currentPage, searchTerm); // Refresh list
    } catch (error) {
      console.error('Failed to record payment', error);
      showToast(error.response?.data?.message || 'Error recording payment', 'error');
    }
  };

  const toggleMenu = (id) => setActiveMenuId(activeMenuId === id ? null : id);

  const addItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: '',
      name: '',
      unit: '',
      qty: 1,
      cost: 0
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const removeItem = (id) => {
    setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });
  };

  const updateItem = (id, updates) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((acc, item) => acc + (item.qty * item.cost), 0);
    const totalQuantity = formData.items.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
    const tax = subtotal * (formData.taxPercent / 100);
    const total = subtotal + tax - formData.discountAmount;
    return { subtotal, tax, total, totalQuantity, itemCount: formData.items.length };
  }, [formData.items, formData.taxPercent, formData.discountAmount]);

  const financialAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (acc.type !== 'Asset') return false;
      const parent = accounts.find(p => p._id === acc.parentAccount);
      if (!parent) return false;
      // Only show sub-accounts of "Cash on Hand" (1010) and "Bank Account" (1020)
      return ['1010', '1020'].includes(parent.code);
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts]);

  const selectedPaymentWallet = useMemo(() => {
    if (!formData.paymentAccountId) return null;
    return financeWallets.find(wallet => wallet._id === formData.paymentAccountId) || null;
  }, [financeWallets, formData.paymentAccountId]);

  // Sync amountPaid with total when 'paid' is selected
  useEffect(() => {
    if (formData.paymentStatus === 'paid') {
      setFormData(prev => ({ ...prev, amountPaid: totals.total }));
    }
  }, [totals.total, formData.paymentStatus]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (status = 'Pending') => {
    if (isSaving) return;

    // Validation
    // Validation
    if (!formData.vendor) {
      showToast("Please select a vendor", 'error');
      return;
    }
    if (!formData.warehouseId) {
      showToast("Please select a receiving warehouse", 'error');
      return;
    }
    if (formData.items.length === 0) {
      showToast("Please add at least one item to the purchase", 'error');
      return;
    }
    if (formData.items.some(item => !item.productId && !item.name)) {
      showToast("Please ensure all items have a product selected or a name entered", 'error');
      return;
    }
    if (formData.discountAmount > (totals.subtotal + totals.tax)) {
      showToast(`Invalid Discount: Discount ($${formData.discountAmount}) cannot be greater than the gross total ($${(totals.subtotal + totals.tax).toFixed(2)})`, 'error');
      return;
    }

    const amountPaid = Number(formData.amountPaid) || 0;
    if (amountPaid > 0 && !formData.paymentAccountId) {
      showWalletAlert({
        title: 'Select Payment Wallet',
        message: 'Choose the wallet or bank account that will pay this purchase before saving it.',
        required: amountPaid
      });
      return;
    }

    if (selectedPaymentWallet && amountPaid > Number(selectedPaymentWallet.balance || 0)) {
      showWalletAlert({
        message: `This purchase needs ${formatCurrency(amountPaid)}, but ${selectedPaymentWallet.name} only has ${formatCurrency(selectedPaymentWallet.balance)} available. Add funds, choose another wallet, or reduce the paid amount.`,
        walletName: selectedPaymentWallet.name,
        available: selectedPaymentWallet.balance,
        required: amountPaid
      });
      return;
    }

    try {
      setIsSaving(true);
      const selectedVendorObj = vendors.find(v => v.name === formData.vendor);

      const payload = {
        warehouseId: formData.warehouseId,
        supplier: formData.vendor,
        vendorId: selectedVendorObj ? selectedVendorObj._id : null,
        purchaseDate: formData.purchaseDate,
        expectedArrivalDate: formData.expectedArrivalDate || null,
        invoiceNo: formData.invoiceNo,
        paymentMethod: formData.paymentStatus === 'due' ? 'Credit' : (formData.payingBy || 'Cash'),
        totalCost: totals.total,
        taxAmount: totals.tax,
        discountAmount: formData.discountAmount,
        amountPaid,
        balance: totals.total - amountPaid,
        dueDate: formData.dueDate || null,
        notes: formData.notes || '',
        status,
        items: formData.items.map(item => ({
          product: item.productId || null, // Can be null for custom items
          productName: item.name,
          unit: item.unit,
          quantity: Number(item.qty),
          cost: Number(item.cost)
        })),
        paymentAccountId: formData.paymentAccountId
      };
      console.log('Sending purchase payload:', payload);
      if (editingPurchaseId) {
        await api.put(`/purchases/${editingPurchaseId}`, payload);
        showToast('Purchase Order Updated Successfully');
      } else {
        await api.post('/purchases', payload);
        showToast('Woohoo!');
      }
      setView('LIST');
      resetPurchaseForm();
      fetchData(currentPage, searchTerm);
    } catch (error) {
      console.error("Failed to save purchase", error);
      const message = error.response?.data?.message || "Failed to save purchase";
      if (message.toLowerCase().includes('insufficient funds')) {
        showWalletAlert({
          message,
          walletName: selectedPaymentWallet?.name || 'Selected wallet',
          available: selectedPaymentWallet?.balance || 0,
          required: amountPaid
        });
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePurchase = async (id) => {
    setActiveMenuId(null);
    showConfirm(
      'Purge Purchase Record',
      'Are you sure you want to purge this record? This will reverse inventory changes and void associated journal entries. This action cannot be undone.',
      async () => {
        try {
          await api.delete(`/purchases/${id}`);
          fetchData(currentPage, searchTerm);
          showToast('Record purged successfully');
        } catch (error) {
          console.error('Failed to delete purchase', error);
          showToast(error.response?.data?.message || 'Error purging record', 'error');
        }
      },
      true
    );
  };

  const handleExport = () => {
    if (!purchases.length) return showToast("No records to export", 'error');

    const headers = ["Date", "Invoice No", "Supplier", "Warehouse", "Total Cost", "Amount Paid", "Balance", "Status"];
    const csvContent = [
      headers.join(","),
      ...purchases.map(p => [
        new Date(p.purchaseDate).toLocaleDateString(),
        p.invoiceNo,
        `"${p.supplier}"`, // Quote to handle commas in names
        `"${warehouses.find(b => b._id === p.warehouseId)?.name || ''}"`,
        p.totalCost,
        p.amountPaid || 0,
        p.balance,
        p.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `purchases_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPurchaseVoucher = (purchase) => {
    setActiveMenuId(null);
    const rows = (purchase.items || []).map(item => {
      const qty = Number(item.quantity || item.qty || 0);
      const cost = Number(item.cost || 0);
      return `
        <tr>
          <td>${item.productName || item.name || item.product?.name || 'Item'}</td>
          <td>${qty}</td>
          <td>$${cost.toFixed(2)}</td>
          <td>$${(qty * cost).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Purchase Voucher ${purchase.invoiceNo || purchase.poNumber || purchase._id}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .muted { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
            .summary { width: 320px; margin-left: auto; margin-top: 24px; }
            .line { display: flex; justify-content: space-between; padding: 8px 0; }
            .total { font-weight: 800; font-size: 18px; border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Purchase Voucher</h1>
              <p class="muted">${purchase.invoiceNo || purchase.poNumber || purchase._id}</p>
            </div>
            <div>
              <p><strong>Date:</strong> ${new Date(purchase.purchaseDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${purchase.status}</p>
            </div>
          </div>
          <p><strong>Supplier:</strong> ${purchase.supplier || 'Unknown'}</p>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Cost</th><th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="summary">
            <div class="line"><span>Tax</span><strong>$${Number(purchase.taxAmount || 0).toFixed(2)}</strong></div>
            <div class="line"><span>Discount</span><strong>$${Number(purchase.discountAmount || 0).toFixed(2)}</strong></div>
            <div class="line"><span>Paid</span><strong>$${Number(purchase.amountPaid || 0).toFixed(2)}</strong></div>
            <div class="line"><span>Balance</span><strong>$${Number(purchase.balance || 0).toFixed(2)}</strong></div>
            <div class="line total"><span>Total</span><strong>$${Number(purchase.totalCost || 0).toFixed(2)}</strong></div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `purchase-voucher-${purchase.invoiceNo || purchase.poNumber || purchase._id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showToast('Voucher downloaded successfully');
  };

  return (
    <>
      {view === 'CREATE' ? (
        <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4 duration-500 pb-24">
          {/* Header Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  resetPurchaseForm();
                  setView('LIST');
                }}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[22px] text-slate-400 hover:text-brand-600 transition-all shadow-sm"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{editingPurchaseId ? 'Edit Purchase' : 'Add Purchase'}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">{editingPurchaseId ? 'Update Purchase Entry' : 'Create a New Entry'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                <Paperclip size={14} /> Attach Invoice
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                <Printer size={14} /> Print Draft
              </button>
            </div>
          </div>

          <div className="space-y-8 max-w-[1200px] mx-auto">
            {/* Main Form Area */}
            <div className="space-y-8">
              {/* 🏷️ Purchase Form: Header Section */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
                  <h3 className="text-lg font-black dark:text-white flex items-center gap-3 tracking-tight uppercase">
                    <Truck size={20} className="text-brand-500" /> Purchase Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* 4 Inputs in Header */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Date</label>
                    <div className="relative group">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={formData.purchaseDate}
                        onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Invoice No</label>
                    <div className="relative group">
                      <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="INV-XXXXX"
                        value={formData.invoiceNo}
                        onChange={e => setFormData({ ...formData, invoiceNo: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receiving Warehouse</label>
                    <div className="relative group">
                      <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={formData.warehouseId}
                        onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner appearance-none transition-all focus:ring-4 focus:ring-brand-500/5"
                      >
                        {warehouses.map(warehouse => (
                          <option key={warehouse._id} value={warehouse._id}>
                            {warehouse.name} {warehouse.is_default ? '(Main)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Vendor</label>
                    <div className="flex gap-2">
                      <div className="relative group flex-1">
                        <Truck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          value={formData.vendor}
                          onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                          className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-bold border-none outline-none dark:text-white shadow-inner appearance-none"
                        >
                          <option value="">Select Vendor...</option>
                          {vendors.length > 0 ? (
                            Array.from(new Map(vendors.map(v => [v.name, v])).values()).map(v => (
                              <option key={v._id} value={v.name}>{v.name}</option>
                            ))
                          ) : (
                            <option disabled>No Vendors Found</option>
                          )}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsQuickVendorModalOpen(true)}
                        className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl transition-all shadow-lg"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Arrival</label>
                    <div className="relative group">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={formData.expectedArrivalDate}
                        onChange={e => setFormData({ ...formData, expectedArrivalDate: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 📋 Purchase Items Table */}
              <div className="bg-white dark:bg-slate-900 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between">
                  <h3 className="text-lg font-black dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Package size={20} className="text-amber-500" /> Order Items
                  </h3>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={14} strokeWidth={3} /> Add Item
                  </button>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10">
                        <th className="px-8 py-5">Product Name</th>
                        <th className="px-4 py-5 text-center">Unit</th>
                        <th className="px-4 py-5 text-center">Qty</th>
                        <th className="px-4 py-5 text-right">Cost ($)</th>
                        <th className="px-6 py-5 text-right">Line Total</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center opacity-30">
                            <p className="text-xs font-black uppercase tracking-widest italic">Order list is empty</p>
                          </td>
                        </tr>
                      ) : (
                        formData.items.map((item) => (
                          <tr key={item.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                            <td className="px-8 py-6">
                              <select
                                className="w-full bg-transparent border-none outline-none text-sm font-black dark:text-white uppercase tracking-tight"
                                value={item.productId}
                                onChange={e => {
                                  const prod = products.find(p => p._id === e.target.value);
                                  updateItem(item.id, {
                                    productId: e.target.value,
                                    name: prod?.name || '',
                                    unit: getProductUnit(prod), // Auto-fill unit
                                    cost: prod?.cost || 0
                                  });
                                }}
                              >
                                <option value="">Select Product...</option>
                                {products.length > 0 ? (
                                  products.map(p => (
                                    <option key={p._id} value={p._id}>
                                      {p.name} (SKU: {p.sku}){getProductUnit(p) ? ` - ${getProductUnit(p)}` : ''}
                                    </option>
                                  ))
                                ) : (
                                  <option disabled>No Products Found</option>
                                )}
                              </select>
                            </td>
                            <td className="px-4 py-6 text-center">
                              <select
                                value={item.unit}
                                onChange={e => updateItem(item.id, { unit: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-[9px] font-black uppercase outline-none dark:text-brand-400 border border-slate-100 dark:border-slate-700"
                              >
                                <option value="">Unit</option>
                                {getUnitOptions(units, item.unit).map(unitValue => (
                                  <option key={unitValue} value={unitValue}>{unitValue}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-6 text-center">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={e => updateItem(item.id, { qty: Number(e.target.value) })}
                                className="w-16 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm font-black dark:text-white text-center shadow-inner"
                              />
                            </td>
                            <td className="px-4 py-6 text-right">
                              <input
                                type="number"
                                value={item.cost}
                                onChange={e => updateItem(item.id, { cost: Number(e.target.value) })}
                                className="w-24 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm font-black dark:text-white text-right shadow-inner"
                              />
                            </td>
                            <td className="px-6 py-6 text-right">
                              <span className="text-sm font-black dark:text-white tabular-nums">
                                ${(item.qty * item.cost).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {formData.items.length > 0 && (
                      <tfoot className="border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <tr>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Items</span>
                              <span className="text-sm font-black dark:text-white uppercase">{totals.itemCount} Lines Registered</span>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-center text-slate-400 font-bold">—</td>
                          <td className="px-4 py-5 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Qty</span>
                              <span className="text-sm font-black dark:text-brand-400 tabular-nums">{totals.totalQuantity} Units</span>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-right">
                            {formData.discountAmount > 0 && (
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Total Discount</span>
                                <span className="text-sm font-black text-rose-500 tabular-nums">-${formData.discountAmount.toFixed(2)}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right bg-slate-100/50 dark:bg-slate-800/50">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                              <span className="text-base font-black dark:text-white tabular-nums">${totals.subtotal.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>

            {/* 💰 Payment & Settlement Protocol */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-4 flex items-center gap-3">
                <Wallet size={16} className="text-brand-500" /> Payment Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 1. Order Tax */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Tax (VAT)</label>
                  <select
                    value={formData.taxPercent}
                    onChange={e => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner appearance-none"
                  >
                    <option value="0">No VAT</option>
                    <option value="5">VAT @ 5%</option>
                  </select>
                </div>

                {/* 2. Order Discount */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Discount ($)</label>
                  <div className="relative">
                    <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.discountAmount}
                      onChange={e => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                      className={`w-full pl-10 pr-6 py-4 bg-rose-50/30 dark:bg-rose-950/20 border ${formData.discountAmount > (totals.subtotal + totals.tax) ? 'border-rose-500 animate-pulse' : 'border-rose-100 dark:border-rose-900/30'} rounded-2xl text-[11px] font-black outline-none dark:text-white shadow-sm transition-all`}
                    />
                    {formData.discountAmount > (totals.subtotal + totals.tax) && (
                      <p className="text-[9px] font-black text-rose-500 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={10} /> Discount exceeds total!
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Payment Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={e => {
                      const status = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        paymentStatus: status,
                        paymentType: status === 'due' ? 'Credit' : 'Cash',
                        amountPaid: status === 'paid' ? totals.total : 0
                      }));
                    }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner appearance-none transition-all focus:ring-4 focus:ring-brand-500/5"
                  >
                    <option value="due">Due (Credit)</option>
                    <option value="paid">Paid (Full)</option>
                  </select>
                </div>

              </div>

              {(formData.paymentStatus === 'paid' || formData.paymentStatus === 'partial') && (
                <>
                  <div className="space-y-2 animate-in slide-in-from-left-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paying By</label>
                    <select
                      value={formData.payingBy}
                      onChange={e => setFormData({ ...formData, payingBy: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner appearance-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2 animate-in slide-in-from-left-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Financial Account</label>
                    <select
                      value={formData.paymentAccountId}
                      onChange={e => setFormData({ ...formData, paymentAccountId: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black border-none outline-none dark:text-white shadow-inner appearance-none"
                    >
                      <option value="">Select Account...</option>
                      {financeWallets.map(acc => (
                        <option key={acc._id} value={acc._id}>{acc.name} (Bal: ${acc.balance})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 animate-in slide-in-from-left-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paid Amount ($)</label>
                    <input
                      type="number"
                      value={formData.amountPaid}
                      onChange={e => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                      className="w-full px-6 py-4 bg-brand-50/50 dark:bg-brand-900/10 border-2 border-brand-100 dark:border-brand-900/50 rounded-2xl text-[11px] font-black outline-none dark:text-white"
                    />
                  </div>
                </>
              )}


            </div>
          </div>

          {/* 🧾 Account Settlement Summary */}
          <div className="bg-slate-900 dark:bg-brand-950/20 rounded-[44px] p-10 border border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                  <Receipt size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Settlement Summary</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Documented financial breakdown</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  Calculated in Real-time
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">Subtotal (Gross)</span>
                  <span className="text-base font-black text-white tabular-nums">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">Tax (VAT {formData.taxPercent}%)</span>
                  <span className="text-base font-black text-emerald-500 tabular-nums">+{totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">Global Discount</span>
                  <span className="text-base font-black text-rose-500 tabular-nums">-{formData.discountAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="hidden md:block border-x border-slate-800/60 relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Calculator size={120} strokeWidth={1} className="text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col justify-center items-end space-y-2">
                <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em]">Net Payable Balance</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-500">$</span>
                  <span className="text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                    {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Internal Allocation Breakdown (Visible when partial/paid) */}
            {(formData.paymentStatus === 'paid' || formData.paymentStatus === 'partial') && (
              <div className="pt-8 border-t border-slate-800/60 flex flex-wrap gap-12 justify-end">
                <div className="flex flex-col items-end group">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Amount Being Paid</span>
                  <span className="text-2xl font-black text-emerald-500 tabular-nums">
                    ${(Number(formData.amountPaid) || 0).toFixed(2)}
                  </span>
                </div>
                {(totals.total - (Number(formData.amountPaid) || 0)) > 0.001 && (
                  <div className="flex flex-col items-end group">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-rose-500 transition-colors">Transfer to Credit Balance</span>
                    <span className="text-2xl font-black text-rose-500 tabular-nums">
                      ${(totals.total - (Number(formData.amountPaid) || 0)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🔘 Final Action Controls */}
          <div className="flex items-center justify-end gap-6 pt-6">
            <button
              onClick={() => {
                resetPurchaseForm();
                setView('LIST');
              }}
              className="px-10 py-5 text-slate-400 hover:text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 group bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform" />
              Discard Entry
            </button>
            <button
              onClick={() => handleSave('Pending')}
              disabled={isSaving}
              className={`px-16 py-6 bg-slate-900 dark:bg-brand-600 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center gap-4 group ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:ring-8 hover:ring-brand-500/10 hover:-translate-y-1'}`}
            >
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Save size={20} strokeWidth={3} />
              </div>
              {isSaving ? 'Processing Protocol...' : editingPurchaseId ? 'Update Purchase Order' : 'Commit Purchase Order'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24 font-sans">
          {/* List Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
                <ShoppingCart size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Purchases</h1>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Manage your product intake and supplier records</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <Download size={18} className="text-brand-500" /> Export Journal
              </button>
              <button
                onClick={() => {
                  resetPurchaseForm();
                  setView('CREATE');
                }}
                className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all active:scale-95 group border border-slate-700"
              >
                <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                Add Purchase
              </button>
            </div>
          </div>


          {/* Main Registry Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/20">
              <div className="relative group w-full md:w-[450px]">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search Purchases by Vendor or ID..."
                  className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-semibold outline-none focus:ring-8 focus:ring-brand-500/5 transition-all dark:text-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto overflow-visible">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-10 py-6">Purchase ID</th>
                    <th className="px-10 py-6">Vendor Hub</th>
                    <th className="px-10 py-6">Invoiced Total</th>
                    <th className="px-10 py-6">Settled Balance</th>
                    <th className="px-10 py-6 text-center">Protocol</th>
                    <th className="px-10 py-6 text-right">Operations Hub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchases.map((po, idx) => (
                    <tr key={po._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black text-xl border border-brand-100 dark:border-brand-800 group-hover:scale-110 transition-transform shadow-inner">
                            <Receipt size={24} />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{po._id.substr(-6)}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2">{new Date(po.purchaseDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{po.supplier}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Items: {po.items?.length || 0}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-sm font-black text-slate-900 dark:text-white tabular-nums">${po.totalCost?.toLocaleString()}</td>
                      <td className="px-10 py-8 text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${(po.amountPaid || 0).toLocaleString()}</td>
                      <td className="px-10 py-8">
                        <div className={`mx-auto px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit flex items-center gap-2 border shadow-sm ${
                          po.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800' :
                          po.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800' :
                          po.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800' :
                            'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-800'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            po.status === 'Completed' ? 'bg-emerald-500' :
                            po.status === 'Pending' ? 'bg-amber-500' :
                            po.status === 'Cancelled' ? 'bg-rose-500' : 'bg-slate-400'
                          }`} />
                          {po.status}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right relative overflow-visible">
                        <div className="flex justify-end items-center gap-3">
                          <button
                            onClick={() => toggleMenu(po._id)}
                            className={`p-3.5 rounded-2xl transition-all duration-500 active:scale-90 shadow-lg border-2 ${activeMenuId === po._id ? 'bg-slate-900 border-slate-700 text-white rotate-90 scale-110' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-brand-600'
                              }`}
                          >
                            <MoreVertical size={20} strokeWidth={3} />
                          </button>

                          {activeMenuId === po._id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                              <div className={`absolute right-24 w-72 bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_48px_128px_-12px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-300 text-left ${idx >= purchases.length - 2 ? 'bottom-0 mb-4 slide-in-from-bottom-2' : 'top-16 slide-in-from-top-2'}`}>
                                <div className="space-y-1">
                                  {[
                                    { icon: <Eye size={16} />, label: 'Review Voucher', color: 'text-slate-600 dark:text-slate-200', onClick: () => openViewModal(po) },
                                    { icon: <History size={16} />, label: 'View Ledger', color: 'text-slate-600 dark:text-slate-200', onClick: () => openLedgerModal(po) },
                                    { icon: <CheckCircle2 size={16} strokeWidth={2.5} />, label: 'Record Payment', color: 'text-emerald-600', special: true, onClick: () => openPaymentModal(po) },
                                    { icon: <FileDown size={16} />, label: 'Download Voucher', color: 'text-slate-600 dark:text-slate-200', onClick: () => downloadPurchaseVoucher(po) },
                                    { separator: true },
                                    { icon: <Edit2 size={16} />, label: 'Edit Transaction', color: 'text-brand-600', onClick: () => handleEditPurchase(po) },
                                    { icon: <Trash2 size={16} />, label: 'Purge Record', color: 'text-rose-500', onClick: () => handleDeletePurchase(po._id) },
                                  ].map((item, idx) => (
                                    item.separator ? (
                                      <div key={idx} className="h-px bg-slate-50 dark:bg-slate-800 mx-4 my-2" />
                                    ) : (
                                      <button key={idx} onClick={item.onClick} className={`w-full flex items-center justify-between px-5 py-3 rounded-[20px] transition-all group/item active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800`}>
                                        <div className={`flex items-center gap-4 ${item.color}`}>
                                          <div className="group-hover/item:scale-110 transition-transform shrink-0">{item.icon}</div>
                                          <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.label}</span>
                                        </div>
                                        <ArrowRight size={12} className="opacity-0 group-hover/item:opacity-30 transition-all group-hover/item:translate-x-1" />
                                      </button>
                                    )
                                  ))}
                                </div>
                              </div>
                            </>
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
              onPageChange={(page) => fetchData(page, searchTerm)}
            />

            {/* Footer Integrity Bar */}
            <div className="p-10 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Compliance</p>
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-tight">
                    <ShieldCheck size={16} /> Partner Invoicing Verified
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:gap-5 transition-all group shadow-xl active:scale-95 border border-slate-700">
                Procurement Cycle Report <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Vendor Modal */}
      {
        isQuickVendorModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsQuickVendorModalOpen(false)} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-brand-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Truck size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Register New Vendor</h3>
                    <p className="text-sm text-brand-200 mt-1">Onboard supplier into the registry</p>
                  </div>
                </div>
                <button onClick={() => setIsQuickVendorModalOpen(false)} className="p-3 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleQuickAddVendor} className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar-premium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vendor Name *</label>
                    <input
                      required
                      type="text"
                      value={quickVendorForm.name}
                      onChange={e => setQuickVendorForm({ ...quickVendorForm, name: e.target.value })}
                      placeholder="e.g. Somali Beauty Supplies"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner appearance-none"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number *</label>
                    <input
                      required
                      type="text"
                      value={quickVendorForm.phone}
                      onChange={e => setQuickVendorForm({ ...quickVendorForm, phone: e.target.value })}
                      placeholder="+252 61 XXX XXXX"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner appearance-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      value={quickVendorForm.email}
                      onChange={e => setQuickVendorForm({ ...quickVendorForm, email: e.target.value })}
                      placeholder="accounts@supplier.so"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner appearance-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Opening Payable ($)</label>
                    <input
                      type="number"
                      value={quickVendorForm.openingBalance}
                      onChange={e => setQuickVendorForm({ ...quickVendorForm, openingBalance: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner appearance-none"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Address</label>
                    <div className="relative group">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={quickVendorForm.address}
                        onChange={e => setQuickVendorForm({ ...quickVendorForm, address: e.target.value })}
                        placeholder="Market, District..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner appearance-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Terms</label>
                    <input
                      type="text"
                      value={quickVendorForm.paymentTerms}
                      onChange={e => setQuickVendorForm({ ...quickVendorForm, paymentTerms: e.target.value })}
                      placeholder="e.g. Net 30, COD..."
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner appearance-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vendor Status</label>
                    <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                      <button
                        type="button"
                        onClick={() => setQuickVendorForm({ ...quickVendorForm, status: 'Active' })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${quickVendorForm.status === 'Active' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400'}`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickVendorForm({ ...quickVendorForm, status: 'Inactive' })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${quickVendorForm.status === 'Inactive' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-400'}`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Administrative Notes</label>
                    <textarea
                      rows="2"
                      value={quickVendorForm.notes}
                      onChange={e => setQuickVendorForm({ ...quickVendorForm, notes: e.target.value })}
                      placeholder="Specific supply categories or contract details..."
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner custom-scrollbar resize-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsQuickVendorModalOpen(false)}
                    className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] px-10 py-5 bg-brand-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
                  >
                    Commit Supplier Entry <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* View/Review Voucher Modal */}
      {
        isViewModalOpen && selectedPurchase && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsViewModalOpen(false)} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 dark:bg-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <FileText size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Purchase Voucher</h3>
                    <p className="text-sm text-slate-400 mt-1">Ref: {selectedPurchase.invoiceNo}</p>
                  </div>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar-premium space-y-8">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800/50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedPurchase.purchaseDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Supplier</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedPurchase.supplier}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Warehouse</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate">{warehouses.find(b => b._id === selectedPurchase.warehouseId)?.name || 'Unknown'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit flex items-center gap-2 ${selectedPurchase.balance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      {selectedPurchase.balance > 0 ? 'Partial' : 'Completed'}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                    <Package size={16} className="text-brand-500" /> Purchased Items
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Item</th>
                          <th className="px-4 py-4 text-center">Qty</th>
                          <th className="px-4 py-4 text-center">Unit</th>
                          <th className="px-4 py-4 text-right">Cost</th>
                          <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {selectedPurchase.items?.map((item, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4">{item.name || item.productName}</td>
                            <td className="px-4 py-4 text-center">{item.quantity || item.qty}</td>
                            <td className="px-4 py-4 text-center">{item.unit || '-'}</td>
                            <td className="px-4 py-4 text-right">${item.cost.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">${((item.quantity || item.qty || 0) * item.cost).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="flex justify-end">
                  <div className="w-72 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-6 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Subtotal</span>
                      <span>${(selectedPurchase.totalCost - (selectedPurchase.taxAmount || 0) + (selectedPurchase.discountAmount || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Tax</span>
                      <span>${(selectedPurchase.taxAmount || 0).toLocaleString()}</span>
                    </div>
                    {selectedPurchase.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                        <span>Discount</span>
                        <span>-${selectedPurchase.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                    <div className="flex justify-between items-center text-lg font-black text-slate-900 dark:text-white">
                      <span>Total</span>
                      <span>${selectedPurchase.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl">
                      <span>Amount Paid</span>
                      <span>${(selectedPurchase.amountPaid || 0).toLocaleString()}</span>
                    </div>
                    {selectedPurchase.balance > 0 && (
                      <div className="flex justify-between items-center text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl">
                        <span>Balance Due</span>
                        <span>${selectedPurchase.balance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all"
                  >
                    Close
                  </button>
                  {selectedPurchase.balance > 0 && (
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openPaymentModal(selectedPurchase);
                      }}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Wallet size={16} /> Pay Balance
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )
      }

      {/* Ledger Modal */}
      {ledgerModal.show && ledgerModal.purchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setLedgerModal({ show: false, purchase: null })} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[40px] border border-slate-200/60 bg-white shadow-2xl dark:border-slate-800/60 dark:bg-slate-900 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between bg-slate-900 px-10 py-8 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <History size={24} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase leading-none tracking-tight text-white">Purchase Ledger</h3>
                  <p className="mt-1 text-sm text-slate-400">{ledgerModal.purchase.supplier}</p>
                </div>
              </div>
              <button onClick={() => setLedgerModal({ show: false, purchase: null })} className="rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-10">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice Total</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(ledgerModal.purchase.totalCost)}</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-5 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Paid</p>
                  <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">{formatCurrency(ledgerModal.purchase.amountPaid)}</p>
                </div>
                <div className="rounded-3xl bg-rose-50 p-5 dark:bg-rose-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Balance</p>
                  <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-300">{formatCurrency(ledgerModal.purchase.balance)}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Activity</th>
                      <th className="px-6 py-4 text-right">Debit</th>
                      <th className="px-6 py-4 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-bold dark:divide-slate-800">
                    <tr>
                      <td className="px-6 py-4 text-slate-500">{new Date(ledgerModal.purchase.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white">Purchase invoice {ledgerModal.purchase.invoiceNo || ledgerModal.purchase.poNumber}</td>
                      <td className="px-6 py-4 text-right text-rose-600">{formatCurrency(ledgerModal.purchase.totalCost)}</td>
                      <td className="px-6 py-4 text-right text-slate-400">$0.00</td>
                    </tr>
                    {Number(ledgerModal.purchase.amountPaid || 0) > 0 && (
                      <tr>
                        <td className="px-6 py-4 text-slate-500">{new Date(ledgerModal.purchase.updatedAt || ledgerModal.purchase.purchaseDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white">Payments recorded</td>
                        <td className="px-6 py-4 text-right text-slate-400">$0.00</td>
                        <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(ledgerModal.purchase.amountPaid)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setLedgerModal({ show: false, purchase: null })}
                  className="flex-1 rounded-2xl bg-slate-100 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Close
                </button>
                {Number(ledgerModal.purchase.balance || 0) > 0 && (
                  <button
                    onClick={() => {
                      const purchase = ledgerModal.purchase;
                      setLedgerModal({ show: false, purchase: null });
                      openPaymentModal(purchase);
                    }}
                    className="flex-1 rounded-2xl bg-emerald-600 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700"
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {
        isPaymentModalOpen && selectedPurchase && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsPaymentModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Wallet size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Record Payment</h3>
                    <p className="text-sm text-emerald-100 mt-1">For {selectedPurchase.supplier}</p>
                  </div>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-3 bg-white/10 rounded-full text-white hover:bg-emerald-700 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-10 space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Balance</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">${selectedPurchase.balance?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice No</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{selectedPurchase.invoiceNo}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      max={selectedPurchase.balance}
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Account</label>
                  <select
                    value={paymentForm.paymentAccountId}
                    onChange={e => {
                      setPaymentForm({ ...paymentForm, paymentAccountId: e.target.value });
                      const acc = financeWallets.find(a => a._id === e.target.value);
                      if (acc) {
                        if (acc.name.toLowerCase().includes('cash')) setPaymentForm(prev => ({ ...prev, paymentMethod: 'Cash' }));
                        else setPaymentForm(prev => ({ ...prev, paymentMethod: 'Bank' }));
                      }
                    }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all dark:text-white appearance-none"
                  >
                    <option value="">Select Account...</option>
                    {financeWallets.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} (Bal: ${acc.balance})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Wallet Balance Guard */}
      {walletAlert.show && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg overflow-hidden rounded-[34px] bg-white shadow-[0_36px_90px_-28px_rgba(15,23,42,0.65)] dark:bg-slate-950 border border-white/70 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bg-rose-50 px-8 py-7 dark:bg-rose-950/30">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                  <ShieldCheck size={28} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-500">Wallet Protection</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{walletAlert.title}</h3>
                  {walletAlert.walletName && (
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{walletAlert.walletName}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-7 p-8">
              <p className="text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{walletAlert.message}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available</p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(walletAlert.available)}</p>
                </div>
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Required</p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-rose-600 dark:text-rose-300">{formatCurrency(walletAlert.required)}</p>
                </div>
              </div>
              <button
                onClick={() => setWalletAlert(prev => ({ ...prev, show: false }))}
                className="w-full rounded-2xl bg-slate-950 py-4 text-xs font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                Review Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default InventoryPurchase;
