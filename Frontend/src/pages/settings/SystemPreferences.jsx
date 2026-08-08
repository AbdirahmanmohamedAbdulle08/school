import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, DollarSign, Globe2, Languages, Percent, Save } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { Link } from 'react-router-dom';

const DEFAULTS = { language: 'en', timezone: 'Africa/Mogadishu', currency: 'USD', defaultTax: 0 };

const SystemPreferences = () => {
  const { language, setLanguage, t } = useLanguage();
  const [preferences, setPreferences] = useState({ ...DEFAULTS, language });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setPreferences({ ...DEFAULTS, ...(data?.localization || {}) }))
      .catch(() => setPreferences((current) => ({ ...current, language })))
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => setPreferences((current) => ({ ...current, [key]: value }));
  const savePreferences = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { localization: preferences });
      setLanguage(preferences.language);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm font-bold text-slate-500">Loading system preferences…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t('systemPreferences')}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Set the language and default regional settings for the system.</p>
        </div>
        <button type="button" onClick={savePreferences} disabled={saving} className="premium-button premium-button-primary flex items-center justify-center gap-2 disabled:opacity-60"><Save size={17} /> {saving ? 'Saving…' : t('saveLanguage')}</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30"><Languages size={22} /></span><div><h2 className="font-black text-slate-900 dark:text-white">{t('systemLanguage')}</h2><p className="text-xs text-slate-500">Choose the app display language.</p></div></div>
          <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('systemLanguage')}</span><select value={preferences.language} onChange={(event) => update('language', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="en">English</option><option value="so">Soomaali</option><option value="ar">العربية</option></select></label>
        </section>

        <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30"><Globe2 size={22} /></span><div><h2 className="font-black text-slate-900 dark:text-white">Regional defaults</h2><p className="text-xs text-slate-500">Time zone and currency for new records.</p></div></div>
          <div className="space-y-4"><label className="block space-y-2"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><Clock size={14} /> Time zone</span><select value={preferences.timezone} onChange={(event) => update('timezone', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="Africa/Mogadishu">Mogadishu (EAT)</option><option value="Africa/Nairobi">Nairobi (EAT)</option><option value="UTC">UTC</option></select></label><label className="block space-y-2"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><DollarSign size={14} /> Currency</span><select value={preferences.currency} onChange={(event) => update('currency', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="USD">USD — US Dollar</option><option value="SOS">SOS — Somali Shilling</option></select></label><label className="block space-y-2"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><Percent size={14} /> Default tax</span><input type="number" min="0" max="100" step="0.01" value={preferences.defaultTax} onChange={(event) => update('defaultTax', Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label></div>
        </section>
        <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30"><Globe2 size={22} /></span><div><h2 className="font-black text-slate-900 dark:text-white">System identity</h2><p className="text-xs text-slate-500">Change the system name, browser title, sidebar text, brand colors, and logo.</p></div></div>
          <Link to="/settings/profile" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white transition hover:bg-brand-700">Manage name and logo</Link>
        </section>
      </div>
      {saved && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"><CheckCircle2 size={18} /> {t('languageSaved')}</div>}
    </div>
  );
};

export default SystemPreferences;
