
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Current billing period: 25th of one month → 24th of the next.
const currentPeriodLabel = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const start = d >= 25 ? new Date(y, m, 25) : new Date(y, m - 1, 25);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 24);
  const fmt = (dt) => dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
};

const KPICard = ({ label, value, trend, icon, color, description, progress }) => {
  const isPositive = trend >= 0;
  const hasTrend = Number.isFinite(trend);
  const desc = description || currentPeriodLabel();
  const sparkline = [24, 34, 28, 46, 38, 56, 50];

  return (
    <div className="premium-card group p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg shadow-slate-900/10 dark:shadow-none group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {hasTrend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black tracking-tight ${
            isPositive
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-400">{desc}</p>
      </div>
      {typeof progress === 'number' ? (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      ) : (
        <div className="mt-5 flex h-8 items-end gap-1">
          {sparkline.map((height, index) => (
            <span
              key={index}
              className={`flex-1 rounded-t-full ${isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default KPICard;
