import React, { useState } from 'react';
import {
   UserCog,
   Search,
   Filter,
   RefreshCw,
   Download,
   Calendar,
   ArrowRight,
   ChevronRight,
   Users,
   DollarSign,
   CreditCard,
   Briefcase,
   Clock,
   ShieldCheck,
   UserCircle,
   Truck,
   Coins,
   Fingerprint,
   Info,
   TrendingUp,
   AlertCircle,
   BarChart3,
   CalendarDays,
   LayoutGrid,
   ChevronDown,
   ArrowUpRight,
   ArrowDownLeft,
   UserCheck,
   History as HistoryIcon,
   Activity as ActivityIcon
} from 'lucide-react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
   PieChart, Pie, Legend
} from 'recharts';

const AGING_DATA = [
   { bucket: '0-30 Days', value: 12500, color: '#10b981' },
   { bucket: '31-60 Days', value: 4200, color: '#f59e0b' },
   { bucket: '61-90 Days', value: 2100, color: '#f43f5e' },
   { bucket: '90+ Days', value: 850, color: '#9f1239' },
];

const ATTENDANCE_TREND = [
   { day: 'Mon', present: 45 },
   { day: 'Tue', present: 47 },
   { day: 'Wed', present: 42 },
   { day: 'Thu', present: 46 },
   { day: 'Fri', present: 22 },
   { day: 'Sat', present: 44 },
   { day: 'Sun', present: 40 },
];

