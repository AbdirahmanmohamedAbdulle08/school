import React, { useState } from 'react';
import {
  Building,
  Camera,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Save,
  Upload,
  Instagram,
  Facebook,
  Twitter,
  ShieldCheck,
  Zap,
  Check,
  CreditCard,
  History,
  Download,
  Store,
  Users,
  Cpu,
  Languages,
  Monitor,
  DollarSign,
  Percent,
  Database,
  Trash2,
  AlertCircle,
  Shield,
  ChevronRight
} from 'lucide-react';

const BusinessManagement = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1200);
  };

  const sections = [
    { id: 'profile', label: 'Business Profile', icon: <Building size={18} /> },
    { id: 'subscription', label: 'Subscription & Plan', icon: <Zap size={18} /> },
    { id: 'settings', label: 'Core Settings', icon: <Shield size={18} /> },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Dynamic Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-brand-600 rounded-[28px] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-brand-600/20">
            P
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Business Management Hub</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Somali Professional Edition • Global Orchestration
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Synchronizing...' : <span className="flex items-center gap-2"><Save size={18} /> Commit Global Changes</span>}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[24px] w-fit shadow-inner border border-slate-200/50 dark:border-slate-800">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${activeSection === section.id
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xl ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-500 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="min-h-[600px]">
        {activeSection === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Branding & Logo */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Camera size={24} className="text-brand-600" /> Visual Identity
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-10">
                <div className="relative group">
                  <div className="w-40 h-40 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[36px] flex items-center justify-center overflow-hidden">
                    <Building size={48} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <button className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/80 transition-all flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-[36px]">
                    <Upload size={28} />
                  </button>
                </div>
                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Business Name</label>
                    <input type="text" defaultValue="ProCare Somalia" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand Color</label>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="w-8 h-8 rounded-lg bg-brand-600" />
                        <span className="text-[10px] font-mono font-bold dark:text-slate-300">#4F46E5</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accent</label>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500" />
                        <span className="text-[10px] font-mono font-bold dark:text-slate-300">#10B981</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Globe size={24} className="text-sky-500" /> Global Connectivity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Mail size={12} /> Primary Email</label>
                  <input type="email" defaultValue="hello@procare.so" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Phone size={12} /> Support Phone</label>
                  <input type="text" defaultValue="+252 61 XXX XXXX" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><MapPin size={12} /> HQ Address</label>
                  <input type="text" defaultValue="Km4, Maka Al Mukarama, Mogadishu" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">Social Portals</label>
                  <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-rose-500"><Instagram size={20} /></button>
                    <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-blue-600"><Facebook size={20} /></button>
                    <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sky-400"><Twitter size={20} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours Section */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Clock size={24} className="text-amber-500" /> Default Operating Window
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{day}</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">{day === 'Fri' ? 'CLOSED' : '08:00'}</span>
                      <span className="text-[10px] font-black text-slate-500">{day === 'Fri' ? '-' : '22:00'}</span>
                    </div>
                    <button className={`w-8 h-4 rounded-full relative transition-colors ${day === 'Fri' ? 'bg-slate-300 dark:bg-slate-700' : 'bg-brand-600'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${day === 'Fri' ? 'left-0.5' : 'right-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'subscription' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Usage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Active Warehouses', used: 4, total: 10, icon: <Store size={20} />, color: 'bg-brand-600' },
                { label: 'Staff Accounts', used: 12, total: 50, icon: <Users size={20} />, color: 'bg-emerald-600' },
                { label: 'AI Computes', used: 850, total: 1000, icon: <Cpu size={20} />, color: 'bg-violet-600' },
              ].map((u) => (
                <div key={u.label} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${u.color}/10 text-slate-900 dark:text-white`}>
                        {React.cloneElement(u.icon, { className: u.color.replace('bg-', 'text-') })}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{u.label}</span>
                    </div>
                    <span className="text-sm font-black tabular-nums dark:text-white">{u.used}/{u.total}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${u.color} rounded-full transition-all duration-1000`} style={{ width: `${(u.used / u.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { name: 'Basic', price: 150, active: false, desc: 'Entry tier for single warehouse operations.' },
                { name: 'Pro', price: 600, active: true, desc: 'Enterprise management for growing chains.' },
                { name: 'Ultimate', price: 1200, active: false, desc: 'Full orchestration for multi-region brands.' }
              ].map((plan) => (
                <div key={plan.name} className={`relative p-10 rounded-[48px] border-2 transition-all ${plan.active
                    ? 'bg-slate-900 text-white border-brand-600 shadow-2xl scale-105 z-10'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white'
                  }`}>
                  {plan.active && <div className="absolute top-6 right-6 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Current Tier</div>}
                  <h4 className="text-2xl font-black mb-2">{plan.name}</h4>
                  <p className={`text-xs mb-8 ${plan.active ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-10">
                    <span className="text-5xl font-black tabular-nums">${plan.price}</span>
                    <span className="text-sm font-bold opacity-50">/mo</span>
                  </div>
                  <button className={`w-full py-5 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${plan.active
                      ? 'bg-brand-600 hover:bg-brand-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-600 hover:text-white'
                    }`}>
                    {plan.active ? 'Active Subscription' : 'Upgrade Plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Localization Settings */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Languages size={24} className="text-brand-600" /> Platform Localization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Language</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white outline-none">
                    <option>English (International)</option>
                    <option>Somali (Soomaali)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base Timezone</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white outline-none">
                    <option>(GMT+03:00) Mogadishu</option>
                    <option>(GMT+03:00) Hargeisa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* UI Preferences */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Monitor size={24} className="text-sky-500" /> UI Orchestration
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-black dark:text-white">AI Insight Overlay</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Show Gemini suggestions</p>
                  </div>
                  <button className="w-12 h-6 bg-brand-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></button>
                </div>
                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-black dark:text-white">Multi-Warehouse Aggregation</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Combine all warehouse metrics</p>
                  </div>
                  <button className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full relative"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" /></button>
                </div>
              </div>
            </div>

            {/* Security Zone */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Database size={24} className="text-rose-500" /> Data Governance & Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-[36px] space-y-4">
                  <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                    <AlertCircle size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">Restricted Zone</span>
                  </div>
                  <p className="text-[11px] text-rose-800/70 dark:text-rose-400/70 leading-relaxed font-medium">
                    Adjusting global security parameters or performing system wipes is permanent. Always ensure a database snapshot is captured before commit.
                  </p>
                  <button className="flex items-center gap-2 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest hover:gap-3 transition-all">
                    Factory System Wipe <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Audit Log Retention</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white outline-none">
                      <option>90 Days (Standard)</option>
                      <option>365 Days (Compliance)</option>
                      <option>Unlimited (Enterprise Only)</option>
                    </select>
                  </div>
                  <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-brand-600 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest">Clear Daily Transaction Logs</span>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessManagement;
