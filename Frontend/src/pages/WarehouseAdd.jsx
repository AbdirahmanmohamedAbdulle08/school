import React, { useState } from 'react';
import {
    Plus,
    Store,
    MapPin,
    User,
    Clock,
    Shield,
    ArrowRight,
    X,
    Navigation,
    CheckCircle2,
    Calendar,
    UserPlus,
    Mail,
    Lock,
    Phone,
    ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const WarehouseAdd = () => {
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showNewManagerForm, setShowNewManagerForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        manager: '',
        managerId: '',
        newManager: {
            username: '',
            email: '',
            password: '',
            phone: ''
        },
        phone: '',
        capacity: 20,
        services: []
    });

    const [managers, setManagers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    React.useEffect(() => {
        const fetchManagers = async () => {
            setLoadingUsers(true);
            try {
                const { data } = await api.get('/users');
                setManagers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchManagers();
    }, []);

    // Determine if we're creating a new manager or assigning existing
    const isNewManager = showNewManagerForm && formData.newManager.username && formData.newManager.email && formData.newManager.password;

    const handleNext = async () => {
        if (step === 3) {
            try {
                const payload = {
                    name: formData.name,
                    address: { street: formData.address }, // Simple mapping
                    capacity: Number(formData.capacity),
                    contact: { phone: formData.phone }
                };

                if (isNewManager) {
                    payload.manager = formData.newManager.username;
                    payload.newManager = formData.newManager;
                } else {
                    payload.manager = formData.manager;
                    payload.managerId = formData.managerId;
                }

                await api.post('/warehouses', payload);
                navigate('/warehouses/list');
            } catch (error) {
                console.error("Failed to create warehouse", error);
                showAlert({
                    type: 'error',
                    title: 'Uh oh!',
                    message: error.response?.data?.message || 'Failed to create warehouse.',
                    buttonText: 'Try again'
                });
            }
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSelectManager = (e) => {
        const selectedUser = managers.find(u => u._id === e.target.value);
        if (selectedUser) {
            setFormData({
                ...formData,
                managerId: e.target.value,
                manager: selectedUser.username,
                newManager: { username: '', email: '', password: '', phone: '' }
            });
            setShowNewManagerForm(false);
        } else {
            setFormData({
                ...formData,
                managerId: '',
                manager: ''
            });
        }
    };

    const handleToggleNewManager = () => {
        if (showNewManagerForm) {
            // Closing the form — clear new manager data
            setShowNewManagerForm(false);
            setFormData({
                ...formData,
                newManager: { username: '', email: '', password: '', phone: '' }
            });
        } else {
            // Opening the form — clear existing selection
            setShowNewManagerForm(true);
            setFormData({
                ...formData,
                managerId: '',
                manager: ''
            });
        }
    };

    const getManagerDisplayName = () => {
        if (showNewManagerForm && formData.newManager.username) {
            return `${formData.newManager.username} (New User)`;
        }
        if (formData.manager) return formData.manager;
        return 'Unassigned';
    };

    return (
        <div className="p-6 max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Progress Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white">
                                <Plus size={24} strokeWidth={3} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Expand Your Network</h2>
                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Warehouse Onboarding</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/warehouses/list')}
                            className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex-1 flex items-center gap-2">
                                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black dark:text-white">Physical Signature</h3>
                                <p className="text-sm text-slate-500">Define the core identity and location of the new warehouse.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Warehouse Identity Name</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="e.g. West Mogadishu Retail"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-brand-500/10 outline-none dark:text-white transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Physical Coordinates / Address</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Street name, District"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-brand-500/10 outline-none dark:text-white transition-all"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-brand-50/30 dark:bg-brand-900/10 rounded-[28px] border border-brand-100/50 dark:border-brand-500/20 flex items-start gap-4">
                                <Navigation size={20} className="text-brand-600 mt-1" />
                                <div>
                                    <p className="text-xs font-black text-brand-900 dark:text-brand-300 uppercase">Geospatial Validation</p>
                                    <p className="text-xs text-brand-700/70 dark:text-brand-400/70 mt-1">Warehouse will be automatically pinned to your global tenant map. High accuracy coordinates recommended.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black dark:text-white">Leadership Assignment</h3>
                                <p className="text-sm text-slate-500">Appoint a manager to lead this warehouse. Choose an existing user or create a new one.</p>
                            </div>

                            {/* Manager Selection Row: Select + [+] Button */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Manager</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                                        <select
                                            className="w-full pl-12 pr-10 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-sm font-semibold outline-none dark:text-white appearance-none cursor-pointer hover:border-brand-500/30 focus:ring-4 focus:ring-brand-500/10 transition-all"
                                            value={formData.managerId}
                                            onChange={handleSelectManager}
                                            disabled={showNewManagerForm}
                                        >
                                            <option value="">{loadingUsers ? 'Loading users...' : 'Select existing user...'}</option>
                                            {managers.map(user => (
                                                <option key={user._id} value={user._id}>
                                                    {user.username} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>

                                    {/* [+] Create New User Button */}
                                    <button
                                        type="button"
                                        onClick={handleToggleNewManager}
                                        className={`p-4 rounded-2xl transition-all active:scale-95 shadow-sm border flex items-center justify-center ${
                                            showNewManagerForm 
                                                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
                                                : 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-500/20'
                                        }`}
                                        title={showNewManagerForm ? 'Cancel new user' : 'Create new user'}
                                    >
                                        {showNewManagerForm ? <X size={20} strokeWidth={3} /> : <UserPlus size={20} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>

                            {/* Inline New User Creation Form */}
                            {showNewManagerForm && (
                                <div className="animate-in slide-in-from-top-4 duration-300 bg-brand-50/30 dark:bg-brand-900/10 rounded-[28px] border border-brand-200/50 dark:border-brand-500/20 p-8 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                                            <UserPlus size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black dark:text-white">Create New Manager Account</h4>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">This user will be created alongside the warehouse</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name *</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Sarah Smith"
                                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                                    value={formData.newManager.username}
                                                    onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, username: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address *</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input
                                                    type="email"
                                                    placeholder="sarah@company.com"
                                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                                    value={formData.newManager.email}
                                                    onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, email: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password *</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                                    value={formData.newManager.password}
                                                    onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, password: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone (Optional)</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input
                                                    type="tel"
                                                    placeholder="+252 61..."
                                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-semibold outline-none dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                                    value={formData.newManager.phone}
                                                    onChange={e => setFormData({ ...formData, newManager: { ...formData.newManager, phone: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual confirmation when all required fields are filled */}
                                    {formData.newManager.username && formData.newManager.email && formData.newManager.password && (
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 animate-in fade-in duration-300">
                                            <CheckCircle2 size={18} className="text-emerald-600" />
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                <span className="font-black">{formData.newManager.username}</span> will be created as the manager when you finalize.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2 pt-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Staff Capacity Limit</label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    className="w-full px-4 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-sm font-semibold outline-none dark:text-white"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            <div className="text-center py-10 space-y-4">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                                    <CheckCircle2 size={40} strokeWidth={3} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black dark:text-white">Ready for Initialization</h3>
                                    <p className="text-sm text-slate-500">Configuration summary for {formData.name || 'New Warehouse'}.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                    <p className="text-sm font-bold dark:text-white">{formData.address || 'Pending'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager</p>
                                    <p className="text-sm font-bold dark:text-white">{getManagerDisplayName()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Previous Step
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 px-8 py-4 bg-brand-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-700 hover:shadow-2xl hover:shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {step === 3 ? 'Finalize Onboarding' : 'Continue'} <ArrowRight size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarehouseAdd;
