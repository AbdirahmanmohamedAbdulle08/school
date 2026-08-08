import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, Lock, Edit2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const FinanceWallets = () => {
  const { showAlert, showConfirm } = useAlert();
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isAdminUser = user?.roles?.some(role => {
    const roleName = String(role?.name || '').toLowerCase();
    return roleName.includes('admin') || roleName.includes('owner') || roleName.includes('system') || roleName.includes('super');
  }) || ['admin', 'owner', 'system', 'super'].some(role => String(user?.role || '').toLowerCase().includes(role));
  const [wallets, setWallets] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(user?.warehouseId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: user?.warehouseId || '', name: '', type: 'Cash', accountNo: '', openingBalance: '', currency: 'USD', description: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchWallets(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [walletRes, warehouseRes] = await Promise.all([
        api.get('/finance/wallets'),
        api.get('/warehouses')
      ]);
      const warehouseList = warehouseRes.data.warehouses || warehouseRes.data || [];
      const defaultWarehouseId = user?.warehouseId || warehouseList.find(w => w.is_default)?._id || warehouseList[0]?._id || '';
      setWarehouses(warehouseList);
      setSelectedWarehouseId(defaultWarehouseId);
      setFormData(prev => ({ ...prev, warehouseId: defaultWarehouseId }));
      setWallets(walletRes.data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWallets = async (warehouseId = selectedWarehouseId) => {
    try {
      const { data } = await api.get('/finance/wallets', {
        params: warehouseId ? { warehouseId } : undefined
      });
      setWallets(data);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    const payload = {
      ...formData,
      warehouseId: formData.warehouseId || selectedWarehouseId || user?.warehouseId
    };
    if (!payload.warehouseId) {
      showAlert({
        type: 'warning',
        title: 'Select warehouse',
        message: 'Please select a warehouse before saving this wallet.',
        buttonText: 'OK'
      });
      return;
    }
    try {
      setIsSaving(true);
      if (editingWallet) {
        await api.put(`/finance/wallets/${editingWallet._id}`, payload);
      } else {
        await api.post('/finance/wallets', payload);
      }
      closeModal();
      setSelectedWarehouseId(payload.warehouseId);
      fetchWallets(payload.warehouseId);
    } catch (error) {
      console.error('Failed to save wallet:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to save wallet.',
        buttonText: 'Try again'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => setFormData({ warehouseId: selectedWarehouseId || user?.warehouseId || '', name: '', type: 'Cash', accountNo: '', openingBalance: '', currency: 'USD', description: '' });

  const openAddModal = () => {
    setEditingWallet(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      warehouseId: wallet.warehouseId?._id || wallet.warehouseId || selectedWarehouseId || user?.warehouseId || '',
      name: wallet.name || '',
      type: wallet.type || 'Cash',
      accountNo: wallet.accountNo || '',
      openingBalance: '',
      currency: wallet.currency || 'USD',
      description: wallet.description || '',
      status: wallet.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWallet(null);
    resetForm();
  };

  const handleDelete = async (wallet) => {
    if (wallet.locked) {
      showAlert({
        type: 'warning',
        title: 'Wallet locked',
        message: wallet.lockReason || 'This wallet has balance or transactions, so it cannot be deleted.',
        buttonText: 'OK'
      });
      return;
    }

    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete wallet?',
      message: `Delete ${wallet.name}? Only empty wallets with no transaction history can be deleted.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    try {
      await api.delete(`/finance/wallets/${wallet._id}`);
      fetchWallets();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Cannot delete wallet',
        message: error.response?.data?.message || 'Failed to delete wallet.',
        buttonText: 'OK'
      });
    }
  };

  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Wallets & Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage operational cash, bank accounts, and mobile money.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Wallet
        </button>
      </div>

      {isAdminUser && warehouses.length > 0 && (
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Warehouse</label>
          <select
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={selectedWarehouseId}
            onChange={e => {
              setSelectedWarehouseId(e.target.value);
              setFormData(prev => ({ ...prev, warehouseId: e.target.value }));
            }}
          >
            {warehouses.map(warehouse => (
              <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Wallet className="w-5 h-5" />
            <h3 className="font-medium">Total Balance</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">${totalBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <ArrowUpRight className="w-5 h-5" />
            <h3 className="font-medium">Active Wallets</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{wallets.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white">Active Wallets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-sm">
                <th className="py-3 px-4">Wallet Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Account No.</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Current Balance</th>
                <th className="py-3 px-4">Transactions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan="8" className="py-8 text-center text-slate-500">Loading wallets...</td></tr>
              ) : wallets.map(wallet => (
                <tr key={wallet._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">{wallet.name}</span>
                      {wallet.locked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{wallet.type}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{wallet.accountNo || '-'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{wallet.currency}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">${(wallet.balance || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">{wallet.transactionCount || 0}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-medium">
                      {wallet.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(wallet)}
                        title="Edit wallet details"
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdminUser && (
                        <button
                          onClick={() => handleDelete(wallet)}
                          disabled={wallet.locked}
                          title={wallet.locked ? 'Locked wallets cannot be deleted' : 'Delete wallet'}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <button type="button" onClick={closeModal} className="absolute right-4 top-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 pr-10">{editingWallet ? 'Edit Wallet' : 'Add New Wallet'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isAdminUser && warehouses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warehouse *</label>
                  <select
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500"
                    value={formData.warehouseId}
                    onChange={e => setFormData({...formData, warehouseId: e.target.value})}
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Wallet Name *</label>
                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Main Cash Register" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type *</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account No. (Optional)</label>
                  <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500" value={formData.accountNo} onChange={e => setFormData({...formData, accountNo: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {!editingWallet && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opening Balance *</label>
                    <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency *</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                    <option value="USD">USD ($)</option>
                    <option value="SOS">SOS (Shilling)</option>
                  </select>
                </div>
              </div>
              {editingWallet && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  Wallet money cannot be edited here. Balance changes only through income, expenses, payments, and transfers.
                </div>
              )}
              {editingWallet && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Saving...' : 'Save Wallet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceWallets;
