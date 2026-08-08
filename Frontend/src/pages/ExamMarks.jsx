import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PenSquare, Save, Loader2, ClipboardList, Users } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const ExamMarks = () => {
  const { showAlert } = useAlert();
  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [exam, setExam] = useState(null);
  const [rows, setRows] = useState([]);          // editable grid state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the exam list and preselect from ?exam= in the URL.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/exams');
        setExams(data || []);
        const param = new URLSearchParams(location.search).get('exam');
        if (param) setSelectedId(param);
        else if (data?.length) setSelectedId(data[0]._id);
      } catch (error) {
        showAlert({ type: 'danger', title: 'Error', message: 'Failed to load exams.' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the selected exam's students + existing marks.
  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/exams/${selectedId}/results`);
        setExam(data.exam);
        setRows((data.results || []).map(r => ({
          studentId: r.studentId,
          studentName: r.studentName,
          rollNumber: r.rollNumber,
          remarks: r.remarks || '',
          entered: r.entered,
          absent: r.subjects.length > 0 && r.subjects.every(s => s.isAbsent) && r.entered,
          marks: Object.fromEntries(r.subjects.map(s => [s.subject, r.entered ? String(s.marksObtained) : '']))
        })));
      } catch (error) {
        showAlert({ type: 'danger', title: 'Error', message: 'Failed to load exam data.' });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const subjects = exam?.subjects || [];

  const setMark = (studentId, subject, value) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, marks: { ...r.marks, [subject]: value } } : r));
  };
  const setRemark = (studentId, value) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, remarks: value } : r));
  };
  const toggleAbsent = (studentId) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, absent: !r.absent } : r));
  };

  const rowTotal = (r) => r.absent ? 0 : subjects.reduce((sum, s) => sum + (Number(r.marks[s.name]) || 0), 0);
  const totalFull = useMemo(() => subjects.reduce((sum, s) => sum + Number(s.fullMarks || 0), 0), [subjects]);

  const hasInput = (r) => r.entered || r.absent || r.remarks.trim() || subjects.some(s => String(r.marks[s.name] ?? '').trim() !== '');

  const handleSave = async () => {
    // Validate marks are within range.
    for (const r of rows) {
      if (r.absent) continue;
      for (const s of subjects) {
        const v = Number(r.marks[s.name]);
        if (String(r.marks[s.name] ?? '').trim() !== '' && (v < 0 || v > Number(s.fullMarks))) {
          return showAlert({ type: 'warning', title: 'Invalid marks', message: `${r.studentName}: ${s.name} must be between 0 and ${s.fullMarks}.` });
        }
      }
    }

    const payloadRows = rows.filter(hasInput).map(r => ({
      studentId: r.studentId,
      remarks: r.remarks,
      marks: subjects.map(s => ({
        subject: s.name,
        marksObtained: r.absent ? 0 : (Number(r.marks[s.name]) || 0),
        isAbsent: r.absent
      }))
    }));

    if (!payloadRows.length) return showAlert({ type: 'warning', title: 'Nothing to save', message: 'Enter marks for at least one student.' });

    try {
      setSaving(true);
      const { data } = await api.post(`/exams/${selectedId}/results`, { results: payloadRows });
      showAlert({ type: 'success', title: 'Saved', message: data.message || 'Marks saved.' });
      // Refresh to reflect entered state.
      const { data: fresh } = await api.get(`/exams/${selectedId}/results`);
      setRows((fresh.results || []).map(r => ({
        studentId: r.studentId, studentName: r.studentName, rollNumber: r.rollNumber,
        remarks: r.remarks || '', entered: r.entered,
        absent: r.subjects.length > 0 && r.subjects.every(s => s.isAbsent) && r.entered,
        marks: Object.fromEntries(r.subjects.map(s => [s.subject, r.entered ? String(s.marksObtained) : '']))
      })));
    } catch (error) {
      showAlert({ type: 'danger', title: 'Error', message: error.response?.data?.message || 'Failed to save marks.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
            <PenSquare size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mark Entry</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Enter each student's marks per subject</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !exam || !rows.length} className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-600/30 active:scale-95 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Marks
        </button>
      </div>

      {/* Exam selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2"><ClipboardList size={16} /> Select Exam</span>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold">
          <option value="">-- Select an exam --</option>
          {exams.map(e => <option key={e._id} value={e._id}>{e.title} · {e.classId?.name || e.classId?.className || ''} · {e.examType}</option>)}
        </select>
        {exam && (
          <span className="text-xs font-bold text-slate-500 flex items-center gap-2"><Users size={16} /> {rows.length} students · Total {totalFull} marks</span>
        )}
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 font-bold">Loading students...</div>
      ) : !exam ? (
        <div className="p-10 text-center text-slate-400 font-medium">Select an exam to enter marks.</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 font-medium">No students in this exam's class yet.</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800/30">#</th>
                  <th className="px-4 py-4">Student</th>
                  {subjects.map(s => (
                    <th key={s.name} className="px-3 py-4 text-center">{s.name}<span className="block text-[9px] text-slate-400 font-bold">/{s.fullMarks} · pass {s.passMarks}</span></th>
                  ))}
                  <th className="px-3 py-4 text-center">Total</th>
                  <th className="px-3 py-4 text-center">Absent</th>
                  <th className="px-4 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => (
                  <tr key={r.studentId} className={`transition-colors ${r.absent ? 'opacity-50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10'}`}>
                    <td className="px-4 py-3 text-xs font-bold text-slate-400 sticky left-0 bg-white dark:bg-slate-900">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{r.studentName}</p>
                      {r.rollNumber && <p className="text-[10px] text-slate-400 font-mono">{r.rollNumber}</p>}
                    </td>
                    {subjects.map(s => (
                      <td key={s.name} className="px-2 py-3 text-center">
                        <input
                          type="number" min="0" max={s.fullMarks}
                          disabled={r.absent}
                          value={r.marks[s.name] ?? ''}
                          onChange={e => setMark(r.studentId, s.name, e.target.value)}
                          className="w-16 px-2 py-2 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 disabled:opacity-40"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center text-sm font-black text-brand-600 dark:text-brand-400">{rowTotal(r)}</td>
                    <td className="px-3 py-3 text-center">
                      <input type="checkbox" checked={r.absent} onChange={() => toggleAbsent(r.studentId)} className="w-4 h-4 accent-rose-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={r.remarks} onChange={e => setRemark(r.studentId, e.target.value)} placeholder="—" className="w-40 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs text-slate-700 dark:text-slate-200" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamMarks;
