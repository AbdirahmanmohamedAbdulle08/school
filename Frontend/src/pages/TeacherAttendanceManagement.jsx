import React, { useState, useEffect } from 'react';
import { Plus, X, CalendarCheck, Pencil } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const TeacherAttendanceManagement = () => {
  const { showAlert } = useAlert();
  const [teachers, setTeachers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [formData, setFormData] = useState({
    teacherId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    arrivalTime: '',
    remarks: ''
  });

  const getLateTimeLabel = (record) => {
    if (record.arrivalTime) return record.arrivalTime;

    // Older late records were stored before arrivalTime was introduced. Use
    // their recorded timestamp as the displayed late time.
    const recordedAt = record.updatedAt || record.createdAt;
    if (!recordedAt) return 'Not recorded';

    return new Date(recordedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAttendance, resUsers] = await Promise.all([
        api.get('/teacher-attendance'),
        api.get('/users')
      ]);
      setAttendanceRecords(resAttendance.data || []);
      const teacherList = (resUsers.data || []).filter(u => u.role === 'Teacher' || u.role === 'Super Admin');
      setTeachers(teacherList);
    } catch (error) {
      console.error("Failed to fetch teacher attendance", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      teacherId: teachers[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
      arrivalTime: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      teacherId: record.teacherId?._id || record.teacherId || '',
      date: record.date || new Date().toISOString().split('T')[0],
      status: record.status || 'Present',
      arrivalTime: record.arrivalTime || '',
      remarks: record.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacherId) {
      showAlert({ type: 'warning', title: 'Validation Error', message: 'Please select a teacher.' });
      return;
    }

    if (formData.status === 'Late' && !formData.arrivalTime) {
      showAlert({ type: 'warning', title: 'Validation Error', message: 'Please enter the arrival time for a late teacher.' });
      return;
    }

    try {
      const payload = {
        ...formData,
        arrivalTime: formData.status === 'Late' ? formData.arrivalTime : ''
      };
      const res = editingRecord
        ? await api.put(`/teacher-attendance/${editingRecord._id}`, payload)
        : await api.post('/teacher-attendance', payload);
      setAttendanceRecords(prev => editingRecord
        ? prev.map(record => record._id === editingRecord._id ? res.data : record)
        : [res.data, ...prev]);
      showAlert({ type: 'success', title: editingRecord ? 'Updated' : 'Recorded', message: `Teacher attendance ${editingRecord ? 'updated' : 'recorded'} successfully.` });
      setIsModalOpen(false);
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error("Failed to record teacher attendance", error);
      showAlert({ type: 'danger', title: 'Error', message: error.response?.data?.message || 'Failed to record attendance.' });
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Teacher Attendance...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <CalendarCheck size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Teacher Attendance</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Faculty Attendance Log</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Record Teacher Attendance
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Teacher Name</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Late Time</th>
                <th className="px-8 py-5">Remarks</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendanceRecords.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.teacherId?.fullName || (teachers.find(t => t._id === item.teacherId)?.fullName) || 'Teacher'}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${item.status === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : item.status === 'Late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                      {item.status}
                    </span>
                    {item.status === 'Late' && (
                      <p className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300">{getLateTimeLabel(item)}</p>
                    )}
                  </td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {item.status === 'Late' ? getLateTimeLabel(item) : '-'}
                  </td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {item.remarks || '-'}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
                      title="Edit attendance record"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {attendanceRecords.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-10 text-center text-slate-400 text-sm font-medium">No teacher attendance recorded. Click "Record Teacher Attendance" to record.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingRecord ? 'Edit Teacher Attendance' : 'Record Teacher Attendance'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Select Teacher *</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.fullName || t.username}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Attendance Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value, arrivalTime: e.target.value === 'Late' ? formData.arrivalTime : '' })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>

              {formData.status === 'Late' && (
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Late Arrival Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase shadow-lg hover:bg-purple-700"
                >
                  {editingRecord ? 'Save Changes' : 'Submit Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceManagement;
