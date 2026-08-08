import React, { useState, useMemo, useEffect } from 'react';
import {
  Fingerprint,
  Search,
  Filter,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowRight,
  Download,
  Users,
  Plus,
  X,
  ChevronDown,
  Building,
  ShieldCheck,
  UserCheck,
  CircleOff,
  Briefcase,
  History,
  Save,
  Check,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const STATUSES = ['Present', 'Absent', 'Half Day', 'Leave', 'Late', 'Overtime', 'Remote'];

const AttendanceManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]); // For dropdown
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    shift: 'Morning',
    status: 'Present',
    notes: ''
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedBranch, statusFilter]);

  useEffect(() => {
    // Fetch employees for dropdown when modal opens (or initially)
    const fetchEmployees = async () => {
      try {
        const [employeesRes, warehousesRes] = await Promise.all([
          api.get('/employees'),
          api.get('/warehouses')
        ]);
        const data = employeesRes.data;
        setEmployees(data);
        setWarehouses(warehousesRes.data);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/attendance`, {
        params: {
          date: selectedDate,
          warehouseId: selectedBranch !== 'all' ? selectedBranch : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined
        }
      });
      setAttendance(data);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      const search = searchTerm.toLowerCase();
      return (record.employeeId?.name || '').toLowerCase().includes(search) ||
        (record.employeeId?.employeeCode || '').toLowerCase().includes(search) ||
        (record.employeeId?.jobTitle || '').toLowerCase().includes(search);
    });
  }, [attendance, searchTerm]);

  const summary = useMemo(() => {
    const totalHours = filteredAttendance.reduce((sum, record) => sum + (Number(record.workHours) || 0), 0);
    return {
      total: filteredAttendance.length,
      present: filteredAttendance.filter(r => r.status === 'Present').length,
      late: filteredAttendance.filter(r => r.status === 'Late').length,
      absent: filteredAttendance.filter(r => r.status === 'Absent').length,
      leave: filteredAttendance.filter(r => r.status === 'Leave').length,
      hours: totalHours.toFixed(2)
    };
  }, [filteredAttendance]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = {
        employeeId: formData.employeeId,
        date: formData.date,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        shift: formData.shift,
        status: formData.status,
        notes: formData.notes
      };

      if (selectedRecord) {
        await api.put(`/attendance/${selectedRecord._id}`, payload);
      } else {
        await api.post('/attendance', payload);
      }
      setIsModalOpen(false);
      resetForm();
      setSelectedRecord(null);
      fetchAttendance();
    } catch (error) {
      console.error("Failed to mark attendance", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to mark attendance.',
        buttonText: 'Try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      date: selectedDate,
      checkInTime: '',
      checkOutTime: '',
      shift: 'Morning',
      status: 'Present',
      notes: ''
    });
  };

  const openNewModal = () => {
    setSelectedRecord(null);
    resetForm();
    setFormData(prev => ({ ...prev, date: selectedDate }));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    resetForm();
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      employeeId: record.employeeId?._id || '',
      date: record.date,
      checkInTime: record.checkIn || '',
      checkOutTime: record.checkOut || '',
      shift: record.shift || 'Morning',
      status: record.status || 'Present',
      notes: record.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleQuickStatus = async (record, status) => {
    try {
      await api.put(`/attendance/${record._id}`, {
        checkInTime: record.checkIn || '',
        checkOutTime: record.checkOut || '',
        shift: record.shift || 'Morning',
        status,
        notes: record.notes || ''
      });
      fetchAttendance();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to update attendance.',
        buttonText: 'Try again'
      });
    }
  };

  const handleDelete = async (record) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete attendance?',
      message: `Delete attendance record for ${record.employeeId?.name || 'this employee'} on ${record.date}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/attendance/${record._id}`);
      fetchAttendance();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to delete attendance.',
        buttonText: 'Try again'
      });
    }
  };

  const exportDailySummary = () => {
    const rows = [
      ['Date', 'Employee Code', 'Employee', 'Role', 'Warehouse', 'Check In', 'Check Out', 'Shift', 'Hours', 'Status', 'Notes'],
      ...filteredAttendance.map(record => [
        record.date,
        record.employeeId?.employeeCode || '',
        record.employeeId?.name || '',
        record.employeeId?.jobTitle || '',
        record.warehouseId?.name || '',
        record.checkIn || '',
        record.checkOut || '',
        record.shift || '',
        Number(record.workHours || 0).toFixed(2),
        record.status || '',
        record.notes || ''
      ])
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20';
      case 'Absent': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20';
      case 'Half Day': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20';
      case 'Leave': return 'bg-brand-50 text-brand-600 border-brand-100 dark:bg-brand-900/20';
      case 'Late': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20';
      case 'Overtime': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20';
      case 'Remote': return 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* 1. Page Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
            <Fingerprint size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Attendance</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Real-time presence monitoring & manual overrides</p>
          </div>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 group border border-slate-700 shadow-xl"
        >
          <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Mark Attendance
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          ['Records', summary.total],
          ['Present', summary.present],
          ['Late', summary.late],
          ['Absent', summary.absent],
          ['Leave', summary.leave],
          ['Hours', summary.hours]
        ].map(([label, value]) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* 2. Advanced Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 flex-1">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Search size={12} className="text-brand-500" /> Search Employee
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, code, role..."
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-xs font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-inner"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar size={12} className="text-brand-500" /> Observation Date
            </label>
            <div className="relative group">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-xs font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Building size={12} className="text-brand-500" /> Filter by Warehouse
            </label>
            <div className="relative group">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-xs font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all shadow-inner"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Filter size={12} className="text-brand-500" /> Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-xs font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all shadow-inner"
            >
              <option value="All">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportDailySummary} className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm group">
            <Download size={18} className="text-brand-500 group-hover:translate-y-0.5 transition-transform" />
            Daily Summary
          </button>
        </div>
      </div>

      {/* 3. Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Employee identity</th>
                <th className="px-10 py-6">Job Role</th>
                <th className="px-10 py-6">Check-in</th>
                <th className="px-10 py-6">Check-out</th>
                <th className="px-10 py-6">Shift</th>
                <th className="px-10 py-6">Hours</th>
                <th className="px-10 py-6 text-center">Protocol Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-10 text-slate-400 font-bold">Loading Attendance Logs...</td></tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-10 py-20 text-center opacity-30">
                    <div className="flex flex-col items-center gap-4">
                      <History size={48} strokeWidth={1} />
                      <p className="text-sm font-black uppercase tracking-widest">No records found for this selection</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                          {(record.employeeId?.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{record.employeeId?.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <MapPin size={10} /> {record.warehouseId?.name || 'Main'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-slate-400" />
                        {record.employeeId?.jobTitle}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                      {record.checkIn || '-'}
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                      {record.checkOut || '-'}
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-slate-500 dark:text-slate-400">
                      {record.shift || '-'}
                    </td>
                    <td className="px-10 py-8 text-sm font-black text-blue-600 dark:text-blue-300 tabular-nums">
                      {Number(record.workHours || 0).toFixed(2)}
                    </td>
                    <td className="px-10 py-8">
                      <div className={`mx-auto px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit flex items-center gap-2 border shadow-sm ${getStatusColor(record.status)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'Present' ? 'bg-emerald-500 animate-pulse' : record.status === 'Absent' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {record.status}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {record.status !== 'Present' && (
                          <button onClick={() => handleQuickStatus(record, 'Present')} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm active:scale-90" title="Mark present">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {record.status !== 'Absent' && (
                          <button onClick={() => handleQuickStatus(record, 'Absent')} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm active:scale-90" title="Mark absent">
                            <CircleOff size={16} />
                          </button>
                        )}
                        <button onClick={() => openEditModal(record)} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-600 transition-all shadow-sm active:scale-90" title="Edit attendance">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(record)} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm active:scale-90" title="Delete attendance">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>

        {/* Footer Statistics */}
        <div className="p-10 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observation Status</p>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-tight">
                <ShieldCheck size={16} /> Node Integrity Verified
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Records Compiled: {filteredAttendance.length}</p>
        </div>
      </div>

      {/* 4. Mark Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[56px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-12 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-600/30">
                  <UserCheck size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{selectedRecord ? 'Edit Attendance' : 'Log Attendance'}</h3>
                  <p className="text-sm text-slate-400 mt-2">Manual entry for presence, exceptions, and labor hours.</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleMarkAttendance} className="p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Employee *</label>
                  <select
                    required
                    disabled={!!selectedRecord}
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner appearance-none transition-all disabled:opacity-60"
                  >
                    <option value="">Search employee registry...</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Observation Date *</label>
                  <input
                    required
                    disabled={!!selectedRecord}
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Protocol Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none appearance-none"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shift *</label>
                  <select
                    required
                    value={formData.shift}
                    onChange={e => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none appearance-none"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Check-in Time</label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Check-out Time</label>
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Provide context for late arrival or leave..."
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="w-full sm:w-auto px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 w-full px-10 py-5 bg-brand-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed">
                  Authorize & Save <Check size={20} strokeWidth={3} className="group-hover:scale-125 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
