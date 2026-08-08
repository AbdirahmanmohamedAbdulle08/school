import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, AlertCircle, AlertTriangle, ArrowRight, ArrowRightLeft, BookOpen,
    DollarSign, Download, Plus, Send, ShieldCheck, UserCheck, Users, Wallet, CalendarCheck, CreditCard, Receipt
} from 'lucide-react';
import KPICard from './KPICard';
import api from '../services/api';

const DashboardOverview = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        kpis: {},
        activities: [],
        notifications: [],
        alerts: { lowStock: [], expiry: [], delayed: [] }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data } = await api.get('/dashboard');
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] flex-col items-center justify-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Institute Analytics...</span>
            </div>
        );
    }

    const { kpis, activities = [], notifications = [] } = dashboardData;
    const today = new Date();

    const quickActions = [
        { title: 'Add Student', subtitle: 'Register new student', icon: Plus, path: '/academic/students' },
        { title: 'Student Attendance', subtitle: 'Mark daily attendance', icon: CalendarCheck, path: '/attendance/students' },
        { title: 'Record Payment', subtitle: 'Collect fee payment', icon: Receipt, path: '/finance/payments' },
        { title: 'Create Class', subtitle: 'Add new class', icon: BookOpen, path: '/academic/classes' },
    ];

    const activityRows = activities.length > 0
        ? activities.slice(0, 6).map((item) => ({
            title: `${item.module || 'System'} - ${item.detail || item.action || 'Transaction'}`,
            time: item.date ? new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            color: item.action === 'Expense' ? 'bg-rose-500' : item.action === 'Income' ? 'bg-emerald-500' : 'bg-blue-500',
        }))
        : [];

    return (
        <div className="mx-auto max-w-[1700px] space-y-7 p-4 pb-12 md:p-8">
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-purple-600 to-blue-700 p-6 text-white shadow-2xl shadow-brand-900/20 md:p-8">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(30deg, rgba(255,255,255,.18) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,.18) 87.5%, rgba(255,255,255,.18)), linear-gradient(150deg, rgba(255,255,255,.18) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,.18) 87.5%, rgba(255,255,255,.18))', backgroundSize: '56px 96px' }} />
                <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider ring-1 ring-white/20">
                            <ShieldCheck size={15} /> Institute System Active
                        </div>
                        <h1 className="text-3xl font-black tracking-tight md:text-5xl">Welcome back, Admin!</h1>
                        <p className="mt-3 max-w-2xl text-sm font-medium text-white/80 md:text-base">Here is your Institute performance overview for today.</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <div className="rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Today</p>
                                <p className="text-sm font-black">{today.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Status</p>
                                <p className="text-sm font-black">Classes Operational</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {quickActions.map((action) => (
                            <button
                                key={action.title}
                                onClick={() => navigate(action.path)}
                                className="group rounded-3xl bg-white/15 p-4 text-left ring-1 ring-white/20 backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/25"
                            >
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-lg">
                                    {React.createElement(action.icon, { size: 20 })}
                                </div>
                                <p className="font-black">{action.title}</p>
                                <p className="text-xs font-semibold text-white/70">{action.subtitle}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard label="Total Students" value={kpis.totalStudents || 0} icon={<Users size={20} />} color="bg-emerald-500" />
                <KPICard label="Total Teachers" value={kpis.totalTeachers || 0} icon={<UserCheck size={20} />} color="bg-violet-600" />
                <KPICard label="Total Classes" value={kpis.totalClasses || 0} icon={<BookOpen size={20} />} color="bg-blue-600" />
                <KPICard label="Total Guardians" value={kpis.totalGuardians || 0} icon={<Users size={20} />} color="bg-amber-500" />
                <KPICard label="Monthly Income" value={`$${(kpis.monthlyIncome || 0).toLocaleString()}`} icon={<DollarSign size={20} />} color="bg-teal-500" />
                <KPICard label="Monthly Expenses" value={`$${(kpis.monthlyExpenses || 0).toLocaleString()}`} icon={<ArrowRightLeft size={20} />} color="bg-rose-500" />
                <KPICard label="Wallet Balance" value={`$${(kpis.walletBalance || 0).toLocaleString()}`} icon={<Wallet size={20} />} color="bg-emerald-600" />
                <KPICard label="Pending Student Fees" value={`$${(kpis.pendingStudentFees || 0).toLocaleString()}`} icon={<CreditCard size={20} />} color="bg-purple-600" />
                <KPICard label="Student Attendance Today" value={kpis.todayStudentAttendance || 0} icon={<CalendarCheck size={20} />} color="bg-brand-500" />
                <KPICard label="Teacher Attendance Today" value={kpis.todayTeacherAttendance || 0} icon={<CalendarCheck size={20} />} color="bg-pink-500" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-[30px] bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white">Recent Transactions</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Activity</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {activityRows.length > 0 ? (
                            activityRows.map((act, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${act.color}`} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{act.title}</p>
                                            <p className="text-xs text-slate-400">{act.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-sm font-medium text-slate-400">No recent transactions.</div>
                        )}
                    </div>
                </div>

                <div className="rounded-[30px] bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white">System Notifications</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alerts & Fee Reminders</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {notifications.length > 0 ? (
                            notifications.slice(0, 5).map((note) => (
                                <div key={note._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{note.message}</p>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-sm font-medium text-slate-400">No notifications found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
