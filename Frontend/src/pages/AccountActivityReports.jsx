import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  History as HistoryIcon,
  Activity as ActivityIcon,
  PieChart,
  BarChart3,
  ChevronDown,
  Building,
  Info,
  DollarSign,
  Wallet,
  ReceiptText,
  Target,
  ShieldCheck,
  LayoutGrid,
  ChevronRight,
  Calculator
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart as RePieChart, Pie, AreaChart, Area, Legend
} from 'recharts';

const MOCK_ACCOUNTS = [
  '1110 - EVC Plus Vault',
  '1120 - Premier Bank Main',
  '1200 - Accounts Receivable',
  '2100 - Accounts Payable',
  '4100 - Global Service Revenue',
  '5200 - Operating Expenditures'
];

const EXPENSE_DISTRIBUTION = [
  { name: 'Rent', value: 4500, color: '#6366f1' },
  { name: 'Utilities', value: 1200, color: '#0ea5e9' },
  { name: 'Salaries', value: 15000, color: '#f59e0b' },
  { name: 'Marketing', value: 2400, color: '#10b981' },
];

const INCOME_TREND = [
  { name: 'Mon', revenue: 4200 },
  { name: 'Tue', revenue: 3800 },
  { name: 'Wed', revenue: 5100 },
  { name: 'Thu', revenue: 4600 },
  { name: 'Fri', revenue: 7200 },
  { name: 'Sat', revenue: 6800 },
  { name: 'Sun', revenue: 5900 },
];

