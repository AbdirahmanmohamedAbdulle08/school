import React, { useEffect, useState } from 'react';
import { ShoppingCart, RefreshCw, Truck, DollarSign, Building2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const PurchasingReports = () => {
  const [activeTab, setActiveTab] = useState('Orders');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/purchasing');
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch purchasing reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderPurchaseOrders = () => (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <th className="px-8 py-5">PO Number</th>
            <th className="px-8 py-5">Supplier</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5 text-right">Total Cost</th>
            <th className="px-8 py-5 text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {(reportData?.purchaseOrders || []).map(order => (
            <tr key={order._id} className="text-sm font-bold text-slate-600 dark:text-slate-300">
              <td className="px-8 py-5 font-black text-slate-900 dark:text-white">{order.poNumber}</td>
              <td className="px-8 py-5">{order.supplier}</td>
              <td className="px-8 py-5">{order.status}</td>
              <td className="px-8 py-5 text-right">${order.totalCost.toLocaleString()}</td>
              <td className="px-8 py-5 text-right">${order.balance.toLocaleString()}</td>
            </tr>
          ))}
          {(!reportData?.purchaseOrders || reportData.purchaseOrders.length === 0) && (
            <tr>
              <td colSpan="5" className="px-8 py-12 text-center text-xs font-black uppercase tracking-widest text-slate-400">No purchase orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSupplierPerformance = () => (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <th className="px-8 py-5">Supplier</th>
            <th className="px-8 py-5 text-center">Orders</th>
            <th className="px-8 py-5 text-center">Received</th>
            <th className="px-8 py-5 text-right">Completion</th>
            <th className="px-8 py-5 text-right">Spend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {(reportData?.supplierPerformance || []).map(row => (
            <tr key={row.supplier} className="text-sm font-bold text-slate-600 dark:text-slate-300">
              <td className="px-8 py-5 font-black text-slate-900 dark:text-white">{row.supplier}</td>
              <td className="px-8 py-5 text-center">{row.orders}</td>
              <td className="px-8 py-5 text-center">{row.received}</td>
              <td className="px-8 py-5 text-right">{row.completionRate}%</td>
              <td className="px-8 py-5 text-right">${row.totalCost.toLocaleString()}</td>
            </tr>
          ))}
          {(!reportData?.supplierPerformance || reportData.supplierPerformance.length === 0) && (
            <tr>
              <td colSpan="5" className="px-8 py-12 text-center text-xs font-black uppercase tracking-widest text-slate-400">No supplier performance data found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCostAnalysis = () => (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-black uppercase tracking-tight dark:text-white">Purchase Cost Analysis</h3>
      </div>
      <div className="h-[420px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reportData?.costAnalysis || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
            <Tooltip formatter={(value, name) => name === 'totalCost' ? `$${value.toLocaleString()}` : value} />
            <Bar dataKey="totalCost" name="Total Cost" fill="#d97706" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-4 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
            <ShoppingCart size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Purchasing Reports</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Purchase Orders, Supplier Performance & Cost Analysis</p>
          </div>
        </div>

        <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto">
          {[
            { id: 'Orders', label: 'Purchase Orders', icon: <ShoppingCart size={16} /> },
            { id: 'Suppliers', label: 'Supplier Performance', icon: <Building2 size={16} /> },
            { id: 'Costs', label: 'Purchase Cost Analysis', icon: <DollarSign size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <RefreshCw className="animate-spin text-amber-500 mb-4" size={32} />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Purchasing Data...</p>
        </div>
      ) : (
        <div className="px-2">
          {activeTab === 'Orders' && renderPurchaseOrders()}
          {activeTab === 'Suppliers' && renderSupplierPerformance()}
          {activeTab === 'Costs' && renderCostAnalysis()}
        </div>
      )}
    </div>
  );
};

export default PurchasingReports;
