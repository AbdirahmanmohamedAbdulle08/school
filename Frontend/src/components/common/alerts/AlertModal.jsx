import React, { useEffect } from 'react';
import { AlertTriangle, Check, Info, XCircle } from 'lucide-react';

const TYPE_CONFIG = {
  success: {
    title: 'Woohoo!',
    icon: Check,
    iconWrap: 'bg-sky-500 text-white',
    rings: ['bg-sky-100', 'bg-sky-200/70', 'bg-sky-300/50'],
    primary: 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-200',
  },
  error: {
    title: 'Uh oh!',
    icon: XCircle,
    iconWrap: 'bg-rose-400 text-white',
    rings: ['bg-rose-100', 'bg-rose-200/70', 'bg-rose-300/45'],
    primary: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-200',
  },
  warning: {
    title: 'Warning',
    icon: AlertTriangle,
    iconWrap: 'bg-amber-400 text-white',
    rings: ['bg-amber-100', 'bg-amber-200/70', 'bg-amber-300/45'],
    primary: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-200',
  },
  info: {
    title: 'Notice',
    icon: Info,
    iconWrap: 'bg-blue-500 text-white',
    rings: ['bg-blue-100', 'bg-blue-200/70', 'bg-blue-300/45'],
    primary: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-200',
  },
  confirm: {
    title: 'Are you sure?',
    icon: AlertTriangle,
    iconWrap: 'bg-amber-400 text-white',
    rings: ['bg-amber-100', 'bg-amber-200/70', 'bg-amber-300/45'],
    primary: 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-200',
  },
};

const AlertModal = ({ alert, onResolve }) => {
  useEffect(() => {
    if (!alert || alert.kind === 'confirm') return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onResolve(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert, onResolve]);

  if (!alert) return null;

  const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
  const Icon = config.icon;
  const isConfirm = alert.kind === 'confirm';
  const primaryClass = alert.danger ? TYPE_CONFIG.error.primary : config.primary;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-100/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[18px] bg-white px-7 pb-7 pt-10 text-center shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80 animate-in zoom-in-95 fade-in duration-200 sm:px-10">
        <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center">
          <span className={`absolute h-24 w-24 rounded-full ${config.rings[0]}`} />
          <span className={`absolute h-20 w-20 rounded-full ${config.rings[1]}`} />
          <span className={`absolute h-16 w-16 rounded-full ${config.rings[2]}`} />
          <span className={`relative flex h-14 w-14 items-center justify-center rounded-full ${config.iconWrap} shadow-lg`}>
            <Icon size={34} strokeWidth={4} />
          </span>
        </div>

        <h2 className="text-xl font-black tracking-tight text-slate-800">
          {alert.title || config.title}
        </h2>
        {alert.message && (
          <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-slate-500">
            {alert.message}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={`w-full rounded-md px-5 py-3 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-4 active:scale-[0.98] ${primaryClass}`}
          >
            {alert.confirmText || alert.buttonText || (isConfirm ? 'Confirm' : 'Continue')}
          </button>
          {isConfirm && (
            <button
              type="button"
              onClick={() => onResolve(false)}
              className="w-full rounded-md bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200 active:scale-[0.98]"
            >
              {alert.cancelText || 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
