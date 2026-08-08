import React, { useState, useEffect } from 'react';
import {
  Plus, X, Edit2, Trash2, ClipboardList, PenSquare, Award,
  Calendar, BookOpen, Send, Loader2, Search
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const EXAM_TYPES = ['Weekly', 'Monthly', 'Mid-Term', 'Final', 'Quiz'];

const emptyForm = () => ({
  title: '',
  examType: 'Mid-Term',
  classId: '',
  term: 'Term 1',
  academicYear: String(new Date().getFullYear()),
  examDate: new Date().toISOString().slice(0, 10),
  description: '',
  status: 'Scheduled',
  subjects: [{ name: '', fullMarks: 100, passMarks: 40 }]
});

const statusStyle = {
  Scheduled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Ongoing: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  Completed: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  Published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
};

const ExamsManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resExams, resClasses] = await Promise.all([
        api.get('/exams'),
        api.get('/classes')
      ]);
      setExams(resExams.data || []);
      setClasses(resClasses.data || []);
    } catch (error) {
      console.error('Failed to load exams', error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to load exams.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm(), classId: classes[0]?._id || '' });
    setIsModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditing(exam);
    setForm({
      title: exam.title || '',
      examType: exam.examType || 'Mid-Term',
      classId: exam.classId?._id || exam.classId || '',
      term: exam.term || '',
      academicYear: exam.academicYear || String(new Date().getFullYear()),
      examDate: (exam.examDate || new Date().toISOString()).slice(0, 10),
      description: exam.description || '',
      status: exam.status || 'Scheduled',
      subjects: (exam.subjects && exam.subjects.length)
        ? exam.subjects.map(s => ({ name: s.name, fullMarks: s.fullMarks, passMarks: s.passMarks }))
        : [{ name: '', fullMarks: 100, passMarks: 40 }]
    });
    setIsModalOpen(true);
  };

  const setSubject = (idx, key, value) => {
    setForm(prev => {
      const subjects = [...prev.subjects];
      subjects[idx] = { ...subjects[idx], [key]: value };
      return { ...prev, subjects };
    });
  };
  const addSubject = () => setForm(prev => ({ ...prev, subjects: [...prev.subjects, { name: '', fullMarks: 100, passMarks: 40 }] }));
  const removeSubject = (idx) => setForm(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showAlert({ type: 'warning', title: 'Validation', message: 'Enter an exam title.' });
    if (!form.classId) return showAlert({ type: 'warning', title: 'Validation', message: 'Select a class.' });
    const subjects = form.subjects
      .filter(s => s.name.trim())
      .map(s => ({ name: s.name.trim(), fullMarks: Number(s.fullMarks) || 100, passMarks: Number(s.passMarks) || 0 }));
    if (!subjects.length) return showAlert({ type: 'warning', title: 'Validation', message: 'Add at least one subject.' });
    if (subjects.some(s => s.passMarks > s.fullMarks)) return showAlert({ type: 'warning', title: 'Validation', message: 'Pass marks cannot exceed full marks.' });

    const payload = { ...form, subjects };
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/exams/${editing._id}`, payload);
        showAlert({ type: 'success', title: 'Updated', message: 'Exam updated.' });
      } else {
        await api.post('/exams', payload);
        showAlert({ type: 'success', title: 'Created', message: 'Exam created.' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      showAlert({ type: 'danger', title: 'Error', message: error.response?.data?.message || 'Failed to save exam.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exam) => {
    const ok = await showConfirm({
      type: 'warning', title: 'Delete Exam?',
      message: `Delete "${exam.title}" and all its entered marks? This cannot be undone.`,
      confirmText: 'Yes, delete', cancelText: 'Cancel', danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/exams/${exam._id}`);
      setExams(prev => prev.filter(e => e._id !== exam._id));
      showAlert({ type: 'success', title: 'Deleted', message: 'Exam removed.' });
    } catch (error) {
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to delete exam.' });
    }
  };

  const togglePublish = async (exam) => {
    const publish = exam.status !== 'Published';
    try {
      const { data } = await api.patch(`/exams/${exam._id}/publish`, { status: publish ? 'Published' : 'Completed' });
      setExams(prev => prev.map(e => e._id === exam._id ? { ...e, status: data.status } : e));
      showAlert({ type: 'success', title: publish ? 'Published' : 'Unpublished', message: publish ? 'Results are now published.' : 'Results hidden from published state.' });
    } catch (error) {
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to update status.' });
    }
  };

  const go = (path) => { window.location.hash = path; };

  const filtered = exams.filter(e => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const cls = e.classId?.name || e.classId?.className || '';
    return e.title.toLowerCase().includes(q) || e.examType.toLowerCase().includes(q) || cls.toLowerCase().includes(q);
  });

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Loading Exams...</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Examinations</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Create exams · enter marks · publish results</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-600/30 active:scale-95">
          <Plus size={18} /> New Exam
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md">
        <Search size={18} className="text-slate-400 mr-3" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, type, or class..." className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Exam</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Subjects</th>
                <th className="px-6 py-4 text-center">Marks Entered</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(exam => (
                <tr key={exam._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{exam.title}</p>
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">{exam.examType} · {exam.term} · {exam.academicYear}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{exam.classId?.name || exam.classId?.className || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(exam.examDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-[220px]">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{exam.subjects?.length || 0}</span> · {exam.subjects?.map(s => s.name).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 text-xs font-black rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">{exam.resultsCount || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${statusStyle[exam.status] || statusStyle.Scheduled}`}>{exam.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-1.5">
                      <button onClick={() => go(`/exams/marks?exam=${exam._id}`)} title="Enter Marks" className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-all"><PenSquare size={16} /></button>
                      <button onClick={() => go(`/exams/results?exam=${exam._id}`)} title="View Results" className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-all"><Award size={16} /></button>
                      <button onClick={() => togglePublish(exam)} title={exam.status === 'Published' ? 'Unpublish' : 'Publish results'} className={`p-2.5 rounded-xl transition-all ${exam.status === 'Published' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600'}`}><Send size={16} /></button>
                      <button onClick={() => openEdit(exam)} title="Edit" className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(exam)} title="Delete" className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="px-8 py-12 text-center text-slate-400 text-sm font-medium">No exams yet. Click "New Exam" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{editing ? 'Edit Exam' : 'New Exam'}</h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={22} /></button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Exam Title *</label>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-Term Examination" className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Exam Type</label>
                    <select value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white">
                      {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Class *</label>
                    <select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white">
                      <option value="">-- Select Class --</option>
                      {classes.map(c => <option key={c._id} value={c._id}>{c.name || c.className}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Term</label>
                    <input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} placeholder="Term 1" className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Academic Year</label>
                    <input value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Exam Date</label>
                    <input type="date" value={form.examDate} onChange={e => setForm({ ...form, examDate: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white">
                      {['Scheduled', 'Ongoing', 'Completed', 'Published'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Subjects */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2"><BookOpen size={16} /> Subjects & Marks</span>
                    <button type="button" onClick={addSubject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-black uppercase"><Plus size={14} /> Add Subject</button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr,110px,110px,40px] gap-2 px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Subject Name</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">Full Marks</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">Pass Marks</span>
                      <span></span>
                    </div>
                    {form.subjects.map((s, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr,110px,110px,40px] gap-2 items-center">
                        <input value={s.name} onChange={e => setSubject(idx, 'name', e.target.value)} placeholder="e.g. Quran, Tajweed, Maths" className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm text-slate-900 dark:text-white" />
                        <input type="number" min="1" value={s.fullMarks} onChange={e => setSubject(idx, 'fullMarks', e.target.value)} className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm text-slate-900 dark:text-white" />
                        <input type="number" min="0" value={s.passMarks} onChange={e => setSubject(idx, 'passMarks', e.target.value)} className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm text-slate-900 dark:text-white" />
                        <button type="button" onClick={() => removeSubject(idx)} disabled={form.subjects.length === 1} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 disabled:opacity-30"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white resize-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs uppercase disabled:opacity-70">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null} {editing ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsManagement;
