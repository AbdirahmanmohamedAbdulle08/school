import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Phone,
  DollarSign,
  UserCheck,
  Edit2,
  Trash2,
  X,
  User
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const TeachersManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: 'Male',
    salary: ''
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users?role=Teacher');
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      showAlert({
        type: 'danger',
        title: 'Error',
        message: 'Failed to load teachers.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const stats = useMemo(() => {
    const total = teachers.length;
    const maleCount = teachers.filter(t => t.gender === 'Male').length;
    const femaleCount = teachers.filter(t => t.gender === 'Female').length;
    const totalSalary = teachers.reduce((sum, t) => sum + (Number(t.salary) || 0), 0);
    return { total, maleCount, femaleCount, totalSalary };
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch =
        t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.phone?.includes(searchTerm);
      const matchesGender =
        genderFilter === 'All' || t.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [teachers, searchTerm, genderFilter]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: '',
      phone: '',
      gender: 'Male',
      salary: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      fullName: teacher.fullName || teacher.username || '',
      phone: teacher.phone || '',
      gender: teacher.gender || 'Male',
      salary: teacher.salary ? String(teacher.salary) : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showAlert({
        type: 'warning',
        title: 'Validation Error',
        message: 'Full Name is required.'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        fullName: formData.fullName.trim(),
        username: formData.fullName.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        role: 'Teacher',
        salary: Number(formData.salary) || 0
      };

      if (editingTeacher) {
        await api.put(`/users/${editingTeacher._id}`, payload);
        showAlert({
          type: 'success',
          title: 'Updated',
          message: 'Teacher details updated successfully.'
        });
      } else {
        await api.post('/users', payload);
        showAlert({
          type: 'success',
          title: 'Registered',
          message: 'New Teacher registered successfully.'
        });
      }

      setIsModalOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error('Failed to save teacher:', error);
      showAlert({
        type: 'danger',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save teacher record.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (teacher) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete Teacher?',
      message: `Are you sure you want to delete teacher "${teacher.fullName}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      danger: true
    });

    if (!ok) return;

    try {
      await api.delete(`/users/${teacher._id}`);
      showAlert({
        type: 'success',
        title: 'Deleted',
        message: 'Teacher account deleted.'
      });
      fetchTeachers();
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      showAlert({
        type: 'danger',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete teacher.'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium animate-pulse">
        Loading Teachers Data...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <GraduationCap size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Teachers Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">
              Teaching Staff Directory & Academic Registration
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-3 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-brand-500/25 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Register New Teacher
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <GraduationCap size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Teachers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</h3>
          </div>
        </div>

        <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Payroll</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              ${stats.totalSalary.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teacher by name or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['All', 'Male', 'Female'].map(s => (
            <button
              key={s}
              onClick={() => setGenderFilter(s)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                genderFilter === s
                  ? 'bg-slate-900 text-white dark:bg-brand-500 shadow-md'
                  : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              {s === 'All' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Teacher Name</th>
                <th className="px-8 py-5">Phone Number</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Monthly Salary</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-semibold text-sm">
                    No teachers found. Click "Register New Teacher" to add one.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(t => (
                  <tr
                    key={t._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-black text-base flex items-center justify-center border border-brand-100 dark:border-brand-900">
                          {t.fullName?.[0]?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {t.fullName || t.username}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Faculty / Teacher
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      {t.phone ? (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                          <Phone size={13} className="text-slate-400" />
                          {t.phone}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">N/A</span>
                      )}
                    </td>

                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.gender === 'Female'
                          ? 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {t.gender || 'Male'}
                      </span>
                    </td>

                    <td className="px-8 py-5 font-black text-slate-900 dark:text-white text-sm">
                      ${(Number(t.salary) || 0).toLocaleString()}
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 transition-colors"
                          title="Delete Teacher"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 max-w-lg w-full p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingTeacher ? 'Edit Teacher' : 'Register New Teacher'}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">Faculty Information</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 234 567 890"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Status *</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Monthly Salary ($)</label>
                <input
                  type="number"
                  placeholder="2500"
                  value={formData.salary}
                  onChange={e => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  {submitting ? 'Saving...' : editingTeacher ? 'Save Changes' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersManagement;
