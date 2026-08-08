import React, { useState, useEffect } from 'react';
import {
  Printer, QrCode, Barcode, FileText, Save, RefreshCw,
  Settings, Monitor, Wifi, Bluetooth, Usb, Image,
  Type, Hash, ChevronRight, CheckCircle2, ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const LabelsPrinting = () => {
  const { showAlert } = useAlert();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('printer');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      setSettings(data.labelPrinting || {});
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', { labelPrinting: settings });
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Label and printing settings saved.',
        buttonText: 'Continue'
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to save settings.',
        buttonText: 'Try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const update = (section, key, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: { ...prev[section], [key]: value }
      }));
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  if (loading) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Settings...</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'printer', label: 'Printer Setup', icon: <Printer size={16} /> },
    { id: 'barcode', label: 'Barcode Labels', icon: <Barcode size={16} /> },
    { id: 'qr', label: 'QR Settings', icon: <QrCode size={16} /> },
    { id: 'receipt', label: 'Receipt Template', icon: <FileText size={16} /> },
  ];

  const connectionTypes = [
    { id: 'usb', label: 'USB', icon: <Usb size={20} />, desc: 'Direct USB connection' },
    { id: 'network', label: 'Network', icon: <Wifi size={20} />, desc: 'Wi-Fi / Ethernet (IP)' },
    { id: 'bluetooth', label: 'Bluetooth', icon: <Bluetooth size={20} />, desc: 'Wireless Bluetooth' },
    { id: 'none', label: 'Not Set', icon: <Monitor size={20} />, desc: 'No printer configured' },
  ];

  const barcodeFormats = ['CODE128', 'EAN13', 'UPC', 'CODE39', 'QR'];
  const errorCorrections = [
    { id: 'L', label: 'Low (7%)' },
    { id: 'M', label: 'Medium (15%)' },
    { id: 'Q', label: 'Quartile (25%)' },
    { id: 'H', label: 'High (30%)' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <Printer size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Labels & Printing</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Printer Config, Barcode & Receipt Templates</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-700 shadow-xl transition-all active:scale-95 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
              ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-lg'
              : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Printer Setup */}
      {activeTab === 'printer' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <Printer size={20} className="text-brand-500" /> Printer Configuration
            </h3>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connection Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {connectionTypes.map(ct => (
                  <button key={ct.id} onClick={() => update(null, 'connectionType', ct.id)}
                    className={`p-6 rounded-[24px] border-2 transition-all text-left group ${settings.connectionType === ct.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'}`}
                  >
                    <div className={`mb-3 ${settings.connectionType === ct.id ? 'text-brand-600' : 'text-slate-400'}`}>{ct.icon}</div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{ct.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{ct.desc}</p>
                    {settings.connectionType === ct.id && (
                      <CheckCircle2 size={16} className="text-brand-500 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Printer Name</label>
                <input type="text" value={settings.printerName || ''} onChange={e => update(null, 'printerName', e.target.value)}
                  placeholder="e.g. Zebra ZD421"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
              </div>
              {settings.connectionType === 'network' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Printer IP Address</label>
                  <input type="text" value={settings.printerIP || ''} onChange={e => update(null, 'printerIP', e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Settings */}
      {activeTab === 'barcode' && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Barcode size={20} className="text-emerald-500" /> Barcode Label Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barcode Format</label>
              <div className="grid grid-cols-3 gap-3">
                {barcodeFormats.map(f => (
                  <button key={f} onClick={() => update('barcode', 'format', f)}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${settings.barcode?.format === f
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'}`}
                  >{f}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Prefix</label>
              <input type="text" value={settings.barcode?.prefix || ''} onChange={e => update('barcode', 'prefix', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Label Width (px)</label>
              <input type="number" value={settings.barcode?.width || 200} onChange={e => update('barcode', 'width', parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Label Height (px)</label>
              <input type="number" value={settings.barcode?.height || 100} onChange={e => update('barcode', 'height', parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Font Size</label>
              <input type="number" value={settings.barcode?.fontSize || 12} onChange={e => update('barcode', 'fontSize', parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Show Text Below Barcode</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Display human-readable code under barcode</p>
              </div>
              <button onClick={() => update('barcode', 'showText', !settings.barcode?.showText)}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.barcode?.showText ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.barcode?.showText ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Settings */}
      {activeTab === 'qr' && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <QrCode size={20} className="text-violet-500" /> QR Code Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Size (px)</label>
              <input type="number" value={settings.qr?.size || 150} onChange={e => update('qr', 'size', parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Error Correction Level</label>
              <div className="grid grid-cols-2 gap-3">
                {errorCorrections.map(ec => (
                  <button key={ec.id} onClick={() => update('qr', 'errorCorrection', ec.id)}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${settings.qr?.errorCorrection === ec.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'}`}
                  >{ec.label}</button>
                ))}
              </div>
            </div>

            {/* QR Data Includes */}
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Data Includes</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'includeProductName', label: 'Product Name' },
                  { key: 'includeSKU', label: 'SKU Code' },
                  { key: 'includePrice', label: 'Price' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.label}</span>
                    <button onClick={() => update('qr', item.key, !settings.qr?.[item.key])}
                      className={`w-14 h-8 rounded-full transition-all relative ${settings.qr?.[item.key] ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.qr?.[item.key] ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Template */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 space-y-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <FileText size={20} className="text-sky-500" /> Receipt Configuration
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paper Width (mm)</label>
                <input type="number" value={settings.receipt?.width || 80} onChange={e => update('receipt', 'width', parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Header Text</label>
                <textarea rows={2} value={settings.receipt?.headerText || ''} onChange={e => update('receipt', 'headerText', e.target.value)}
                  placeholder="e.g. Welcome to Our Warehouse!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Footer Text</label>
                <textarea rows={2} value={settings.receipt?.footerText || ''} onChange={e => update('receipt', 'footerText', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" />
              </div>

              {[
                { key: 'showLogo', label: 'Show Business Logo' },
                { key: 'showAddress', label: 'Show Address' },
                { key: 'showPhone', label: 'Show Phone Number' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.label}</span>
                  <button onClick={() => update('receipt', item.key, !settings.receipt?.[item.key])}
                    className={`w-14 h-8 rounded-full transition-all relative ${settings.receipt?.[item.key] ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.receipt?.[item.key] ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-8">
              <Monitor size={20} className="text-brand-500" /> Live Preview
            </h3>
            <div className="max-w-[300px] mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-lg font-mono text-xs space-y-3">
              {settings.receipt?.showLogo && (
                <div className="w-12 h-12 bg-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-300">
                  <Image size={20} />
                </div>
              )}
              <div className="text-center font-black text-slate-900 text-sm uppercase tracking-tight">My Warehouse</div>
              {settings.receipt?.headerText && <p className="text-center text-slate-500 text-[10px]">{settings.receipt.headerText}</p>}
              {settings.receipt?.showAddress && <p className="text-center text-slate-400 text-[10px]">123 Warehouse St, City</p>}
              {settings.receipt?.showPhone && <p className="text-center text-slate-400 text-[10px]">+1 234 567 890</p>}
              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Item A x2</span><span className="font-bold text-slate-900">$24.00</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Item B x1</span><span className="font-bold text-slate-900">$12.50</span></div>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between font-black text-slate-900">
                <span>TOTAL</span><span>$36.50</span>
              </div>
              {settings.receipt?.footerText && (
                <p className="text-center text-slate-400 text-[10px] pt-2 border-t border-dashed border-slate-200">{settings.receipt.footerText}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelsPrinting;
