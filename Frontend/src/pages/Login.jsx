import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, GraduationCap, ShieldCheck, BookOpen, Users, WalletCards, ClipboardCheck, Activity, Building2, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const commandMetrics = [
        { label: 'Active Students', value: '1,250+', icon: GraduationCap, color: 'text-emerald-300' },
        { label: 'Classes & Courses', value: '38 Active', icon: BookOpen, color: 'text-accent-300' },
        { label: 'Attendance Rate', value: '96.8%', icon: Activity, color: 'text-accent-300' },
    ];

    const workspaceAreas = [
        { icon: GraduationCap, label: 'Students' },
        { icon: Award, label: 'Teachers' },
        { icon: WalletCards, label: 'Fee & Finance' },
        { icon: ClipboardCheck, label: 'Attendance' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/users/login', {
                email: formData.email,
                password: formData.password
            });

            const data = response.data;

            if (onLogin) {
                onLogin(data);
            } else {
                localStorage.setItem('userInfo', JSON.stringify(data));
                navigate('/');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials and try again.';
            setError(errorMessage);
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 p-4 font-sans selection:bg-brand-500/30 md:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,.98),rgba(15,23,42,.94)_38%,rgba(30,27,75,.9)),radial-gradient(circle_at_20%_20%,rgba(99,102,241,.2),transparent_28rem),radial-gradient(circle_at_80%_12%,rgba(14,165,233,.2),transparent_30rem)]" />

            <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-white shadow-2xl shadow-black/30 dark:bg-slate-950 lg:grid-cols-[1.12fr_0.88fr]">
                <section className="relative hidden bg-[#090d16] p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
                    <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-brand-500/20 to-transparent" />

                    <div className="relative space-y-10">
                        <div className="mb-14 flex items-center gap-3">
                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-accent-600 to-accent-600 shadow-xl shadow-brand-950/40">
                                <GraduationCap size={28} className="text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black tracking-wide text-white">MACHAD</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-300">Institute Management System</p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-brand-200">
                                <Building2 size={14} /> Educational Excellence Portal
                            </p>
                            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight text-white">
                                Welcome to Machad Institute Control Center.
                            </h1>
                        </div>

                        <div className="grid max-w-2xl grid-cols-3 gap-3">
                            {commandMetrics.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                                    <div className="mb-5 flex items-center justify-between">
                                        {React.createElement(item.icon, { size: 22, className: item.color })}
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.8)]" />
                                    </div>
                                    <p className="text-2xl font-black">{item.value}</p>
                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative space-y-4">
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Integrated Institute Portal</p>
                                <p className="mt-1 text-sm font-bold text-white">Role-based security for Admins, Teachers, and Staff.</p>
                            </div>
                            <ShieldCheck className="text-brand-400" size={28} />
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {workspaceAreas.map((item) => (
                                <div key={item.label} className="rounded-2xl bg-white/8 p-4 text-center ring-1 ring-white/10 backdrop-blur">
                                    {React.createElement(item.icon, { size: 20, className: 'mx-auto mb-3 text-brand-300' })}
                                    <p className="text-[10px] font-black uppercase tracking-wider text-white/80">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
                    <div className="relative z-10 w-full max-w-[480px] animate-in fade-in zoom-in-95 premium-card p-8 duration-500 md:p-10">
                        <div className="mb-10 space-y-4">
                            <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-accent-600 to-accent-600 text-white shadow-lg shadow-brand-600/25">
                                <GraduationCap size={32} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Sign In to Machad</h2>
                                <h3 className="mt-2 bg-gradient-to-r from-brand-500 via-accent-600 to-accent-600 bg-clip-text text-xs font-bold uppercase tracking-[0.2em] text-transparent">
                                    Institute Management Portal
                                </h3>
                            </div>
                            <p className="max-w-[340px] text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                Enter your credentials to access your administrative dashboard, student logs, and institute records.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center">
                                <p className="text-xs font-bold text-rose-500">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div className="group space-y-2">
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-brand-600">Email Address</label>
                                    <div className="relative">
                                        <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600" />
                                        <input
                                            type="email"
                                            placeholder="admin@machad.edu"
                                            className="w-full py-5 pl-14 pr-6"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="group space-y-2">
                                    <div className="ml-1 flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-brand-600">Password</label>
                                    </div>
                                    <div className="relative">
                                        <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="............"
                                            className="w-full py-5 pl-14 pr-14"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group w-full rounded-[24px] bg-brand-600 py-5 text-xs uppercase tracking-[0.2em] text-white shadow-xl shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Authenticating...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Sign In <ArrowRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 border-t border-slate-100 pt-8 text-center dark:border-slate-800">
                            <p className="text-xs font-medium text-slate-400">
                                Protected by role-based access and secure Machad session controls.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Login;