const HRReports = () => {
   const [activeTab, setActiveTab] = useState('CustomerBalance');
   const [fiscalPeriod, setFiscalPeriod] = useState('Oct 2024');

   const renderAgingBuckets = (title) => (
      <div className="space-y-8 animate-in fade-in duration-500">
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {AGING_DATA.map((bucket, i) => (
               <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-brand-500/30 transition-all">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{bucket.bucket}</p>
                  <h4 className="text-3xl font-black dark:text-white tabular-nums">${bucket.value.toLocaleString()}</h4>
                  <div className="mt-4 h-1 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(bucket.value / 20000) * 100}%`, backgroundColor: bucket.color }} />
                  </div>
               </div>
            ))}
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-8">{title} Velocity</h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={AGING_DATA}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                     <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                     <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                     <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                        {AGING_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                     <th className="px-10 py-6">Identity</th>
                     <th className="px-10 py-6">0-30 Days</th>
                     <th className="px-10 py-6">31-60 Days</th>
                     <th className="px-10 py-6">61-90 Days</th>
                     <th className="px-10 py-6 text-right">90+ Overdue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                  {[
                     { name: 'Ahmed Yusuf', b1: 450, b2: 0, b3: 0, b4: 0 },
                     { name: 'Somali Beauty Supplies', b1: 1200, b2: 450, b3: 0, b4: 0 },
                     { name: 'Walk-in Corporate', b1: 0, b2: 120, b3: 45, b4: 10 },
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-10 py-5 uppercase tracking-tight">{row.name}</td>
                        <td className="px-10 py-5 tabular-nums text-emerald-600">${row.b1}</td>
                        <td className="px-10 py-5 tabular-nums text-amber-500">${row.b2}</td>
                        <td className="px-10 py-5 tabular-nums text-rose-500">${row.b3}</td>
                        <td className="px-10 py-5 text-right tabular-nums text-rose-900 dark:text-rose-400">${row.b4}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );

   const renderAttendanceReport = () => (
      <div className="space-y-8 animate-in fade-in duration-500">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Presence Heatmap</h3>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-brand-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Staff Present</span>
                     </div>
                  </div>
               </div>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={ATTENDANCE_TREND}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '24px', border: 'none' }} />
                        <Bar dataKey="present" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="space-y-6">
               <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mb-2">Monthly Punctuality</p>
                  <h4 className="text-5xl font-black text-emerald-400">94.2%</h4>
                  <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                     <span>Avg Clock-In: 08:04 AM</span>
                  </div>
               </div>
               <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8">
                  <h4 className="text-xs font-black dark:text-white uppercase tracking-widest mb-4">Absence Risk</h4>
                  <div className="flex items-center gap-4">
                     <div className="w-1.5 h-12 bg-rose-500 rounded-full shrink-0" />
                     <p className="text-xs font-medium text-slate-500">3 employees flagged for <span className="text-rose-600 font-bold">consecutive lateness</span> this week.</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20">
               <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Staff Attendance Registry</h3>
               <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-brand-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">Oct 24, 2024</span>
               </div>
            </div>
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                     <th className="px-10 py-6">Employee</th>
                     <th className="px-10 py-6">Clock In</th>
                     <th className="px-10 py-6">Clock Out</th>
                     <th className="px-10 py-6">Status</th>
                     <th className="px-10 py-6 text-right">Hours Logged</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                  {[
                     { name: 'Ahmed Nur', in: '08:00 AM', out: '05:00 PM', status: 'On Time', hours: '8.5h' },
                     { name: 'Mariam Hassan', in: '08:45 AM', out: '04:30 PM', status: 'Late', hours: '7.2h' },
                     { name: 'Fatima Warsame', in: '08:10 AM', out: '05:30 PM', status: 'On Time', hours: '9.3h' },
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-10 py-6 flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 uppercase font-black text-xs">{row.name.charAt(0)}</div>
                           {row.name}
                        </td>
                        <td className="px-10 py-6 tabular-nums text-slate-500">{row.in}</td>
                        <td className="px-10 py-6 tabular-nums text-slate-500">{row.out}</td>
                        <td className="px-10 py-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${row.status === 'On Time' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{row.status}</span>
                        </td>
                        <td className="px-10 py-6 text-right tabular-nums dark:text-white">{row.hours}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );

   return (
      <div className="p-6 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">

         {/* 1. Header Section */}
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 px-2">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
                  <UserCog size={32} strokeWidth={2.5} />
               </div>
               <div>
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Capital & HR Intel</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Universal Registry for People, Payroll & Aging Cycles</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
               <div className="relative group">
                  <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                     value={fiscalPeriod}
                     onChange={(e) => setFiscalPeriod(e.target.value)}
                     className="pl-12 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all appearance-none shadow-sm"
                  >
                     <option>Oct 2024</option>
                     <option>Sep 2024</option>
                     <option>Q3 2024</option>
                     <option>FY 2024</option>
                  </select>
               </div>

               <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[22px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all group border border-slate-700">
                  <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                  Export Batch
               </button>

               <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] text-slate-400 hover:text-brand-600 transition-all shadow-sm">
                  <RefreshCw size={20} />
               </button>
            </div>
         </div>

         {/* 2. Enhanced Navigation Tabs */}
         <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm overflow-x-auto custom-scrollbar no-scrollbar mx-2">
            {[
               { id: 'CustomerBalance', label: 'Customer Balances', icon: <UserCircle size={16} /> },
               { id: 'CustomerAging', label: 'Customer Aging', icon: <HistoryIcon size={16} /> },
               { id: 'VendorPayable', label: 'Vendor Payables', icon: <Truck size={16} /> },
               { id: 'VendorAging', label: 'Vendor Aging', icon: <HistoryIcon size={16} /> },
               { id: 'SalaryReport', label: 'Salary Ledger', icon: <Coins size={16} /> },
               { id: 'AttendanceReport', label: 'Attendance Recap', icon: <Fingerprint size={16} /> },
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

         {/* 3. Dynamic Content Area */}
         <div className="px-2">
            {activeTab === 'CustomerBalance' && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cust. Deposits</p>
                           <h4 className="text-3xl font-black text-emerald-600">$42,550.00</h4>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><ArrowUpRight size={24} /></div>
                     </div>
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Consumption</p>
                           <h4 className="text-3xl font-black text-rose-600">$31,200.00</h4>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600"><ArrowDownLeft size={24} /></div>
                     </div>
                     <div className="bg-brand-600 p-8 rounded-[40px] text-white shadow-xl flex items-center justify-between group">
                        <div>
                           <p className="text-[10px] font-black text-brand-200 uppercase tracking-widest">Net Wallet Liability</p>
                           <h4 className="text-3xl font-black">$11,350.00</h4>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/20 text-white"><ShieldCheck size={24} /></div>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                     <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                        <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Active Balance Ledger</h3>
                     </div>
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                              <th className="px-10 py-6">Client Identity</th>
                              <th className="px-10 py-6">Credits (Prepaid)</th>
                              <th className="px-10 py-6">Debits (Consumed)</th>
                              <th className="px-10 py-6 text-right">Net Position</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                           {[
                              { name: 'Zahra Ahmed', cr: 850, dr: 340, net: 510 },
                              { name: 'Hani Yusuf', cr: 2100, dr: 2100, net: 0 },
                              { name: 'Abdi Yusuf', cr: 100, dr: 450, net: -350 },
                           ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                 <td className="px-10 py-6 uppercase tracking-tight font-black text-slate-900 dark:text-white">{row.name}</td>
                                 <td className="px-10 py-6 tabular-nums text-emerald-600">${row.cr.toLocaleString()}</td>
                                 <td className="px-10 py-6 tabular-nums text-rose-500">${row.dr.toLocaleString()}</td>
                                 <td className="px-10 py-6 text-right tabular-nums">
                                    <span className={row.net < 0 ? 'text-rose-600' : 'text-emerald-600'}>${row.net.toLocaleString()}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'CustomerAging' && renderAgingBuckets('Receivable Aging')}

            {activeTab === 'VendorPayable' && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Account Payables</p>
                           <h4 className="text-4xl font-black text-rose-600">$18,450.00</h4>
                        </div>
                        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 shadow-xl shadow-rose-600/10"><Truck size={32} /></div>
                     </div>
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Vendor Credits</p>
                           <h4 className="text-4xl font-black text-emerald-600">$2,100.00</h4>
                        </div>
                        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 shadow-xl shadow-emerald-600/10"><RefreshCw size={32} /></div>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                     <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                        <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Accounts Payable Matrix</h3>
                     </div>
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                              <th className="px-10 py-6">Supplier Entity</th>
                              <th className="px-10 py-6">Invoiced Total</th>
                              <th className="px-10 py-6">Settled (MTD)</th>
                              <th className="px-10 py-6 text-right">Outstanding Liability</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                           {[
                              { name: 'Somali Beauty Supplies', total: 5400, paid: 5400, balance: 0 },
                              { name: 'Luxe Hair Distributors', total: 12000, paid: 8500, balance: 3500 },
                              { name: 'Iron Core Gear', total: 4500, paid: 4500, balance: 0 },
                           ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                 <td className="px-10 py-6 uppercase tracking-tight font-black text-slate-900 dark:text-white">{row.name}</td>
                                 <td className="px-10 py-6 tabular-nums text-slate-500">${row.total.toLocaleString()}</td>
                                 <td className="px-10 py-6 tabular-nums text-emerald-600">${row.paid.toLocaleString()}</td>
                                 <td className="px-10 py-6 text-right tabular-nums">
                                    <span className={row.balance > 0 ? 'text-rose-600' : 'text-slate-400'}>${row.balance.toLocaleString()}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'VendorAging' && renderAgingBuckets('Payable Aging')}

            {activeTab === 'SalaryReport' && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-slate-900 rounded-[48px] p-8 text-white flex items-center justify-between group">
                        <div>
                           <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Gross Salary Liability</p>
                           <h4 className="text-4xl font-black text-white">$16,240.00</h4>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/10 text-brand-400 shadow-2xl"><Coins size={32} /></div>
                     </div>
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Periodic Bonuses</p>
                           <h4 className="text-4xl font-black text-emerald-600">$2,450.00</h4>
                        </div>
                        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><TrendingUp size={32} /></div>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                     <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                        <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Employee Payroll Recap</h3>
                     </div>
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                              <th className="px-10 py-6">Employee</th>
                              <th className="px-10 py-6">Base Salary</th>
                              <th className="px-10 py-6">Commission / Bonus</th>
                              <th className="px-10 py-6">Deductions</th>
                              <th className="px-10 py-6 text-right">Net Settlement</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                           {[
                              { name: 'Ahmed Nur', base: 850, bonus: 120, deductions: 45, net: 925 },
                              { name: 'Mariam Hassan', base: 1200, bonus: 240, deductions: 100, net: 1340 },
                              { name: 'Fatima Warsame', base: 900, bonus: 85, deductions: 0, net: 985 },
                           ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                 <td className="px-10 py-6 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 uppercase font-black text-xs">{row.name.charAt(0)}</div>
                                    {row.name}
                                 </td>
                                 <td className="px-10 py-6 tabular-nums text-slate-500">${row.base}</td>
                                 <td className="px-10 py-6 tabular-nums text-emerald-600">+${row.bonus}</td>
                                 <td className="px-10 py-6 tabular-nums text-rose-500">-${row.deductions}</td>
                                 <td className="px-10 py-6 text-right tabular-nums font-black dark:text-white">${row.net}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'AttendanceReport' && renderAttendanceReport()}
         </div>

         {/* 4. Integrity Note */}
         <div className="p-8 bg-slate-50 dark:bg-slate-950/40 rounded-[48px] border border-slate-100 dark:border-slate-900 flex items-center justify-between gap-8">
            <div className="flex items-center gap-4">
               <Info size={20} className="text-brand-500 shrink-0" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  People & HR datasets are synchronized with <span className="text-brand-500">Global Registry Nodes</span>. Any payroll adjustments for the current period require <span className="text-rose-500">Level 3 Approval</span>.
               </p>
            </div>
            <button className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600 transition-all shadow-sm shrink-0">
               Review Access Logs
            </button>
         </div>
      </div>
   );
};

export default HRReports;
