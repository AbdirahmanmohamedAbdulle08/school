import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, History, Save, Cloud, ShieldCheck, CheckCircle2, HardDrive, Clock, Settings, Layers, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const BackupRestore = () => {
  const { showAlert } = useAlert();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      setSettings(data.backup || { autoBackupEnabled: false, frequency: 'weekly', retentionDays: 90, history: [] });
    } catch (error) {
      console.error('Failed to fetch backup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const { data } = await api.post('/settings/backup');
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: `Backup created: ${data.snapshot.id} (${data.snapshot.size}).`,
        buttonText: 'Continue'
      });
      await fetchSettings();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: `Backup failed: ${error.response?.data?.message || error.message}`,
        buttonText: 'Try again'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const { history, ...config } = settings;
      await api.put('/settings', { backup: config });
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Backup configuration saved.',
        buttonText: 'Continue'
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to save configuration.',
        buttonText: 'Try again'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <Database size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Backup & Restore</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Data Snapshots & Disaster Recovery</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {settings.lastBackupAt && (
            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              <ShieldCheck size={14} /> Last Backup: {new Date(settings.lastBackupAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Manual Backup Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Cloud size={200} />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-brand-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-brand-600/30">
              <Database size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-3xl font-black dark:text-white tracking-tight">Manual Snapshot</h3>
              <p className="text-slate-500 max-w-sm mt-1">Generate a point-in-time snapshot of all collections in your database.</p>
            </div>
            <button onClick={handleBackup} disabled={isBackingUp}
              className={`w-fit flex items-center gap-3 px-10 py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${isBackingUp ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/30'}`}>
              {isBackingUp ? (
                <><RefreshCw size={20} className="animate-spin" /> Creating Snapshot...</>
              ) : (
                <><HardDrive size={20} strokeWidth={3} /> Backup Now</>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-6 mt-12 pt-10 border-t border-slate-50 dark:border-slate-800">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Snapshots</p>
              <p className="text-lg font-black dark:text-white">{settings.history?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention</p>
              <p className="text-lg font-black dark:text-white">{settings.retentionDays} Days</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto Backup</p>
              <p className="text-lg font-black dark:text-white">{settings.autoBackupEnabled ? 'Active' : 'Disabled'}</p>
            </div>
          </div>
        </div>

        {/* Auto Backup Config */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2">
              <Settings size={16} className="text-brand-600" /> Auto Backup
            </h4>

            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Enabled</span>
              <button onClick={() => setSettings(prev => ({ ...prev, autoBackupEnabled: !prev.autoBackupEnabled }))}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.autoBackupEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.autoBackupEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency</label>
              <select value={settings.frequency} onChange={e => setSettings(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-sm text-slate-900 dark:text-white outline-none">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention (Days)</label>
              <input type="number" value={settings.retentionDays} onChange={e => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 90 }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-sm text-slate-900 dark:text-white outline-none" />
            </div>

            <button onClick={handleSaveConfig} disabled={saving}
              className="w-full py-4 bg-brand-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <History size={18} className="text-brand-600" /> Backup History
          </h4>
          <button onClick={fetchSettings} className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {settings.history?.length === 0 ? (
          <div className="p-12 text-center">
            <Database size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No backups yet</p>
            <p className="text-xs text-slate-400 mt-1">Create your first backup using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {settings.history?.map((snap, idx) => (
              <div key={snap.id || idx} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${snap.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
                    {snap.status === 'completed' ? <CheckCircle2 size={20} /> : <RefreshCw size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{snap.id}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(snap.createdAt).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Layers size={10} /> {snap.collections} collections • {snap.documents} docs
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-500">{snap.size}</span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${snap.type === 'auto' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {snap.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRestore;
