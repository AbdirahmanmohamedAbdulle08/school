import React, { useState, useEffect } from 'react';
import { Printer, Save, Image as ImageIcon, Layout, Type, Smartphone, AlignLeft, Info } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const ReceiptSettings = () => {
  const { showAlert } = useAlert();
  const [headerText, setHeaderText] = useState('PROCARE LUXURY SPA');
  const [footerText, setFooterText] = useState('Thank you for choosing ProCare. Visit us again!');
  const [showLogo, setShowLogo] = useState(true);
  const [showTax, setShowTax] = useState(true);
  const [showWarehouseAddress, setShowWarehouseAddress] = useState(true);
  const [showLoyalty, setShowLoyalty] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/tenants/me');
      if (data?.logo) {
        setLogoUrl(data.logo);
      }
      if (data?.settings?.receipt) {
        const { receipt } = data.settings;
        setHeaderText(receipt.headerText || data.name || '');
        setFooterText(receipt.footerText || '');
        setShowLogo(receipt.showLogo !== undefined ? receipt.showLogo : true);
        setShowTax(receipt.showTax !== undefined ? receipt.showTax : true);
        setShowWarehouseAddress(receipt.showWarehouseAddress !== undefined ? receipt.showWarehouseAddress : true);
        setShowLoyalty(receipt.showLoyalty !== undefined ? receipt.showLoyalty : true);
      } else if (data?.name) {
        setHeaderText(data.name);
      }
    } catch (error) {
      console.error("Failed to fetch tenant settings", error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        settings: {
          receipt: {
            headerText,
            footerText,
            showLogo,
            showTax,
            showWarehouseAddress,
            showLoyalty
          }
        }
      };
      await api.put('/tenants/me', payload);
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Receipt settings updated successfully.',
        buttonText: 'Continue'
      });
    } catch (error) {
      console.error("Failed to save settings", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to save settings.',
        buttonText: 'Try again'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Receipt Customization</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Design the physical and digital footprint of your transactions.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-600/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
          <Save size={18} /> {loading ? 'Saving...' : 'Update Template'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Editor Panel */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
            <h3 className="text-xl font-black dark:text-white flex items-center gap-3"><Type size={22} className="text-brand-600" /> Typography & Content</h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Receipt Header (Business Name)</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Footer Message</label>
                <textarea
                  rows={3}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
            <h3 className="text-xl font-black dark:text-white flex items-center gap-3"><Layout size={22} className="text-brand-600" /> Layout Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Display Business Logo', state: showLogo, set: setShowLogo },
                { label: 'Display Tax Breakdown', state: showTax, set: setShowTax },
                { label: 'Print Warehouse Address', state: showWarehouseAddress, set: setShowWarehouseAddress },
                { label: 'Show Loyalty Balance', state: showLoyalty, set: setShowLoyalty },
              ].map((toggle, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-xs font-bold dark:text-slate-200">{toggle.label}</span>
                  <button
                    onClick={() => toggle.set(!toggle.state)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${toggle.state ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${toggle.state ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 ml-4">Dynamic Preview (Thermal 80mm)</p>
            <div className="bg-white p-8 shadow-2xl rounded-sm border-t-8 border-brand-600 text-slate-900 min-h-[500px] flex flex-col items-center font-mono">
              {showLogo && (
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Business Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-slate-400" />
                  )}
                </div>
              )}
              <h4 className="text-sm font-black uppercase mb-1">{headerText}</h4>
              <p className="text-[9px] mb-6">Warehouse: Mogadishu Main Hub {showWarehouseAddress ? '(Address Visible)' : ''}</p>

              <div className="w-full border-t border-dashed border-slate-200 my-4" />

              <div className="w-full space-y-3 text-[10px]">
                <div className="flex justify-between">
                  <span>1x Signature Haircut</span>
                  <span>$35.00</span>
                </div>
                <div className="flex justify-between">
                  <span>2x Beard Sculpting</span>
                  <span>$40.00</span>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-slate-200 my-4" />

              <div className="w-full space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="font-bold">SUBTOTAL</span>
                  <span className="font-bold">$75.00</span>
                </div>
                {showTax && (
                  <div className="flex justify-between">
                    <span>Tax (5%)</span>
                    <span>$3.75</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-2">
                  <span>TOTAL</span>
                  <span>$78.75</span>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-slate-200 my-6" />

              <p className="text-[9px] text-center uppercase tracking-tight opacity-70">
                {footerText}
              </p>

              {showLoyalty && (
                <p className="text-[8px] text-center mt-2 font-bold">Loyalty Points Earned: 75</p>
              )}

              <div className="mt-8 text-center">
                <p className="text-[8px] opacity-40">ORDER: #PX-8821-MOG</p>
                <p className="text-[8px] opacity-40 uppercase">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button className="flex items-center gap-2 text-brand-600 text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all">
                Print Test Ticket <Printer size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptSettings;
