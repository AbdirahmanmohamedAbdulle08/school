import React, { useState } from 'react';
import {
  Terminal,
  Search,
  Filter,
  Calendar,
  User as UserIcon,
  Smartphone,
  ShieldCheck,
  Download,
  Activity,
  Lock,
  ShoppingBag,
  Package,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Database,
  ArrowRight,
  Info,
  Clock,
  ExternalLink,
  ShieldAlert,
  Zap,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const MOCK_LOGS = [
  { id: 'LOG-1021', timestamp: 'Oct 24, 2024 • 02:45 PM', user: 'Hussein Mohamed', role: 'Owner', action: 'Sale Created', module: 'Sales', reference: 'TXN-8821', ip: '197.12.0.1', actionType: 'Create' },
  { id: 'LOG-1020', timestamp: 'Oct 24, 2024 • 01:12 PM', user: 'Fatima N.', role: 'Cashier', action: 'Login Success', module: 'Security', reference: 'Terminal-04', ip: '102.44.11.2', actionType: 'Auth' },
  { id: 'LOG-1019', timestamp: 'Oct 24, 2024 • 11:30 AM', user: 'Ahmed Nur', role: 'Manager', action: 'Inventory Adjusted', module: 'Inventory', reference: 'SKU-8821', ip: '197.12.0.1', actionType: 'Update' },
  { id: 'LOG-1018', timestamp: 'Oct 23, 2024 • 04:00 PM', user: 'Hussein Mohamed', role: 'Owner', action: 'User Disabled', module: 'Access', reference: 'USR-003', ip: '197.12.0.1', actionType: 'Update' },
  { id: 'LOG-1017', timestamp: 'Oct 23, 2024 • 02:15 PM', user: 'Faisa J.', role: 'Admin', action: 'Role Changed', module: 'Access', reference: 'ROL-004', ip: '41.223.10.8', actionType: 'Update' },
  { id: 'LOG-1016', timestamp: 'Oct 22, 2024 • 05:20 PM', user: 'System Bot', role: 'Automated', action: 'Expense Deleted', module: 'Accounts', reference: 'EXP-4401', ip: 'Cloud-Sync', actionType: 'Delete' },
  { id: 'LOG-1015', timestamp: 'Oct 22, 2024 • 09:00 AM', user: 'Abdi Yusuf', role: 'Cashier', action: 'Logout', module: 'Security', reference: 'Terminal-02', ip: '197.12.0.5', actionType: 'Auth' },
];

const MODULES = ['Sales', 'Inventory', 'Accounts', 'Access', 'Security', 'HR', 'Services', 'Settings'];
const ACTION_TYPES = ['Create', 'Update', 'Delete', 'Auth', 'System'];

const ActivityLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedModule, setSelectedModule] = useState('All Modules');
  const [selectedActionType, setSelectedActionType] = useState('All Types');

  const getActionColor = (type) => {
    switch (type) {
      case 'Create': return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20';
      case 'Update': return 'text-brand-600 bg-brand-50 border-brand-100 dark:bg-brand-900/20';
      case 'Delete': return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20';
      case 'Auth': return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20';
      default: return 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800/40';
    }
  };

  const filteredLogs = MOCK_LOGS.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || log.reference.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = selectedUser === 'All Users' || log.user === selectedUser;
    const matchesModule = selectedModule === 'All Modules' || log.module === selectedModule;
    const matchesAction = selectedActionType === 'All Types' || log.actionType === selectedActionType;
    return matchesSearch && matchesUser && matchesModule && matchesAction;
  });

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
            <Terminal size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Security Audit</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Immutable Global Activity Ledger & Forensic Trail</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm group">
            <Download size={18} className="text-brand-500 group-hover:translate-y-0.5 transition-transform" />
            Export PDF/CSV
          </button>
        </div>
      </div>

      {/* Advanced Filter Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Filter size={16} className="text-brand-600" /> Forensic Filters
          </h3>
          <button className="text-[10px] font-black text-slate-400 hover:text-brand-600 uppercase tracking-widest transition-all">Reset Matrix</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Date Range - Mock */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date Range</label>
            <div className="relative group">
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" />
              <select className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[11px] font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none shadow-inner">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
            </div>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">System Operator</label>
            <div className="relative group">
              <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[11px] font-black dark:text-white appearance-none outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner"
              >
                <option>All Users</option>
                <option>Hussein Mohamed</option>
                <option>Fatima N.</option>
                <option>Ahmed Nur</option>
                <option>System Bot</option>
              </select>
            </div>
          </div>

          {/* Module Filter */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">System Module</label>
            <div className="relative group">
              <Activity size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" />
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[11px] font-black dark:text-white appearance-none outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner"
              >
                <option>All Modules</option>
                {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Action Type Filter */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Action Protocol</label>
            <div className="relative group">
              <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" />
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[11px] font-black dark:text-white appearance-none outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner"
              >
                <option>All Types</option>
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Inline Search Bar */}
        <div className="relative group pt-4">
          <Search size={20} className="absolute left-6 top-1/2 translate-y-1 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
          <input
            type="text"
            placeholder="Deep Search Logs by Reference ID, Specific Action or IP Signature..."
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] text-sm font-semibold outline-none focus:ring-8 focus:ring-brand-500/5 transition-all dark:text-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Activity Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Date & Time</th>
                <th className="px-10 py-6">User Operator</th>
                <th className="px-10 py-6">Action Executed</th>
                <th className="px-10 py-6">Module Hub</th>
                <th className="px-10 py-6">Record Reference</th>
                <th className="px-10 py-6">IP Signature</th>
                <th className="px-10 py-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.timestamp.split(' • ')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.timestamp.split(' • ')[1]}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{log.user}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{log.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit flex items-center gap-2 border shadow-sm ${getActionColor(log.actionType)}`}>
                      <span className="shrink-0">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-widest">{log.module}</span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2 text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                      <Database size={12} strokeWidth={3} /> {log.reference}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tabular-nums">
                      <Smartphone size={12} /> {log.ip}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-600 transition-all hover:scale-110 active:scale-95 shadow-sm">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Status Bar */}
        <div className="p-10 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Snapshot Integrity</p>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-tight">
                <ShieldCheck size={16} /> All Logs Cryptographically Signed
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex flex-col hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Retention Policy</p>
              <p className="text-xs font-black dark:text-white uppercase tracking-tight">90 Days Rolling Archive (Active)</p>
            </div>
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[22px] text-[10px] font-black uppercase tracking-[0.25em] hover:gap-5 transition-all group shadow-xl active:scale-95 border border-slate-700">
            Audit Lifecycle Manager <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
