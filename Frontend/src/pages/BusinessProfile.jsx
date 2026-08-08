import React, { useState, useEffect } from 'react';
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
  Twitter,
  Instagram,
  Facebook,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const BusinessProfile = () => {
  const { showAlert } = useAlert();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [tenant, setTenant] = useState({
    name: '',
    legalName: '',
    industry: 'Green warehouse',
    description: '',
    currency: 'USD',
    timezone: 'Africa/Nairobi',
    contactInfo: {
      email: '',
      phone: '',
      address: '',
      website: '',
      socials: { instagram: '', facebook: '', twitter: '' }
    },
    settings: {
      brandColor: '#4F46E5',
      accentColor: '#10B981'
    },
    operatingHours: [],
    logo: '' // Ensure logo is initialized
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tenants/me');
      // Initialize operating hours if empty
      if (!data.operatingHours || data.operatingHours.length === 0) {
        data.operatingHours = [
          'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ].map(day => ({ day, open: '08:00 AM', close: '10:00 PM', isClosed: day === 'Friday' }));
      }
      setTenant(data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/tenants/me', tenant);
      showAlert({
        type: 'success',
        title: 'Woohoo!',
        message: 'Business profile updated successfully.',
        buttonText: 'Continue'
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to update profile.',
        buttonText: 'Try again'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General Info', icon: <Building size={18} /> },
    { id: 'branding', label: 'Branding', icon: <Camera size={18} /> },
    { id: 'contact', label: 'Contact Details', icon: <Globe size={18} /> },
    { id: 'hours', label: 'Operating Hours', icon: <Clock size={18} /> },
  ];

  if (loading) return <div className="p-10 text-center">Loading Profile Data...</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/20 overflow-hidden">
            {tenant.logo ? (
              <img src={tenant.logo} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = tenant.name?.charAt(0) || 'B'; }} />
            ) : (
              tenant.name?.charAt(0) || 'B'
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{tenant.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" /> Verified Somali Professional Business
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 rounded-xl text-sm font-bold text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95 disabled:opacity-70"
        >
          {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Nav */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === s.id
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Information */}
          {activeTab === 'general' && (
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building size={20} className="text-brand-500" /> Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Display Business Name</label>
                  <input type="text" value={tenant.name} onChange={e => setTenant({ ...tenant, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white" />
                  <p className="text-[10px] text-slate-500">The name customers see on receipts and the portal.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Legal Entity Name</label>
                  <input type="text" value={tenant.legalName || ''} onChange={e => setTenant({ ...tenant, legalName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white" />
                  <p className="text-[10px] text-slate-500">Permanent legal name (used by System Admins for identification).</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">System Identifier (Read-only)</label>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed">
                    {tenant.subdomain}.Dugsi.so
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Industry</label>
                  <select value={tenant.industry} onChange={e => setTenant({ ...tenant, industry: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white">
                    <option>Cumar Binu Qadaab</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Base Currency</label>
                  <select value={tenant.currency || 'USD'} onChange={e => setTenant({ ...tenant, currency: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">System Timezone</label>
                  <select value={tenant.timezone || 'Africa/Nairobi'} onChange={e => setTenant({ ...tenant, timezone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white">
                    <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                    <option value="Africa/Mogadishu">Mogadishu (EAT)</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</label>
                  <textarea rows={3} value={tenant.description} onChange={e => setTenant({ ...tenant, description: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white resize-none" />
                </div>
              </div>
            </section>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Camera size={20} className="text-violet-500" /> Branding & Assets
              </h3>

              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Business Logo</label>
                  <label className="relative group cursor-pointer block w-32 h-32">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTenant({ ...tenant, logo: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="w-full h-full rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {tenant.logo ? <img src={tenant.logo} className="w-full h-full object-cover" /> : <Building size={40} className="text-slate-300 dark:text-slate-600" />}
                    </div>
                    <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/80 transition-all flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-3xl">
                      <Upload size={24} />
                    </div>
                  </label>
                  <p className="text-[10px] text-slate-500 max-w-[128px]">Min 500x500px, PNG or JPG supported.</p>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Brand Color</label>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input type="color" value={tenant.settings?.brandColor} onChange={e => setTenant({ ...tenant, settings: { ...tenant.settings, brandColor: e.target.value } })} className="w-8 h-8 rounded-lg bg-transparent border-none outline-none cursor-pointer" />
                        <span className="text-sm font-mono font-bold dark:text-slate-300">{tenant.settings?.brandColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accent Color</label>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input type="color" value={tenant.settings?.accentColor} onChange={e => setTenant({ ...tenant, settings: { ...tenant.settings, accentColor: e.target.value } })} className="w-8 h-8 rounded-lg bg-transparent border-none outline-none cursor-pointer" />
                        <span className="text-sm font-mono font-bold dark:text-slate-300">{tenant.settings?.accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Contact & Social */}
          {activeTab === 'contact' && (
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Globe size={20} className="text-sky-500" /> Contact & Social Presence
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Mail size={12} /> Email Address</label>
                  <input type="email" value={tenant.contactInfo?.email} onChange={e => setTenant({ ...tenant, contactInfo: { ...tenant.contactInfo, email: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Phone size={12} /> Phone Number</label>
                  <input type="text" value={tenant.contactInfo?.phone} onChange={e => setTenant({ ...tenant, contactInfo: { ...tenant.contactInfo, phone: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} /> Main Address</label>
                  <input type="text" value={tenant.contactInfo?.address} onChange={e => setTenant({ ...tenant, contactInfo: { ...tenant.contactInfo, address: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Globe size={12} /> Website</label>
                  <input type="text" value={tenant.contactInfo?.website} onChange={e => setTenant({ ...tenant, contactInfo: { ...tenant.contactInfo, website: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none dark:text-white" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Instagram size={16} className="text-rose-500" />
                    <input type="text" placeholder="@instagram" value={tenant.contactInfo?.socials?.instagram} onChange={e => setTenant({ ...tenant, contactInfo: { ...tenant.contactInfo, socials: { ...tenant.contactInfo.socials, instagram: e.target.value } } })} className="bg-transparent border-none outline-none text-xs font-bold dark:text-slate-300 w-full" />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Facebook size={16} className="text-blue-600" />
                    <input type="text" placeholder="facebook.com/..." value={tenant.contactInfo?.socials?.facebook} onChange={e => setTenant({ ...tenant, contactInfo: { ...tenant.contactInfo, socials: { ...tenant.contactInfo.socials, facebook: e.target.value } } })} className="bg-transparent border-none outline-none text-xs font-bold dark:text-slate-300 w-full" />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Twitter size={16} className="text-sky-400" />
                    <input type="text" placeholder="@twitter" value={tenant.contactInfo?.socials?.twitter} onChange={e => setTenant({ ...tenant, contactInfo: { ...tenant.contactInfo, socials: { ...tenant.contactInfo.socials, twitter: e.target.value } } })} className="bg-transparent border-none outline-none text-xs font-bold dark:text-slate-300 w-full" />
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Operating Hours */}
          {activeTab === 'hours' && (
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-amber-500" /> Operating Hours
              </h3>

              <div className="space-y-3">
                {tenant.operatingHours.map((item, idx) => (
                  <div key={item.day} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400">
                        {item.day.substring(0, 2)}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.day}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {item.isClosed ? (
                        <span className="text-xs font-black text-rose-500 uppercase">Closed</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="text" value={item.open} onChange={e => {
                            const newHours = [...tenant.operatingHours];
                            newHours[idx].open = e.target.value;
                            setTenant({ ...tenant, operatingHours: newHours });
                          }} className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none w-20 text-center" />
                          <div className="w-4 h-px bg-slate-300" />
                          <input type="text" value={item.close} onChange={e => {
                            const newHours = [...tenant.operatingHours];
                            newHours[idx].close = e.target.value;
                            setTenant({ ...tenant, operatingHours: newHours });
                          }} className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none w-20 text-center" />
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const newHours = [...tenant.operatingHours];
                          newHours[idx].isClosed = !newHours[idx].isClosed;
                          setTenant({ ...tenant, operatingHours: newHours });
                        }}
                        className={`w-10 h-6 rounded-full relative transition-colors ${item.isClosed ? 'bg-slate-300 dark:bg-slate-700' : 'bg-brand-600'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.isClosed ? 'left-1' : 'right-1'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
