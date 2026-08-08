import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  Award, ClipboardList, Printer, FileDown, Trophy, CheckCircle2,
  XCircle, TrendingUp, Users, X
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const gradeColor = (grade) => {
  if (grade === 'A+' || grade === 'A') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  if (grade === 'B' || grade === 'C') return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
  if (grade === 'D') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  if (grade === 'F') return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

const ExamResults = () => {
  const { showAlert } = useAlert();
  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [data, setData] = useState(null);   // { exam, results, summary }
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState(null);   // report-card modal row

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

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/exams/${selectedId}/results`);
        setData(data);
      } catch (error) {
        showAlert({ type: 'danger', title: 'Error', message: 'Failed to load results.' });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const exam = data?.exam;
  const subjects = exam?.subjects || [];
  const summary = data?.summary;
  // Graded students first (by rank), pending last.
  const rows = (data?.results || []).slice().sort((a, b) => {
    if (a.entered !== b.entered) return a.entered ? -1 : 1;
    return (a.position || 999) - (b.position || 999);
  });

  const handleExportPDF = () => {
    if (!exam) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageW, 24, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(`RESULT SHEET · ${exam.title}`, 12, 11);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`${exam.classId?.name || ''} · ${exam.examType} · ${exam.term || ''} ${exam.academicYear || ''}`, 12, 18);

    let y = 32;
    const x0 = 10;
    const rankW = 12, nameW = 45;
    const subW = Math.min(22, (pageW - 20 - rankW - nameW - 55) / Math.max(1, subjects.length));
    doc.setFillColor(30, 41, 59); doc.rect(x0, y - 5, pageW - 20, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('RANK', x0 + 1, y); doc.text('STUDENT', x0 + rankW, y);
    subjects.forEach((s, i) => doc.text(s.name.slice(0, 8).toUpperCase(), x0 + rankW + nameW + i * subW, y));
    const totX = x0 + rankW + nameW + subjects.length * subW;
    doc.text('TOTAL', totX, y); doc.text('%', totX + 18, y); doc.text('GRD', totX + 28, y); doc.text('RES', totX + 40, y);
    y += 7;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    rows.forEach((r) => {
      if (y > 195) { doc.addPage(); y = 20; }
      doc.setTextColor(100, 116, 139); doc.text(r.entered ? String(r.position) : '-', x0 + 1, y);
      doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.text(r.studentName.slice(0, 26), x0 + rankW, y);
      doc.setFont('helvetica', 'normal');
      r.subjects.forEach((sub, i) => doc.text(sub.isAbsent ? 'AB' : String(sub.marksObtained), x0 + rankW + nameW + i * subW, y));
      doc.setFont('helvetica', 'bold');
      doc.text(`${r.totalObtained}/${r.totalFull}`, totX, y);
      doc.text(r.entered ? `${r.percentage}%` : '-', totX + 18, y);
      doc.text(r.grade, totX + 28, y);
      doc.setTextColor(r.status === 'Pass' ? 22 : r.status === 'Fail' ? 180 : 100, r.status === 'Pass' ? 163 : 83, r.status === 'Pass' ? 74 : 9);
      doc.text(r.status.toUpperCase(), totX + 40, y);
      doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'normal');
      y += 6;
    });

    doc.save(`Result_Sheet_${exam.title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Award size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Exam Results</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Ranked result sheet · grades · report cards</p>
          </div>
        </div>
        {exam && (
          <div className="flex items-center gap-3">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"><FileDown size={16} /> Export PDF</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-600/30 active:scale-95"><Printer size={16} /> Print</button>
          </div>
        )}
      </div>

      {/* Exam selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4 print:hidden">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2"><ClipboardList size={16} /> Select Exam</span>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold">
          <option value="">-- Select an exam --</option>
          {exams.map(e => <option key={e._id} value={e._id}>{e.title} · {e.classId?.name || e.classId?.className || ''} · {e.examType}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 font-bold">Loading results...</div>
      ) : !exam ? (
        <div className="p-10 text-center text-slate-400 font-medium">Select an exam to view results.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Passed</span><CheckCircle2 size={18} className="text-emerald-500" /></div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{summary.passed}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">{summary.passRate}% pass rate</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Failed</span><XCircle size={18} className="text-rose-500" /></div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{summary.failed}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">{summary.pending} not graded</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black uppercase tracking-widest text-brand-600">Class Average</span><TrendingUp size={18} className="text-brand-500" /></div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{summary.avgPercentage}%</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">{summary.graded}/{summary.totalStudents} graded</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Top Student</span><Trophy size={18} className="text-amber-500" /></div>
              <p className="text-lg font-black text-slate-900 dark:text-white truncate">{summary.topper?.studentName || '—'}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">{summary.topper ? `${summary.topper.percentage}%` : 'No marks yet'}</p>
            </div>
          </div>

          {/* Result sheet */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 print:p-0 print:border-0 print:shadow-none">
            <div className="pb-4 border-b-2 border-slate-900 dark:border-slate-700 mb-4">
              <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white">{exam.title}</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{exam.classId?.name || exam.classId?.className} · {exam.examType} · {exam.term} {exam.academicYear} · {new Date(exam.examDate).toLocaleDateString()}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Student</th>
                    {subjects.map(s => <th key={s.name} className="px-3 py-3 text-center">{s.name}<span className="block text-[9px] opacity-60">/{s.fullMarks}</span></th>)}
                    <th className="px-3 py-3 text-center">Total</th>
                    <th className="px-3 py-3 text-center">%</th>
                    <th className="px-3 py-3 text-center">Grade</th>
                    <th className="px-3 py-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map(r => (
                    <tr key={r.studentId} onClick={() => setCard(r)} className="hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm font-black text-slate-400">
                        {r.entered ? (r.position <= 3 ? <span className="inline-flex items-center gap-1 text-amber-500"><Trophy size={13} /> {r.position}</span> : r.position) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{r.studentName}</p>
                        {r.rollNumber && <p className="text-[10px] text-slate-400 font-mono">{r.rollNumber}</p>}
                      </td>
                      {r.subjects.map(sub => (
                        <td key={sub.subject} className="px-3 py-3 text-center text-sm font-semibold">
                          {sub.isAbsent ? <span className="text-rose-500 text-xs font-black">AB</span> : (
                            <span className={sub.passed ? 'text-slate-700 dark:text-slate-200' : 'text-rose-500'}>{r.entered ? sub.marksObtained : '—'}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center text-sm font-black text-slate-900 dark:text-white">{r.entered ? `${r.totalObtained}/${r.totalFull}` : '—'}</td>
                      <td className="px-3 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-200">{r.entered ? `${r.percentage}%` : '—'}</td>
                      <td className="px-3 py-3 text-center"><span className={`px-2.5 py-1 text-[10px] font-black rounded-full ${gradeColor(r.grade)}`}>{r.grade}</span></td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${r.status === 'Pass' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : r.status === 'Fail' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={subjects.length + 6} className="px-6 py-10 text-center text-slate-400 text-sm">No students in this class.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-semibold print:hidden">Tip: click a student row to open their report card.</p>
          </div>
        </>
      )}

      {/* Report card modal */}
      {card && exam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#0B1E3F] via-[#1E7A3C] to-[#B8860B] p-6 text-white relative">
              <button onClick={() => setCard(null)} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30"><X size={18} /></button>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Report Card</p>
              <h2 className="text-2xl font-black">{card.studentName}</h2>
              <p className="text-xs font-semibold opacity-90">{exam.title} · {exam.classId?.name || exam.classId?.className} · {exam.term} {exam.academicYear}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">Rank</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{card.entered ? card.position : '—'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">Percentage</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{card.percentage}%</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">Grade</p>
                  <p className={`text-2xl font-black ${card.grade === 'F' ? 'text-rose-500' : 'text-emerald-600'}`}>{card.grade}</p>
                </div>
              </div>
              <table className="w-full text-left">
                <thead><tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800"><th className="py-2">Subject</th><th className="py-2 text-center">Marks</th><th className="py-2 text-center">Result</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {card.subjects.map(s => (
                    <tr key={s.subject}>
                      <td className="py-2 text-sm font-bold text-slate-700 dark:text-slate-200">{s.subject}</td>
                      <td className="py-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">{s.isAbsent ? 'Absent' : `${s.marksObtained} / ${s.fullMarks}`}</td>
                      <td className="py-2 text-center">{s.isAbsent ? <span className="text-rose-500 text-xs font-black">AB</span> : <span className={`text-xs font-black ${s.passed ? 'text-emerald-600' : 'text-rose-500'}`}>{s.passed ? 'PASS' : 'FAIL'}</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                    <td className="py-2 uppercase text-xs">Total</td>
                    <td className="py-2 text-center text-sm">{card.totalObtained} / {card.totalFull}</td>
                    <td className="py-2 text-center"><span className={`text-xs font-black uppercase ${card.status === 'Pass' ? 'text-emerald-600' : card.status === 'Fail' ? 'text-rose-500' : 'text-slate-400'}`}>{card.status}</span></td>
                  </tr>
                </tfoot>
              </table>
              {card.remarks && <p className="text-xs text-slate-500"><span className="font-black uppercase">Remarks:</span> {card.remarks}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResults;
