import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  ArrowRight, 
  History, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  Calendar, 
  MessageSquare,
  Sparkle,
  X,
  Clock,
  UserCheck
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const ClassPromotion = () => {
  const { showAlert, showConfirm } = useAlert();

  // State
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [promotionLogs, setPromotionLogs] = useState([]);
  
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [remarks, setRemarks] = useState('');
  
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('promote'); // promote | history
  
  // Single Student History Modal
  const [historyModalStudent, setHistoryModalStudent] = useState(null);
  const [studentHistoryList, setStudentHistoryList] = useState([]);
  const [loadingHistoryModal, setLoadingHistoryModal] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [resClasses, resStudents, resHistory] = await Promise.all([
        api.get('/classes'),
        api.get('/students'),
        api.get('/promotions/history')
      ]);
      setClasses(resClasses.data || []);
      setStudents(resStudents.data || []);
      setPromotionLogs(resHistory.data || []);
    } catch (error) {
      console.error('Failed to load class promotion initial data', error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to load initial page data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filter students belonging to the selected 'From Class' and status 'Active'
  const activeClassStudents = useMemo(() => {
    if (!fromClassId) return [];
    return students.filter(s => {
      const cId = s.classId?._id || s.classId;
      return String(cId) === String(fromClassId) && s.status === 'Active';
    });
  }, [fromClassId, students]);

  // Set all students checked by default whenever class changes
  useEffect(() => {
    if (activeClassStudents.length > 0) {
      setSelectedStudentIds(new Set(activeClassStudents.map(s => s._id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  }, [fromClassId, students]);

  // Handle master checkbox toggle
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === activeClassStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(activeClassStudents.map(s => s._id)));
    }
  };

  // Toggle single student select
  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Perform promotion operation
  const handlePromote = async () => {
    if (!fromClassId || !toClassId) {
      showAlert({ type: 'warning', title: 'Classes Required', message: 'Please select both current and next classes.' });
      return;
    }

    if (String(fromClassId) === String(toClassId)) {
      showAlert({ type: 'warning', title: 'Invalid Promotion', message: 'Current class and next class cannot be the same.' });
      return;
    }

    if (selectedStudentIds.size === 0) {
      showAlert({ type: 'warning', title: 'No Students Selected', message: 'Please check at least one student to promote.' });
      return;
    }

    if (!academicYear.trim()) {
      showAlert({ type: 'warning', title: 'Academic Year Required', message: 'Please enter the target Academic Year.' });
      return;
    }

    const fromClassName = classes.find(c => String(c._id) === String(fromClassId))?.name || 'Current Class';
    const toClassName = classes.find(c => String(c._id) === String(toClassId))?.name || 'Next Class';

    const confirmed = await showConfirm({
      type: 'warning',
      title: 'Confirm Class Promotion?',
      message: `You are about to promote ${selectedStudentIds.size} student(s) from "${fromClassName}" to "${toClassName}". Proceed?`,
      confirmText: 'Promote Now',
      cancelText: 'Cancel',
      danger: false
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      await api.post('/promotions', {
        studentIds: Array.from(selectedStudentIds),
        previousClassId: fromClassId,
        newClassId: toClassId,
        academicYear,
        remarks
      });

      showAlert({
        type: 'success',
        title: 'Promotion Complete',
        message: `Successfully promoted selected students to "${toClassName}".`
      });

      // Reset states
      setRemarks('');
      await fetchInitialData();
    } catch (error) {
      console.error('Promotion failed', error);
      showAlert({
        type: 'danger',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to complete promotion.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open single student's complete class history modal
  const openClassHistoryModal = async (student) => {
    try {
      setHistoryModalStudent(student);
      setLoadingHistoryModal(true);
      setStudentHistoryList([]);
      
      const { data } = await api.get(`/promotions/student/${student._id}`);
      setStudentHistoryList(data.history || []);
    } catch (error) {
      console.error('Failed to load student history list', error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to retrieve student promotion history.' });
    } finally {
      setLoadingHistoryModal(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Promotion Hub...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <UserCheck size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Class Promotion</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Academic Year Transition Panel</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-[20px] border border-slate-200/40 dark:border-slate-700/60 max-w-sm">
          <button
            onClick={() => setActiveTab('promote')}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'promote'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Promote Students
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Promotion History
          </button>
        </div>
      </div>

      {activeTab === 'promote' ? (
        <>
          {/* Top Panel Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* From Class Dropdown */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
                <BookOpen size={14} className="text-brand-500" /> Current Class (From) *
              </label>
              <select
                value={fromClassId}
                onChange={(e) => setFromClassId(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-sm"
              >
                <option value="">Select current class...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* To Class Dropdown */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
                <ArrowRight size={14} className="text-emerald-500" /> Target Class (To) *
              </label>
              <select
                value={toClassId}
                onChange={(e) => setToClassId(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-sm"
              >
                <option value="">Select target class...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
                <Calendar size={14} className="text-sky-500" /> Academic Year *
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2026-2027"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-sm"
              />
            </div>

            {/* Action button */}
            <button
              onClick={handlePromote}
              disabled={submitting || activeClassStudents.length === 0}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> {submitting ? 'Promoting...' : 'Promote Selected'}
            </button>
          </div>

          {/* Remarks block */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">Remarks / Notes</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add optional notes about this promotion (e.g. End of year graduation, mid-term transfer)..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* Active Students Checklist Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5 w-20">
                      <input
                        type="checkbox"
                        checked={activeClassStudents.length > 0 && selectedStudentIds.size === activeClassStudents.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-350 dark:border-slate-700 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5"
                      />
                    </th>
                    <th className="px-8 py-5">Student Code</th>
                    <th className="px-8 py-5">Student Name</th>
                    <th className="px-8 py-5">Current Class</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right font-black">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeClassStudents.map((student) => {
                    const isChecked = selectedStudentIds.has(student._id);
                    return (
                      <tr key={student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-8 py-6">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectStudent(student._id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5"
                          />
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {student.studentCode || student.rollNumber || '-'}
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-800 dark:text-slate-200">
                          {student.fullName}
                        </td>
                        <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {classes.find(c => String(c._id) === String(student.classId?._id || student.classId))?.name || '-'}
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-2.5 py-1 text-[10px] uppercase font-black tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            {student.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            type="button"
                            onClick={() => openClassHistoryModal(student)}
                            className="text-xs font-black text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 uppercase tracking-widest border border-brand-200/50 hover:border-brand-400 dark:border-slate-750 dark:hover:border-brand-600 px-3 py-1.5 rounded-xl transition-all"
                          >
                            View Timeline
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {activeClassStudents.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-8 py-12 text-center text-slate-450 text-sm font-semibold">
                        {fromClassId ? 'No active students found in this class.' : 'Please select a current class above to load active students.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* PROMOTION LOGS HISTORY TAB */
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Student</th>
                  <th className="px-8 py-5">Previous Class</th>
                  <th className="px-8 py-5">New Class</th>
                  <th className="px-8 py-5">Academic Year</th>
                  <th className="px-8 py-5">Remarks</th>
                  <th className="px-8 py-5">Promoted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {promotionLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(log.promotionDate).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <div>{log.studentId?.fullName || 'Unknown Student'}</div>
                      <div className="text-xs text-slate-400 font-mono">Code: {log.studentId?.studentCode || log.studentId?.rollNumber || '-'}</div>
                    </td>
                    <td className="px-8 py-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {log.previousClassId?.name || 'Deleted Class'}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {log.newClassId?.name || 'Deleted Class'}
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                      {log.academicYear}
                    </td>
                    <td className="px-8 py-6 text-xs font-semibold text-slate-650 dark:text-slate-400 max-w-[200px] truncate" title={log.remarks}>
                      {log.remarks || '-'}
                    </td>
                    <td className="px-8 py-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {log.promotedBy?.fullName || 'System Admin'}
                    </td>
                  </tr>
                ))}
                {promotionLogs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-8 py-12 text-center text-slate-400 text-sm font-semibold">
                      No promotion history logged in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Timeline Class History Modal */}
      {historyModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Academic class history</h2>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-semibold">
                  Chronological learning promotion timeline for <strong className="text-slate-800 dark:text-slate-200">{historyModalStudent.fullName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setHistoryModalStudent(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-50 dark:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Timeline Area */}
            {loadingHistoryModal ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">Loading timeline logs...</div>
            ) : (
              <div className="space-y-6 max-h-80 overflow-y-auto pr-2 relative">
                {studentHistoryList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="font-bold text-sm">No recorded promotion path.</p>
                    <p className="text-xs mt-1">Student has remained in their current class since registration.</p>
                    <div className="mt-6 flex justify-center">
                      <span className="px-4 py-2 bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 rounded-2xl text-xs font-black text-brand-700 dark:text-brand-400 uppercase tracking-widest">
                        {classes.find(c => String(c._id) === String(historyModalStudent.classId?._id || historyModalStudent.classId))?.name || 'Class'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-8 ml-2">
                    
                    {/* Beginning Initial State */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 bg-slate-300 dark:bg-slate-700 rounded-full ring-4 ring-white dark:ring-slate-900" />
                      <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Starting Class</div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {studentHistoryList[0].previousClassId?.name}
                      </div>
                    </div>

                    {/* Promotion Chain Items */}
                    {studentHistoryList.map((log, index) => (
                      <div key={log._id} className="relative animate-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Bullet Icon */}
                        <div className="absolute -left-[33px] top-0.5 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center text-white ring-4 ring-white dark:ring-slate-900 shadow-md">
                          <CheckCircle2 size={12} />
                        </div>
                        
                        {/* Details */}
                        <div className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-2">
                          Promoted to next class <ChevronRight size={10} /> {log.academicYear}
                        </div>
                        <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                          {log.newClassId?.name}
                        </div>
                        <div className="text-xs text-slate-450 dark:text-slate-450 mt-1 font-semibold">
                          Date: {new Date(log.promotionDate).toLocaleDateString()} by {log.promotedBy?.fullName || 'Staff'}
                        </div>
                        {log.remarks && (
                          <div className="text-[11px] italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 mt-2 text-slate-500">
                            "{log.remarks}"
                          </div>
                        )}
                      </div>
                    ))}

                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button
                onClick={() => setHistoryModalStudent(null)}
                className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ClassPromotion;
