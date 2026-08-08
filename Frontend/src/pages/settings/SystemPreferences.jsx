import React from 'react';
import { Sliders, Globe, Clock, DollarSign, Percent, Save, Languages, ShieldCheck, HelpCircle, CalendarDays, RefreshCw } from 'lucide-react';

const SystemPreferences = () => {
  const days = [
    { name: 'Monday', short: 'Mon' },
    { name: 'Tuesday', short: 'Tue' },
    { name: 'Wednesday', short: 'Wed' },
    { name: 'Thursday', short: 'Thu' },
    { name: 'Friday', short: 'Fri', closed: true },
    { name: 'Saturday', short: 'Sat' },
    { name: 'Sunday', short: 'Sun' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Environment</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Fine-tune localization, currency, and global financial defaults.</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-600/20 active:scale-95">
          <Save size={18} /> Commit Globals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Localization */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-3"><Globe size={24} className="text-brand-600" /> Regional Node</h3>
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Master Language</label>
              <div className="relative group">
                <Languages size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-all" />
                <select className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all">
                  <option>English (International)</option>
                  <option>Somali (Soomaali)</option>
                  <option>Arabic (العربية)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Base Timezone</label>
              <div className="relative group">
                <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-all" />
                <select className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all">
                  <option>(GMT+03:00) Mogadishu</option>
                  <option>(GMT+03:00) Hargeisa</option>
                  <option>(GMT+00:00) UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Finance Defaults */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-3"><DollarSign size={24} className="text-brand-600" /> Financial Orchestration</h3>
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Base Currency</label>
                <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all">
                  <option>USD ($)</option>
                  <option>SOS (Ssh)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Default Tax (%)</label>
                <div className="relative group">
                  <input type="number" defaultValue="5.00" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-inner" />
                  <Percent size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 flex items-start gap-4">
              <HelpCircle size={20} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Financial changes affect all newly created invoices. Historical data remains locked for auditing integrity. Multi-currency checkout can be enabled at the warehouse level.
              </p>
            </div>
          </div>
        </div>

        {/* Default Operating Window (Newly Added) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
              <Clock size={24} className="text-amber-500" /> Default Operating Window
            </h3>
            <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-full flex items-center gap-2">
              <CalendarDays size={14} className="text-amber-600" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Global Schedule</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {days.map((day) => (
              <div key={day.name} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[28px] border border-slate-100 dark:border-slate-800/50 group transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm">
                <div className="flex items-center gap-5 mb-4 md:mb-0">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 dark:border-slate-600 shadow-sm group-hover:text-brand-600 transition-colors">
                    {day.short}
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{day.name}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Default</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {day.closed ? (
                    <div className="flex items-center gap-3 px-6 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Closed / Restricted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Open</label>
                        <input type="time" defaultValue="08:00" className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
                      </div>
                      <div className="w-4 h-px bg-slate-300 dark:bg-slate-700 mt-4" />
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Close</label>
                        <input type="time" defaultValue="22:00" className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
                      </div>
                    </div>
                  )}

                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

                  <button className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${day.closed ? 'bg-slate-200 dark:bg-slate-700' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${day.closed ? 'left-1' : 'right-1'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 rounded-[32px] flex items-start gap-4">
            <ShieldCheck size={20} className="text-brand-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-brand-800/70 dark:text-brand-400/70 leading-relaxed font-medium">
              Updating the Global Operating Window will set the initial schedule for all new warehouse nodes. Existing warehouses will retain their specific overrides unless "Force Propagate" is selected during commit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPreferences;
