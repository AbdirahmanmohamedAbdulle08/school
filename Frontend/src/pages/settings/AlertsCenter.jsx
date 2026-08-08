import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Package, Clock, Warehouse, ShieldCheck, RefreshCw,
  ArrowRight, TrendingDown, CalendarClock, Truck, Building2, Save,
  Bell, Settings, ChevronRight, AlertCircle, X, ClipboardList, Wallet, ShoppingCart, FileCheck2
} from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const AlertsCenter = () => {
  const { showAlert } = useAlert();
  const [alerts, setAlerts] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, settingsRes] = await Promise.all([
        api.get('/settings/alerts-summary'),
        api.get('/settings')
      ]);
      setAlerts(alertsRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveThresholds = async () => {
    try {
      setSaving(true);
      await api.put('/settings', { alerts: settings.alerts });
      await fetchData();
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Alert thresholds updated.',
        buttonText: 'Continue'
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to save thresholds.',
        buttonText: 'Try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateThreshold = (key, value) => {
    setSettings(prev => ({
      ...prev,
      alerts: { ...prev.alerts, [key]: value }
    }));
  };

  if (loading) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanning Systems...</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Alert Overview', icon: <Bell size={16} /> },
    { id: 'thresholds', label: 'Threshold Config', icon: <Settings size={16} /> },
  ];

  const alertCards = [
    {
      id: 'lowStock', label: 'Low Stock Items', count: alerts?.lowStock?.count || 0,
      icon: <TrendingDown size={24} />, color: 'rose', severity: 'critical',
      desc: `Products at or below reorder level`
    },
    {
      id: 'expiring', label: 'Expiring Soon', count: alerts?.expiring?.count || 0,
      icon: <CalendarClock size={24} />, color: 'amber', severity: 'warning',
      desc: `Within ${alerts?.expiring?.daysWarning || 30} days of expiry`
    },
    {
      id: 'expired', label: 'Already Expired', count: alerts?.expiring?.expired || 0,
      icon: <AlertCircle size={24} />, color: 'red', severity: 'critical',
      desc: 'Products past expiry date'
    },
    {
      id: 'shipments', label: 'Delayed Shipments', count: alerts?.shipments?.delayed || 0,
      icon: <Truck size={24} />, color: 'blue', severity: 'warning',
      desc: `Past expected delivery date`
    },
    {
      id: 'warehouse', label: 'Capacity Warnings', count: alerts?.warehouse?.warnings || 0,
      icon: <Building2 size={24} />, color: 'violet', severity: 'info',
      desc: `Warehouses above ${alerts?.warehouse?.capacityThreshold || 90}% capacity`
    },
    {
      id: 'tasks', label: 'Task Risks', count: (alerts?.tasks?.overdue || 0) + (alerts?.tasks?.urgent || 0),
      icon: <ClipboardList size={24} />, color: 'rose', severity: 'critical',
      desc: 'Overdue and urgent employee tasks'
    },
    {
      id: 'audits', label: 'Open Audits', count: alerts?.audits?.active || 0,
      icon: <FileCheck2 size={24} />, color: 'blue', severity: 'warning',
      desc: 'Stock audit sessions not finalized'
    },
    {
      id: 'finance', label: 'Finance Attention', count: (alerts?.finance?.negativeWallets || 0) + (alerts?.finance?.customerBalances || 0) + (alerts?.finance?.vendorBalances || 0),
      icon: <Wallet size={24} />, color: 'amber', severity: 'warning',
      desc: 'Wallet, customer, and vendor balances'
    },
    {
      id: 'operations', label: 'Pending Operations', count: (alerts?.operations?.pendingSales || 0) + (alerts?.operations?.pendingPurchases || 0),
      icon: <ShoppingCart size={24} />, color: 'violet', severity: 'info',
      desc: 'Sales and purchases waiting for action'
    },
  ];

  const getColorClasses = (color, severity) => {
    const map = {
      rose: { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-900', text: 'text-rose-600', icon: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600' },
      amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900', text: 'text-amber-600', icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' },
      red: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900', text: 'text-red-600', icon: 'bg-red-100 dark:bg-red-900/50 text-red-600' },
      blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900', text: 'text-blue-600', icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' },
      violet: { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-900', text: 'text-violet-600', icon: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600' },
    };
    return map[color] || map.amber;
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-amber-400 shadow-2xl border border-slate-700 ring-4 ring-amber-400/10">
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Alerts Center</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Real-Time System Health & Inventory Warnings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={16} className="text-brand-500" /> Refresh
          </button>
        </div>
      </div>

      {/* Total Alert Banner */}
      {alerts?.totalAlerts > 0 && (
        <div className="bg-gradient-to-r from-rose-600 to-amber-500 rounded-[32px] p-8 flex items-center justify-between text-white shadow-2xl shadow-rose-600/20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-white/80 uppercase tracking-widest">Active System Alerts</p>
              <h2 className="text-4xl font-black tracking-tighter">{alerts.totalAlerts} Total Warnings</h2>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-bold text-white/70">
            <ShieldCheck size={18} /> Monitoring Active
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
              ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-lg'
              : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Alert Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {alertCards.map(card => {
              const colors = getColorClasses(card.color);
              return (
                <div key={card.id} className={`${colors.bg} border ${colors.border} rounded-[32px] p-8 transition-all hover:shadow-lg group`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform`}>
                      {card.icon}
                    </div>
                    <span className={`text-4xl font-black ${colors.text} tabular-nums`}>{card.count}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{card.label}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Low Stock Detail Table */}
          {alerts?.lowStock?.items?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <TrendingDown size={18} className="text-rose-500" /> Low Stock Products
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.lowStock.items.map(item => (
                  <div key={item._id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-black text-rose-600">{item.quantity} in stock</p>
                        <p className="text-[10px] font-bold text-slate-400">Reorder at: {item.reorderLevel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Products */}
          {alerts?.expiring?.items?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <CalendarClock size={18} className="text-amber-500" /> Products Expiring Soon
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.expiring.items.map(item => (
                  <div key={item._id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.sku}</p>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full text-[10px] font-black uppercase">
                      Expires: {new Date(item.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts?.tasks?.items?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <ClipboardList size={18} className="text-rose-500" /> Tasks Needing Attention
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.tasks.items.map(item => (
                  <div key={`${item._id}-${item.priority}`} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.assignedTo} · {item.status}</p>
                    </div>
                    <span className="px-4 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full text-[10px] font-black uppercase">
                      {item.priority} · Due {item.deadline}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts?.audits?.items?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <FileCheck2 size={18} className="text-blue-500" /> Open Stock Audits
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.audits.items.map(item => (
                  <div key={item._id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.auditNo}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.warehouse} · {item.items} items</p>
                    </div>
                    <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-black uppercase">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {((alerts?.finance?.wallets?.length || 0) + (alerts?.finance?.customers?.length || 0) + (alerts?.finance?.vendors?.length || 0)) > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <Wallet size={18} className="text-amber-500" /> Finance Items To Review
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...(alerts.finance.wallets || []).map(item => ({ ...item, kind: 'Wallet', amount: item.balance })),
                  ...(alerts.finance.customers || []).map(item => ({ ...item, kind: 'Customer Receivable', amount: item.outstandingBalance })),
                  ...(alerts.finance.vendors || []).map(item => ({ ...item, kind: 'Vendor Payable', amount: item.outstandingBalance }))
                ].slice(0, 12).map(item => (
                  <div key={`${item.kind}-${item._id}`} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.kind}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${Number(item.amount || 0) < 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                      ${Number(item.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {((alerts?.operations?.sales?.length || 0) + (alerts?.operations?.purchases?.length || 0)) > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <ShoppingCart size={18} className="text-violet-500" /> Pending Operations
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...(alerts.operations.sales || []).map(item => ({ ...item, kind: 'Sale', ref: item.invoiceNo || item.customerName, amount: item.totalAmount })),
                  ...(alerts.operations.purchases || []).map(item => ({ ...item, kind: 'Purchase', ref: item.poNumber || item.supplier, amount: item.totalCost }))
                ].slice(0, 12).map(item => (
                  <div key={`${item.kind}-${item._id}`} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.ref || 'Unnumbered'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.kind} · {item.status}</p>
                    </div>
                    <span className="px-4 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-full text-[10px] font-black uppercase">
                      ${Number(item.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Thresholds Tab */}
      {activeTab === 'thresholds' && settings && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <Settings size={20} className="text-brand-500" /> Alert Threshold Configuration
            </h3>
            <button onClick={handleSaveThresholds} disabled={saving}
              className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-700 shadow-xl transition-all active:scale-95 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Thresholds'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Low Stock */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[28px] p-8 space-y-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600">
                  <TrendingDown size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Low Stock Alert</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trigger when stock ≤ reorder level</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Enabled</label>
                <button onClick={() => updateThreshold('lowStockEnabled', !settings.alerts.lowStockEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.alerts.lowStockEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.alerts.lowStockEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Expiry */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[28px] p-8 space-y-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
                  <CalendarClock size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Expiry Warning</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days before expiry to trigger alert</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Enabled</label>
                <button onClick={() => updateThreshold('expiryEnabled', !settings.alerts.expiryEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.alerts.expiryEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.alerts.expiryEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warning Days</label>
                <input type="number" value={settings.alerts.expiryDaysWarning}
                  onChange={e => updateThreshold('expiryDaysWarning', parseInt(e.target.value) || 30)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>

            {/* Shipment Delay */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[28px] p-8 space-y-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                  <Truck size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Shipment Delay</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours past expected delivery</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Enabled</label>
                <button onClick={() => updateThreshold('shipmentDelayEnabled', !settings.alerts.shipmentDelayEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.alerts.shipmentDelayEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.alerts.shipmentDelayEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delay Hours</label>
                <input type="number" value={settings.alerts.shipmentDelayHours}
                  onChange={e => updateThreshold('shipmentDelayHours', parseInt(e.target.value) || 48)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>

            {/* Warehouse Capacity */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[28px] p-8 space-y-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600">
                  <Building2 size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Capacity Warning</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% of warehouse capacity to trigger warning</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Enabled</label>
                <button onClick={() => updateThreshold('warehouseCapacityEnabled', !settings.alerts.warehouseCapacityEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.alerts.warehouseCapacityEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.alerts.warehouseCapacityEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity Threshold (%)</label>
                <input type="number" value={settings.alerts.warehouseCapacityPercent}
                  onChange={e => updateThreshold('warehouseCapacityPercent', parseInt(e.target.value) || 90)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsCenter;
