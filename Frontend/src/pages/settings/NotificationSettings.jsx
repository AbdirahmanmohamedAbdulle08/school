import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, Mail, Shield, AlertTriangle, Save, Zap, Settings, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const NotificationSettings = () => {
  const { showAlert } = useAlert();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedChannel, setExpandedChannel] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      setSettings(data.notifications || {
        sms: { enabled: false },
        email: { enabled: true },
        push: { enabled: true }
      });
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', { notifications: settings });
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Notification settings saved successfully.',
        buttonText: 'Continue'
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to save notification settings.',
        buttonText: 'Try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateChannel = (channel, key, value) => {
    setSettings(prev => ({
      ...prev,
      [channel]: { ...prev[channel], [key]: value }
    }));
  };

  if (loading) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );

  const channels = [
    {
      id: 'sms', title: 'SMS Direct', icon: <Smartphone />,
      desc: 'Primary alerts for low stock, expiry and critical system events via SMS gateway.',
      color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      fields: [
        { key: 'provider', label: 'SMS Provider', placeholder: 'e.g. Twilio, Africa\'s Talking', type: 'text' },
        { key: 'apiKey', label: 'API Key', placeholder: 'Enter provider API key', type: 'password' },
        { key: 'senderName', label: 'Sender Name', placeholder: 'e.g. MyWarehouse', type: 'text' },
      ]
    },
    {
      id: 'email', title: 'Enterprise Email', icon: <Mail />,
      desc: 'Weekly analytics, order confirmations, invoices, and administrative recovery protocols.',
      color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20',
      fields: [
        { key: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.gmail.com', type: 'text' },
        { key: 'smtpPort', label: 'SMTP Port', placeholder: '587', type: 'number' },
        { key: 'smtpUser', label: 'SMTP Username', placeholder: 'user@domain.com', type: 'text' },
        { key: 'smtpPass', label: 'SMTP Password', placeholder: '••••••••', type: 'password' },
        { key: 'senderEmail', label: 'Sender Email', placeholder: 'noreply@mywarehouse.com', type: 'email' },
      ]
    },
    {
      id: 'push', title: 'Terminal Notifications', icon: <Zap />,
      desc: 'Real-time dashboard popups for concurrent multi-warehouse events and system updates.',
      color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20',
      fields: [
        { key: 'sound', label: 'Notification Sound', type: 'toggle' },
        { key: 'desktop', label: 'Desktop Notifications', type: 'toggle' },
      ]
    },
  ];

  return (
    <div className="p-6 space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <Bell size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Notifications</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Alert Channels & Delivery Configuration</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-700 shadow-xl transition-all active:scale-95 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {channels.map((channel) => (
          <div key={channel.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-brand-500/20 transition-all">
            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${channel.bg} ${channel.color} group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(channel.icon, { size: 28, strokeWidth: 2.5 })}
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black dark:text-white tracking-tight uppercase">{channel.title}</h4>
                  <p className="text-xs text-slate-500 max-w-sm">{channel.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setExpandedChannel(expandedChannel === channel.id ? null : channel.id)}
                  className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 flex items-center gap-2 hover:bg-white dark:hover:bg-slate-700 transition-all">
                  <Settings size={14} /> Configure
                </button>
                <button onClick={() => updateChannel(channel.id, 'enabled', !settings[channel.id]?.enabled)}
                  className={`w-14 h-8 rounded-full relative transition-all ${settings[channel.id]?.enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings[channel.id]?.enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Expanded Config */}
            {expandedChannel === channel.id && (
              <div className="px-8 pb-8 pt-0 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {channel.fields.map(field => (
                    field.type === 'toggle' ? (
                      <div key={field.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{field.label}</span>
                        <button onClick={() => updateChannel(channel.id, field.key, !settings[channel.id]?.[field.key])}
                          className={`w-14 h-8 rounded-full transition-all relative ${settings[channel.id]?.[field.key] ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings[channel.id]?.[field.key] ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    ) : (
                      <div key={field.key} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                        <input
                          type={field.type}
                          value={settings[channel.id]?.[field.key] || ''}
                          onChange={e => updateChannel(channel.id, field.key, field.type === 'number' ? parseInt(e.target.value) : e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Override Banner */}
      <div className="p-8 bg-slate-900 rounded-[40px] text-white border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
          <AlertTriangle size={160} />
        </div>
        <div className="relative z-10 space-y-4">
          <h5 className="text-xl font-black tracking-tight flex items-center gap-3"><Shield size={24} className="text-rose-500" /> Security Event Overrides</h5>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-medium">
            System critical notifications (login from new device, password changes, etc.) bypass user preferences and are always dispatched to the business owner via SMS and Email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
