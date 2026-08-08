
import React from 'react';
import { 
  BarChart3, 
  FileText, 
  LineChart, 
  Box, 
  Users, 
  History, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  ChevronRight,
  LayoutGrid,
  Package,
  ShoppingCart,
  Warehouse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REPORT_MANIFEST = [
  { id: 'inventory', label: 'Inventory Reports', path: '/reports/inventory', icon: <Package size={24} />, color: 'bg-brand-600' },
  { id: 'purchasing', label: 'Purchasing Reports', path: '/reports/purchasing', icon: <ShoppingCart size={24} />, color: 'bg-amber-600' },
  { id: 'shipments', label: 'Sales & Distribution Reports', path: '/reports/shipments', icon: <FileText size={24} />, color: 'bg-sky-600' },
  { id: 'operations', label: 'Warehouse Operations Reports', path: '/reports/performance', icon: <Warehouse size={24} />, color: 'bg-emerald-600' }
];

const ReportsDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
              <BarChart3 size={32} strokeWidth={2.5} />
           </div>
           <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Smart Warehouse Reports</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Operational Insights & Decision Support</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-2">
        {REPORT_MANIFEST.map((category) => (
          <div key={category.id} onClick={() => navigate(category.path)} className="group bg-white dark:bg-slate-900 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-brand-500/30 transition-all duration-500 flex flex-col p-10 cursor-pointer">
            <div className={`w-16 h-16 ${category.color} rounded-[28px] flex items-center justify-center text-white mb-8 shadow-lg transition-transform group-hover:scale-110`}>
              {category.icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-brand-600 transition-colors">
              {category.label}
            </h3>
            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execute Module</span>
               <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-600 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsDashboard;