const AccountActivityReports = () => {
  const [activeTab, setActiveTab] = useState('Ledger');
  const [selectedAccount, setSelectedAccount] = useState(MOCK_ACCOUNTS[0]);
  const [dateRange, setDateRange] = useState('This Fiscal Month');

  const renderLedger = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Ledger Totals & Balances Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Opening Balance', value: '$8,200.00', icon: <HistoryIcon size={20} />, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
          { label: 'Total Inflow (Dr)', value: '$12,450.00', icon: <ArrowUpRight size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
          { label: 'Total Outflow (Cr)', value: '$4,120.50', icon: <ArrowDownLeft size={20} />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20' },
          { label: 'Closing Balance', value: '$16,529.50', icon: <Wallet size={20} />, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-brand-500/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Audited</div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black dark:text-white tabular-nums tracking-tighter">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Account Statement</h3>
            <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{selectedAccount}</p>
          </div>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-brand-600 transition-colors">
            <RefreshCw size={14} /> Refresh Ledger
          </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
              <th className="px-10 py-6">Date & Entry ID</th>
              <th className="px-10 py-6">Transaction Description</th>
              <th className="px-10 py-6">Debit (+)</th>
              <th className="px-10 py-6">Credit (-)</th>
              <th className="px-10 py-6 text-right">Settled Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
            {[
              { id: 'JE-9921', date: 'Oct 24, 2024', desc: 'Sale Terminal 01 Checkout', dr: 1450.00, cr: 0, bal: 16529.50 },
              { id: 'JE-9920', date: 'Oct 23, 2024', desc: 'Bulk Inventory Inbound - Somali Beauty', dr: 0, cr: 800.00, bal: 15079.50 },
              { id: 'JE-9919', date: 'Oct 22, 2024', desc: 'Withdrawal for Utility Payment', dr: 0, cr: 345.00, bal: 15879.50 },
              { id: 'JE-9918', date: 'Oct 22, 2024', desc: 'Opening Period Balance Injection', dr: 15000.00, cr: 0, bal: 16224.50 },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-10 py-6">
                  <p className="text-sm font-black dark:text-white uppercase leading-none">{row.id}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{row.date}</p>
                </td>
                <td className="px-10 py-6">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">{row.desc}</p>
                </td>
                <td className="px-10 py-6 text-emerald-600 tabular-nums">{row.dr > 0 ? `+$${row.dr.toFixed(2)}` : '---'}</td>
                <td className="px-10 py-6 text-rose-600 tabular-nums">{row.cr > 0 ? `-$${row.cr.toFixed(2)}` : '---'}</td>
                <td className="px-10 py-6 text-right tabular-nums font-black dark:text-white">${row.bal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Breakdown Chart */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={EXPENSE_DISTRIBUTION} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                  {EXPENSE_DISTRIBUTION.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Burn</span>
              <span className="text-4xl font-black dark:text-white tabular-nums">$23.1k</span>
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-6 md:pl-10 mt-8 md:mt-0">
            <h4 className="text-xl font-black dark:text-white uppercase tracking-tight">Opex Allocation</h4>
            <div className="space-y-4">
              {EXPENSE_DISTRIBUTION.map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </div>
                    <span>${item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(item.value / 23100) * 100}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
              <ReceiptText size={140} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mb-2">Month-over-Month</p>
              <h4 className="text-5xl font-black text-emerald-400 tabular-nums">-12.4%</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-4">Expense Stabilization Goal Reached</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dominant Sector</p>
                  <p className="text-lg font-black dark:text-white uppercase mt-1">HR & Payroll (65%)</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Insight Synthesized</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Utility burn at <span className="text-rose-500 font-black">Hargeisa warehouse</span> is 14% higher than Mogadishu per square meter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20">
          <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Opex Disbursement Journal</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
              <th className="px-10 py-6">Date & Payee</th>
              <th className="px-10 py-6">Classification</th>
              <th className="px-10 py-6">Source Wallet</th>
              <th className="px-10 py-6 text-right">Settled Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
            {[
              { payee: 'Real Estate Holdings', date: 'Oct 01, 2024', cat: 'Rent', wallet: 'Premier Bank', amt: 4500 },
              { payee: 'Hormuud Power', date: 'Oct 20, 2024', cat: 'Utilities', wallet: 'EVC Plus', amt: 345 },
              { payee: 'Staff Payroll Pool', date: 'Oct 24, 2024', cat: 'Salaries', wallet: 'Global HQ', amt: 15000 },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-10 py-6">
                  <p className="text-sm font-black dark:text-white uppercase tracking-tight">{row.payee}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{row.date}</p>
                </td>
                <td className="px-10 py-6">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg uppercase tracking-widest">{row.cat}</span>
                </td>
                <td className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{row.wallet}</td>
                <td className="px-10 py-6 text-right tabular-nums font-black text-rose-600 dark:text-rose-400">${row.amt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIncome = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Income Recognition Trend</h3>
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl flex items-center gap-2">
              <TrendingUp size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">+14.2% Growth</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={INCOME_TREND}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '24px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorInc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-brand-600 rounded-[40px] p-8 text-white shadow-2xl shadow-brand-600/30">
            <p className="text-[10px] font-black text-brand-200 uppercase tracking-[0.4em] mb-2">Net Period Income</p>
            <h4 className="text-5xl font-black tabular-nums tracking-tighter">$142.5k</h4>
            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-brand-300 uppercase tracking-widest">Global Float</p>
                <p className="text-lg font-black tabular-nums text-white">$12.4k</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Top Revenue Nodes</h5>
            <div className="space-y-4">
              {[
                { label: 'Therapeutic Haircare', val: '$45.2k', percent: 45, color: 'bg-brand-500' },
                { label: 'Gym PT Memberships', val: '$32.1k', percent: 32, color: 'bg-emerald-500' },
                { label: 'Cosmetic Retail Sales', val: '$21.4k', percent: 21, color: 'bg-amber-500' },
              ].map((node) => (
                <div key={node.label} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black dark:text-slate-200 uppercase tracking-tight">{node.label}</span>
                    <span className="text-[10px] font-black dark:text-brand-400 tabular-nums">{node.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${node.color} transition-all duration-1000`} style={{ width: `${node.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <TrendingUp size={240} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-[24px] flex items-center justify-center shadow-lg">
              <ArrowUpRight size={32} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Average Daily Yield</p>
              <h4 className="text-5xl font-black dark:text-white tabular-nums tracking-tighter">$4,250.00</h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">+8.4% vs Previous Cycle</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[56px] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <ShieldCheck size={240} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center text-brand-400 backdrop-blur-xl">
              <ActivityIcon size={32} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Operational Surplus</p>
              <h4 className="text-5xl font-black text-white tabular-nums tracking-tighter">$88,300.00</h4>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase">Gross Profit Margin</span>
                <span className="text-lg font-black text-brand-400">42.5%</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase">Asset Turn Ratio</span>
                <span className="text-lg font-black text-emerald-400">2.1x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Net Capital Flow (Monthly)</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase">Liquidity Inflow</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={INCOME_TREND}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '24px', border: 'none', color: '#fff' }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[12, 12, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">

      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
            <BookOpen size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Account Activity</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Global Audit Trails & Liquidity Flow Monitoring</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar mx-2">
            {[
              { id: 'Ledger', label: 'Ledger Report', icon: <BookOpen size={16} /> },
              { id: 'Expenses', label: 'Expense Report', icon: <ArrowDownLeft size={16} /> },
              { id: 'Income', label: 'Income Report', icon: <ArrowUpRight size={16} /> },
              { id: 'Summary', label: 'Surplus Summary', icon: <LayoutGrid size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-3 px-10 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-[200px] text-center ${activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-xl'
                  : 'text-slate-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Global Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Target size={12} className="text-brand-500" /> Target Node
            </label>
            <div className="relative group">
              <Building size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" />
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-xs font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all shadow-inner"
              >
                {MOCK_ACCOUNTS.map(acc => <option key={acc} value={acc}>{acc}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar size={12} className="text-brand-500" /> Reporting Cycle
            </label>
            <div className="relative group">
              <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-xs font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all shadow-inner"
              >
                <option>Today (Real-time)</option>
                <option>Last 7 Business Days</option>
                <option>This Fiscal Month</option>
                <option>Custom Node Range</option>
              </select>
              <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[22px] text-slate-400 hover:text-brand-600 transition-all shadow-sm">
            <RefreshCw size={20} />
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[22px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all group">
            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
            Download PDF
          </button>
        </div>
      </div>

      {/* 3. Dynamic Content Area */}
      <div className="px-2">
        {activeTab === 'Ledger' && renderLedger()}
        {activeTab === 'Expenses' && renderExpenses()}
        {activeTab === 'Income' && renderIncome()}
        {activeTab === 'Summary' && renderSummary()}
      </div>

      {/* 4. Persistence & Audit Note */}
      <div className="p-10 bg-slate-50 dark:bg-slate-950/40 rounded-[56px] border border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center text-brand-500 shrink-0">
            <ShieldCheck size={28} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            Activity datasets are locked for <span className="text-brand-500">Immutable Compliance Monitoring</span>. Deleting entries requires <span className="text-rose-500">Platform Level Authorization</span> and generates a forensic alert.
          </p>
        </div>
        <button className="px-10 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600 transition-all shadow-sm shrink-0">
          Request Audit Re-indexing
        </button>
      </div>
    </div>
  );
};

export default AccountActivityReports;
