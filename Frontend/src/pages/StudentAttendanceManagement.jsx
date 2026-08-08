import React, { useState, useEffect } from 'react';
import { CalendarCheck, Clock, Save, Calendar, BookOpen } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const StudentAttendanceManagement = () => {
  const { showAlert } = useAlert();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [resClasses, resStudents] = await Promise.all([
        api.get('/classes'),
        api.get('/students')
      ]);

      const classList = resClasses.data || [];
      const studentList = resStudents.data || [];

      setClasses(classList);
      setStudents(studentList);

      if (classList.length > 0) {
        setSelectedClassId(classList[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch attendance initial data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Whenever selectedClassId or selectedDate changes, load students & existing attendance for selected date
  useEffect(() => {
    if (!selectedClassId) return;

    const loadClassAttendance = async () => {
      try {
        const resAttendance = await api.get(`/student-attendance?classId=${selectedClassId}&date=${selectedDate}`);
        const existingRecords = resAttendance.data || [];
        const recordMap = {};
        existingRecords.forEach(rec => {
          const sId = rec.studentId?._id || rec.studentId;
          if (sId && !recordMap[sId]) {
            recordMap[sId] = {
              status: rec.status || 'Present',
              session: rec.session || 'Morning',
              arrivalTime: rec.arrivalTime || ''
            };
          }
        });

        // Get students in selected class
        const classStudents = students.filter(s => {
          const cId = s.classId?._id || s.classId;
          return String(cId) === String(selectedClassId);
        });

        const initialMap = {};
        classStudents.forEach(s => {
          if (recordMap[s._id]) {
            initialMap[s._id] = recordMap[s._id];
          } else {
            initialMap[s._id] = {
              status: 'Present',
              session: 'Morning',
              arrivalTime: ''
            };
          }
        });

        setAttendanceData(initialMap);
      } catch (err) {
        console.error('Failed to load class attendance', err);
      }
    };

    loadClassAttendance();
  }, [selectedClassId, selectedDate, students]);

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceData(prev => {
      const prevAtt = prev[studentId] || {};
      const newArrivalTime = newStatus === 'Late' 
        ? (prevAtt.arrivalTime && prevAtt.arrivalTime !== '-' ? prevAtt.arrivalTime : '08:30 AM') 
        : '';
      return {
        ...prev,
        [studentId]: {
          ...prevAtt,
          status: newStatus,
          arrivalTime: newArrivalTime
        }
      };
    });
  };

  const handleSessionChangeForStudent = (studentId, newSession) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        session: newSession
      }
    }));
  };

  const handleArrivalTimeChange = (studentId, timeVal) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        arrivalTime: timeVal
      }
    }));
  };

  const classStudents = students.filter(s => {
    const cId = s.classId?._id || s.classId;
    return String(cId) === String(selectedClassId);
  });

  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      showAlert({ type: 'warning', title: 'Select Class', message: 'Please select a class first.' });
      return;
    }

    if (classStudents.length === 0) {
      showAlert({ type: 'info', title: 'No Students', message: 'No students found in the selected class.' });
      return;
    }

    try {
      setSaving(true);
      const payload = classStudents.map(student => {
        const att = attendanceData[student._id] || { status: 'Present', session: 'Morning', arrivalTime: '' };
        return {
          studentId: student._id,
          classId: selectedClassId,
          date: selectedDate,
          status: att.status,
          session: att.session || 'Morning',
          arrivalTime: att.status === 'Late' ? (att.arrivalTime || '08:30 AM') : ''
        };
      });

      await api.post('/student-attendance', payload);
      const selectedClassName = classes.find(c => String(c._id) === String(selectedClassId))?.name || 'Class';
      showAlert({
        type: 'success',
        title: 'Attendance Saved',
        message: `Attendance for ${selectedClassName} saved for ${formattedDate} (${selectedDate}).`
      });
    } catch (error) {
      console.error('Failed to save attendance', error);
      showAlert({ type: 'danger', title: 'Error', message: error.response?.data?.message || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Student Attendance...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <CalendarCheck size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Student Attendance</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Class Attendance Register</p>
          </div>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || classStudents.length === 0}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} strokeWidth={3} /> {saving ? 'Saving...' : 'Save Class Attendance'}
        </button>
      </div>

      {/* Top Controls: Class Selection & Attendance Date */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Class Selection Dropdown */}
        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
            <BookOpen size={14} className="text-brand-500" /> Select Class *
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-sm"
          >
            {classes.length === 0 && <option value="">No Classes Found</option>}
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Editable Attendance Date Selector */}
        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
            <Calendar size={14} className="text-emerald-500" /> Attendance Date
          </label>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm outline-none cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-500">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Attendance Form Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Student Name</th>
                <th className="px-8 py-5">Attendance Status</th>
                <th className="px-8 py-5">Session</th>
                <th className="px-8 py-5">Arrival Time</th>
                <th className="px-8 py-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.map((student) => {
                const att = attendanceData[student._id] || { status: 'Present', session: 'Morning', arrivalTime: '' };
                const isLate = att.status === 'Late';

                return (
                  <tr key={student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <div>{student.fullName}</div>
                      <div className="text-xs text-slate-400 font-normal font-mono">ID: {student.rollNumber || student.studentCode || '-'}</div>
                    </td>

                    <td className="px-8 py-6">
                      <select
                        value={att.status}
                        onChange={(e) => handleStatusChange(student._id, e.target.value)}
                        className={`px-4 py-2.5 rounded-2xl font-bold text-xs outline-none border transition-all cursor-pointer ${
                          att.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : att.status === 'Late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        <option value="Present">✓ Present</option>
                        <option value="Late">⏰ Late</option>
                        <option value="Absent">✖ Absent</option>
                      </select>
                    </td>

                    <td className="px-8 py-6">
                      <select
                        value={att.session || 'Morning'}
                        onChange={(e) => handleSessionChangeForStudent(student._id, e.target.value)}
                        className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                      >
                        <option value="Morning">Morning</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </td>

                    <td className="px-8 py-6">
                      {isLate ? (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-amber-500 shrink-0" />
                          <input
                            type="text"
                            placeholder="e.g. 08:35 AM"
                            value={att.arrivalTime || ''}
                            onChange={(e) => handleArrivalTimeChange(student._id, e.target.value)}
                            className="w-32 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-800 dark:text-amber-300 font-mono outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 opacity-40">-</span>
                      )}
                    </td>

                    <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                      {selectedDate}
                    </td>
                  </tr>
                );
              })}

              {classStudents.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-400 text-sm font-medium">
                    {selectedClassId ? 'No students registered in this class.' : 'Please select a class above to load students.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceManagement;
