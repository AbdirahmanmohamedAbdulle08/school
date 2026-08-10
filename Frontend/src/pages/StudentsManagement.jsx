import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Users, Search, CheckCircle2, UserPlus, Loader2, DollarSign } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const StudentsManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [foundGuardian, setFoundGuardian] = useState(null);
  const [isSearchingGuardian, setIsSearchingGuardian] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    classId: '',
    gender: 'Male',
    monthlyFee: '',
    fatherName: '',
    fatherPhone: '',
    guardianId: '',
    guardianName: '',
    guardianPhone: '',
    guardianAlternatePhone: '',
    guardianRelationship: 'Father'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStudents, resClasses, resGuardians] = await Promise.all([
        api.get('/students'),
        api.get('/classes'),
        api.get('/guardians')
      ]);
      setData(resStudents.data || []);
      setClasses(resClasses.data || []);
      setGuardians(resGuardians.data || []);
    } catch (error) {
      console.error("Failed to fetch students data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time lookup for Who Pays the Fee by phone number
  useEffect(() => {
    const phone = (formData.guardianPhone || '').trim();
    if (!phone || phone.length < 3) {
      setFoundGuardian(null);
      setFormData(prev => ({ ...prev, guardianId: '' }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingGuardian(true);
        const res = await api.get(`/guardians?phone=${encodeURIComponent(phone)}`);
        const existing = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;

        if (existing) {
          setFoundGuardian(existing);
          setFormData(prev => ({
            ...prev,
            guardianId: existing._id,
            guardianName: existing.fullName || prev.guardianName,
            guardianRelationship: existing.relationship || prev.guardianRelationship || 'Father'
          }));
        } else {
          setFoundGuardian(null);
          setFormData(prev => ({ ...prev, guardianId: '' }));
        }
      } catch (err) {
        console.error('Phone lookup failed:', err);
      } finally {
        setIsSearchingGuardian(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.guardianPhone]);

  const openAddModal = () => {
    setEditingItem(null);
    setFoundGuardian(null);
    setFormData({
      fullName: '',
      rollNumber: '',
      classId: classes[0]?._id || '',
      gender: 'Male',
      monthlyFee: '',
      fatherName: '',
      fatherPhone: '',
      guardianId: '',
      guardianName: '',
      guardianPhone: '',
      guardianAlternatePhone: '',
      guardianRelationship: 'Father'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    const existingG = item.guardianId && typeof item.guardianId === 'object' ? item.guardianId : null;
    setFoundGuardian(existingG);
    setFormData({
      fullName: item.fullName || '',
      rollNumber: item.rollNumber || '',
      classId: item.classId?._id || item.classId || '',
      gender: item.gender || 'Male',
      monthlyFee: item.monthlyFee !== undefined ? item.monthlyFee : (item.fee || ''),
      fatherName: item.fatherName || '',
      fatherPhone: item.fatherPhone || '',
      guardianId: existingG?._id || item.guardianId || '',
      guardianName: existingG?.fullName || '',
      guardianPhone: existingG?.phone || '',
      guardianAlternatePhone: existingG?.alternatePhone || '',
      guardianRelationship: existingG?.relationship || 'Father'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName) {
      showAlert({ type: 'warning', title: 'Validation Error', message: 'Student full name is required.' });
      return;
    }

    try {
      let guardianId = formData.guardianId;

      // If no existing fee payer matched but phone is supplied, create or fetch the fee payer
      if (!guardianId && formData.guardianPhone) {
        const guardianPayload = {
          fullName: formData.guardianName || formData.fatherName || 'Fee Payer',
          phone: formData.guardianPhone,
          alternatePhone: formData.guardianAlternatePhone,
          relationship: formData.guardianRelationship || 'Father'
        };

        const guardianRes = await api.post('/guardians', guardianPayload);
        guardianId = guardianRes.data?._id || guardianRes.data?.id;
      } else if (guardianId && formData.guardianPhone) {
        // Keep both fee-payer phone numbers up to date when editing a student.
        await api.put(`/guardians/${guardianId}`, {
          fullName: formData.guardianName || formData.fatherName || 'Fee Payer',
          phone: formData.guardianPhone,
          alternatePhone: formData.guardianAlternatePhone,
          relationship: formData.guardianRelationship || 'Father'
        });
      }

      const payload = {
        fullName: formData.fullName,
        rollNumber: formData.rollNumber,
        classId: formData.classId,
        gender: formData.gender,
        monthlyFee: Number(formData.monthlyFee) || 0,
        fee: Number(formData.monthlyFee) || 0,
        fatherName: formData.fatherName || formData.guardianName || '',
        fatherPhone: formData.fatherPhone || formData.guardianPhone || '',
        guardianId: guardianId || undefined
      };

      if (editingItem) {
        await api.put(`/students/${editingItem._id}`, payload);
        showAlert({ type: 'success', title: 'Success', message: 'Student updated successfully.' });
      } else {
        await api.post('/students', payload);
        showAlert({ type: 'success', title: 'Success', message: 'New student registered successfully.' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save student', error);
      showAlert({ type: 'danger', title: 'Error', message: error.response?.data?.message || 'Failed to save student.' });
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete Student?',
      message: `Are you sure you want to delete "${item.fullName}"? This cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    try {
      await api.delete(`/students/${item._id}`);
      setData(prev => prev.filter(i => i._id !== item._id));
      showAlert({ type: 'success', title: 'Deleted', message: 'Student deleted successfully.' });
    } catch (error) {
      console.error("Failed to delete student", error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to delete student.' });
    }
  };

  const filteredData = data.filter(item => {
    const gName = item.guardianId?.fullName || '';
    const gPhone = item.guardianId?.phone || '';
    const className = item.classId?.name || '';
    return (
      (item.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fatherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fatherPhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      gName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.guardianId?.alternatePhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      className.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Students...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-emerald-400 shadow-2xl border border-slate-700 ring-4 ring-emerald-400/10">
            <Users size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Students</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Student Directory & Fee Management</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Add New Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md">
        <Search size={18} className="text-slate-400 mr-3" />
        <input
          type="text"
          placeholder="Search students by name, roll no, fee payer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Full Name</th>
                <th className="px-8 py-5">Roll No</th>
                <th className="px-8 py-5">Class</th>
                <th className="px-8 py-5">Student Fee ($)</th>
                <th className="px-8 py-5">Who Pays the Fee</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((item) => {
                const guardian = item.guardianId && typeof item.guardianId === 'object' ? item.guardianId : null;
                const cls = item.classId && typeof item.classId === 'object' ? item.classId : classes.find(c => c._id === item.classId);
                const studentFee = item.monthlyFee !== undefined ? item.monthlyFee : (item.fee || 0);

                return (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.fullName}
                    </td>
                    <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {item.rollNumber || '-'}
                    </td>
                    <td className="px-8 py-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {cls?.name || '-'}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(studentFee).toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {guardian ? (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{guardian.fullName}</span>
                          <span className="text-xs text-slate-400 block font-mono">{guardian.phone}{guardian.alternatePhone ? ` / ${guardian.alternatePhone}` : ''} ({guardian.relationship || 'Payer'})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 opacity-60">Not Linked</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => openEditModal(item)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-10 text-center text-slate-400 text-sm font-medium">No students found. Click "Add New Student" to register a student.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingItem ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Details Section */}
              <div className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pt-1">
                Student Details
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hassan Ahmed"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Roll / ID Number</label>
                  <input
                    type="text"
                    placeholder="STU-1001"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Class</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Student Fee ($) *</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={formData.monthlyFee}
                      onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Who Pays the Fee Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                  Who Pays the Fee (Fee Payer)
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Fee Payer Phone Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter phone number..."
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                      />
                      {isSearchingGuardian && (
                        <Loader2 className="animate-spin absolute right-3 top-3.5 text-slate-400" size={18} />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Fee Payer Second Phone Number</label>
                    <input
                      type="text"
                      placeholder="Optional second phone number..."
                      value={formData.guardianAlternatePhone}
                      onChange={(e) => setFormData({ ...formData, guardianAlternatePhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Who Pays the Fee (Name)</label>
                    <input
                      type="text"
                      placeholder="Fee Payer Full Name"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Relationship</label>
                  <select
                    value={formData.guardianRelationship}
                    onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Responsible">Responsible</option>
                  </select>
                </div>

                {/* Real-time status indicator banner */}
                {foundGuardian && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                    <div>
                      <span className="font-bold">Existing Fee Payer Found:</span> {foundGuardian.fullName} ({foundGuardian.relationship || 'Payer'}). Reusing record & linking student.
                    </div>
                  </div>
                )}

                {!foundGuardian && formData.guardianPhone && formData.guardianPhone.trim().length >= 3 && !isSearchingGuardian && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center gap-3 text-xs font-semibold text-brand-700 dark:text-brand-300">
                    <UserPlus size={18} className="shrink-0 text-brand-500" />
                    <div>
                      <span className="font-bold">New Fee Payer:</span> No existing fee payer found with this phone number. A new record will be created & linked.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase shadow-lg hover:bg-emerald-700"
                >
                  {editingItem ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;
