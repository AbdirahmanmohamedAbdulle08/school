import React, { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail, User, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [setupStatus, setSetupStatus] = useState(null);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const { data } = await api.get('/users/setup-status');
      setSetupStatus(data);
      if (!data?.hasSuperAdmin) {
        setIsSetupMode(true);
      }
    } catch (e) {
      console.warn('Failed to check setup status:', e.message);
      // Haddii database-ka la waayo ama uu madhan yahay, u ogolow setup mode
      setIsSetupMode(true);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/users/login', {
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      if (onLogin) onLogin(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Gelitaanku wuu fashilmay. Hubi iimaylkaaga iyo furaha sirta, kadibna isku day mar kale.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/users/setup-initial-admin', {
        fullName: formData.fullName || 'System Administrator',
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setSuccessMsg('Super Admin si guul leh ayaa loo abuuray! Soo galitaanka ayaa socda...');
      setTimeout(() => {
        if (onLogin) onLogin(data);
        navigate('/', { replace: true });
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Abuurista Super Admin-ka way fashilantay. Fadlan isku day mar kale.');
      console.error('Setup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <section className="w-full max-w-md rounded-[32px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/30 dark:bg-slate-900 md:p-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            {isSetupMode ? <ShieldCheck size={32} /> : <GraduationCap size={32} />}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {isSetupMode ? 'Diiwaangeli Super Admin' : 'Cumar Binu Khadhaab'}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            {isSetupMode
              ? 'Abuur akoonka maamulaha guud ee nidaamka'
              : 'Ku soo dhowow nidaamka maamulka machadka'}
          </p>
        </div>

        {/* TABS KALA BEDDELASHADA: LOGIN VS SETUP */}
        <div className="mb-6 flex rounded-2xl bg-slate-100 dark:bg-slate-800/60 p-1">
          <button
            type="button"
            onClick={() => {
              setIsSetupMode(false);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              !isSetupMode
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <LogIn size={15} /> Soo gal
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSetupMode(true);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              isSetupMode
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserPlus size={15} /> Abuur Admin
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-xs font-bold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-xs font-bold text-emerald-600 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        {isSetupMode ? (
          /* FORM-KA SETUP-KA SUPER ADMIN-KA */
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Magacaaga oo buuxa
              </span>
              <span className="relative block">
                <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cabdiraxmaan Maxamed"
                  className="w-full py-3.5 pl-14 pr-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cinwaanka iimaylka
              </span>
              <span className="relative block">
                <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="admin@machad.edu"
                  className="w-full py-3.5 pl-14 pr-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Furaha sirta (Password)
              </span>
              <span className="relative block">
                <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full py-3.5 pl-14 pr-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Muuji ama qari furaha sirta"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 disabled:opacity-70 mt-2"
            >
              {isLoading ? 'Abuurista ayaa socota…' : (
                <span className="flex items-center justify-center gap-2">
                  Abuur & Toos u Gal <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>
        ) : (
          /* FORM-KA LOGIN-KA CAADIGA AH */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <label className="block space-y-1.5">
              <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cinwaanka iimaylka
              </span>
              <span className="relative block">
                <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="admin@machad.edu"
                  className="w-full py-3.5 pl-14 pr-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Furaha sirta
              </span>
              <span className="relative block">
                <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full py-3.5 pl-14 pr-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Muuji ama qari furaha sirta"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 disabled:opacity-70 mt-2"
            >
              {isLoading ? 'Gelitaanka ayaa socda…' : (
                <span className="flex items-center justify-center gap-2">
                  Soo gal <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default Login;
