import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Calendar, CalendarCheck, Clock, Plus, Users, X } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const today = () => new Date().toISOString().split('T')[0];
const emptyEntry = () => ({ studentId: '', status: 'Absent', arrivalTime: '' });

const StudentAttendanceManagement = () => {
  const { showAlert } = useAlert();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedSession, setSelectedSession] = useState('Morning');
  const [entry, setEntry] = useState(emptyEntry());
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [adding, setAdding] = useState(false);

  const classStudents = useMemo(() => students.filter(student => String(student.classId?._id || student.classId) === String(selectedClassId)), [students, selectedClassId]);
  const selectedClassName = classes.find(item => String(item._id) === String(selectedClassId))?.name || '';
  const exceptionRecords = useMemo(() => records.filter(record => record.status === 'Late' || record.status === 'Absent'), [records]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [classResponse, studentResponse] = await Promise.all([api.get('/classes'), api.get('/students')]);
        setClasses(classResponse.data || []);
        setStudents(studentResponse.data || []);
      } catch (error) {
        console.error('Failed to load attendance data', error);
        showAlert({ type: 'danger', title: 'Unable to load attendance', message: 'Please refresh the page and try again.' });
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [showAlert]);

  useEffect(() => {
    setEntry(emptyEntry());
  }, [selectedClassId, selectedDate, selectedSession]);

  useEffect(() => {
    if (!selectedClassId) {
      setRecords([]);
      return;
    }

    const loadExceptions = async () => {
      try {
        setLoadingRecords(true);
        const response = await api.get('/student-attendance', {
          params: { classId: selectedClassId, date: selectedDate, session: selectedSession }
        });
        setRecords(response.data || []);
      } catch (error) {
        console.error('Failed to load attendance exceptions', error);
        showAlert({ type: 'danger', title: 'Unable to load records', message: 'Please try again.' });
      } finally {
        setLoadingRecords(false);
      }
    };
    loadExceptions();
  }, [selectedClassId, selectedDate, selectedSession, showAlert]);

  const addException = async () => {
    if (!entry.studentId) {
      showAlert({ type: 'warning', title: 'Select a student', message: 'Choose the student who is absent or late.' });
      return;
    }
    if (entry.status === 'Late' && !entry.arrivalTime) {
      showAlert({ type: 'warning', title: 'Late time required', message: 'Enter the student\'s arrival time.' });
      return;
    }

    try {
      setAdding(true);
      const response = await api.post('/student-attendance', {
        studentId: entry.studentId,
        classId: selectedClassId,
        date: selectedDate,
        session: selectedSession,
        status: entry.status,
        arrivalTime: entry.status === 'Late' ? entry.arrivalTime : ''
      });
      const savedRecord = response.data;
      setRecords(previous => [...previous.filter(record => String(record.studentId?._id || record.studentId) !== String(entry.studentId)), savedRecord]);
      setEntry(emptyEntry());
      showAlert({ type: 'success', title: 'Attendance added', message: `The ${entry.status.toLowerCase()} record was added to the database.` });
    } catch (error) {
      console.error('Failed to add attendance exception', error);
      showAlert({ type: 'danger', title: 'Could not add attendance', message: error.response?.data?.message || 'Please try again.' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Student Attendance...</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 pb-24 animate-in fade-in duration-700">
      <div className="flex items-center gap-5 px-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-slate-700 bg-slate-900 text-brand-400 shadow-2xl ring-4 ring-brand-400/10 dark:bg-slate-800"><CalendarCheck size={32} strokeWidth={2.5} /></div>
        <div>
          <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-slate-900 dark:text-white">Student Attendance</h1>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Add absent and late students only</p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3">
        <div><label className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-500"><BookOpen size={14} className="text-brand-500" /> Class</label><select value={selectedClassId} onChange={event => setSelectedClassId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">Select class...</option>{classes.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
        <div><label className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Calendar size={14} className="text-emerald-500" /> Date</label><input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
        <div><label className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Clock size={14} className="text-amber-500" /> Session</label><select value={selectedSession} onChange={event => setSelectedSession(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="Morning">Morning</option><option value="Breakfast">Breakfast</option><option value="Evening">Evening</option></select></div>
      </section>

      {selectedClassId && <>
        <section className="rounded-[32px] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm dark:border-brand-500/20 dark:from-brand-500/10 dark:to-slate-900">
          <div className="mb-5"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Attendance exception</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Add an absent or late student</h2><p className="mt-1 text-xs font-semibold text-slate-500">Present students do not need a record. This adds only the selected absence or lateness to the database.</p></div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
            <div><label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">Student</label><select value={entry.studentId} onChange={event => setEntry(previous => ({ ...previous, studentId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">Select a student...</option>{classStudents.map(student => <option key={student._id} value={student._id}>{student.fullName} — {student.rollNumber || student.studentCode || 'No ID'}</option>)}</select></div>
            <div><label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">Status</label><select value={entry.status} onChange={event => setEntry(previous => ({ ...previous, status: event.target.value, arrivalTime: event.target.value === 'Late' ? previous.arrivalTime : '' }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="Absent">Absent</option><option value="Late">Late</option></select></div>
            <div><label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">Arrival time</label>{entry.status === 'Late' ? <input type="time" value={entry.arrivalTime} onChange={event => setEntry(previous => ({ ...previous, arrivalTime: event.target.value }))} className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 outline-none dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300" /> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800/70">Not needed for absent</div>}</div>
            <button type="button" onClick={addException} disabled={adding || !entry.studentId} className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} strokeWidth={3} /> {adding ? 'Adding...' : 'Add record'}</button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800"><AlertCircle className="text-amber-500" size={20} /><div><h2 className="font-black text-slate-900 dark:text-white">Recorded exceptions{selectedClassName ? ` — ${selectedClassName}` : ''}</h2><p className="mt-1 text-xs font-semibold text-slate-500">Absent and late students saved for this date and session.</p></div></div>
          {loadingRecords ? <div className="p-10 text-center text-sm font-semibold text-slate-400">Loading records...</div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800 dark:bg-slate-800/30"><th className="px-7 py-4">Student</th><th className="px-7 py-4">Status</th><th className="px-7 py-4">Arrival time</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{exceptionRecords.map(record => <tr key={record._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20"><td className="px-7 py-5 font-bold text-slate-900 dark:text-white">{record.studentId?.fullName || 'Student'}</td><td className="px-7 py-5"><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${record.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{record.status}</span></td><td className="px-7 py-5 text-sm font-semibold text-slate-500">{record.arrivalTime || '—'}</td></tr>)}{!exceptionRecords.length && <tr><td colSpan="3" className="px-7 py-12 text-center text-sm font-semibold text-slate-400">No absent or late students recorded.</td></tr>}</tbody></table></div>}
        </section>
      </>}
    </div>
  );
};

export default StudentAttendanceManagement;
