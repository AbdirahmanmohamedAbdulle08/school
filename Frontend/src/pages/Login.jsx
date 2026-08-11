import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/users/login', formData);
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <section className="w-full max-w-md rounded-[32px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/30 dark:bg-slate-900 md:p-10">
        <div className="mb-9 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Cumar Binu Khadhaab</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Ku soo dhowow nidaamka maamulka machadka</p>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-xs font-bold text-rose-600 dark:text-rose-300">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block space-y-2">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Cinwaanka iimaylka</span>
            <span className="relative block"><Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" placeholder="admin@machad.edu" className="w-full py-4 pl-14 pr-5" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required /></span>
          </label>
          <label className="block space-y-2">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Furaha sirta</span>
            <span className="relative block"><Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full py-4 pl-14 pr-14" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label="Muuji ama qari furaha sirta" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
          </label>
          <button type="submit" disabled={isLoading} className="group w-full rounded-2xl bg-brand-600 py-4 text-sm font-black text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 disabled:opacity-70">
            {isLoading ? 'Gelitaanka ayaa socda…' : <span className="flex items-center justify-center gap-2">Soo gal <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></span>}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
