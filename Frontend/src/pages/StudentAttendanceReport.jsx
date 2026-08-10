import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  User, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Filter, 
  History, 
  ArrowRight,
  ShieldAlert,
  Download,
  BookOpen,
  Users,
  Briefcase,
  Layers,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';
import KPICard from './KPICard';
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar, 
  Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';

const StudentAttendanceReport = () => {
  const { showAlert } = useAlert();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('class'); // class (Attendance Ledger)

  // Core Data States
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Dashboard Filters & Data
  const [dashDateFilter, setDashDateFilter] = useState('This Month'); // Today | This Week | This Month | Custom
  const [dashStartDate, setDashStartDate] = useState('');
  const [dashEndDate, setDashEndDate] = useState('');

  // 2. Daily Report State
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStatusFilter, setDailyStatusFilter] = useState('All'); // All | Present | Late | Absent
  const [dailySearchQuery, setDailySearchQuery] = useState('');

  // 3. Class Report State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLedgerStudentId, setSelectedLedgerStudentId] = useState('all');

  // 4. Individual Student Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resClasses, resStudents, resAttendance] = await Promise.all([
        api.get('/classes'),
        api.get('/students'),
        api.get('/student-attendance') // loads all to process locally for dashboard/stats
      ]);
      setClasses(resClasses.data || []);
      setStudents(resStudents.data || []);
      setAllAttendance(resAttendance.data || []);
      
      if (resClasses.data?.length > 0) {
        setSelectedClassId(resClasses.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to load reports data', error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to load report datasets.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [savingStudentId, setSavingStudentId] = useState(null);

  // Sync / refresh attendance records dynamically when operations happen
  const refreshAttendance = async () => {
    try {
      const { data } = await api.get('/student-attendance');
      setAllAttendance(data || []);
    } catch (err) {
      console.error('Failed to refresh attendance logs', err);
    }
  };

  // Quick update status directly from the Daily Report list
  const handleQuickStatusChange = async (student, newStatus, currentArrivalTime = '') => {
    try {
      setSavingStudentId(student._id);
      const classId = student.classId?._id || student.classId || (classes[0]?._id);
      if (!classId) {
        showAlert({ type: 'warning', title: 'Class Missing', message: 'Student is not assigned to a class.' });
        return;
      }

      const arrivalTime = newStatus === 'Late' ? (currentArrivalTime && currentArrivalTime !== '-' ? currentArrivalTime : '08:30') : '';

      const payload = {
        studentId: student._id,
        classId,
        date: dailyDate,
        status: newStatus,
        session: 'Morning',
        arrivalTime
      };

      await api.post('/student-attendance', payload);
      await refreshAttendance();
      showAlert({
        type: 'success',
        title: 'Status Saved to Database',
        message: `${student.fullName} marked as ${newStatus} for ${dailyDate}.`
      });
    } catch (err) {
      console.error('Failed to save status', err);
      showAlert({
        type: 'danger',
        title: 'Update Error',
        message: err.response?.data?.message || 'Could not record attendance change in database.'
      });
    } finally {
      setSavingStudentId(null);
    }
  };

  // Quick update arrival time for Late status
  const handleArrivalTimeChange = async (student, currentStatus, newArrivalTime) => {
    try {
      setSavingStudentId(student._id);
      const classId = student.classId?._id || student.classId || (classes[0]?._id);
      const payload = {
        studentId: student._id,
        classId,
        date: dailyDate,
        status: currentStatus === 'Unmarked' ? 'Late' : currentStatus,
        session: 'Morning',
        arrivalTime: newArrivalTime
      };
      await api.post('/student-attendance', payload);
      await refreshAttendance();
    } catch (err) {
      console.error('Failed to update arrival time', err);
    } finally {
      setSavingStudentId(null);
    }
  };

  // Update historical record from Student Profile history table
  const handleHistoryStatusUpdate = async (recId, newStatus, newArrivalTime) => {
    try {
      await api.put(`/student-attendance/${recId}`, {
        status: newStatus,
        arrivalTime: newStatus === 'Late' ? (newArrivalTime || '08:30') : ''
      });
      await refreshAttendance();
      showAlert({
        type: 'success',
        title: 'Record Updated',
        message: 'Attendance record updated successfully in database.'
      });
    } catch (err) {
      console.error('Failed to update historical record', err);
      showAlert({ type: 'danger', title: 'Update Error', message: 'Failed to save historical update.' });
    }
  };

  // Helper: Date range resolver
  const resolveDateRange = (filterType, customStart, customEnd) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (filterType === 'Today') {
      start = end;
    } else if (filterType === 'This Week') {
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
      const monday = new Date(today.setDate(today.getDate() + distanceToMonday));
      start = monday.toISOString().split('T')[0];
    } else if (filterType === 'This Month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else if (filterType === 'Custom') {
      start = customStart;
      end = customEnd;
    }

    return { start, end };
  };

  // ==========================================
  // 1. DASHBOARD CALCULATIONS
  // ==========================================
  const dashboardStats = useMemo(() => {
    const { start, end } = resolveDateRange(dashDateFilter, dashStartDate, dashEndDate);
    
    // Filter records falling in the range
    const filteredRecs = allAttendance.filter(rec => {
      if (!rec.date) return false;
      if (start && rec.date < start) return false;
      if (end && rec.date > end) return false;
      return true;
    });

    const stats = {
      totalStudents: students.length,
      present: 0,
      late: 0,
      absent: 0,
      percentage: 100
    };

    filteredRecs.forEach(r => {
      if (r.status === 'Present') stats.present++;
      else if (r.status === 'Late') stats.late++;
      else if (r.status === 'Absent') stats.absent++;
    });

    const totalMarked = stats.present + stats.late + stats.absent;
    if (totalMarked > 0) {
      stats.percentage = Math.round((stats.present / totalMarked) * 100);
    }

    return { stats, filteredRecs };
  }, [allAttendance, students, dashDateFilter, dashStartDate, dashEndDate]);

  // Dashboard Chart Trend Data (grouped by date)
  const dashboardChartData = useMemo(() => {
    const dateMap = {};
    
    dashboardStats.filteredRecs.forEach(r => {
      if (!r.date) return;
      if (!dateMap[r.date]) {
        dateMap[r.date] = { date: r.date, Present: 0, Late: 0, Absent: 0 };
      }
      if (r.status === 'Present') dateMap[r.date].Present++;
      else if (r.status === 'Late') dateMap[r.date].Late++;
      else if (r.status === 'Absent') dateMap[r.date].Absent++;
    });

    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // show last 10 days for cleaner chart presentation
  }, [dashboardStats]);

  // ==========================================
  // 2. DAILY REPORT CALCULATIONS
  // ==========================================
  const dailyReportData = useMemo(() => {
    // Get all students
    return students.map(student => {
      // Find latest attendance for this student on the selected dailyDate
      const records = allAttendance.filter(r => {
        const sId = r.studentId?._id || r.studentId;
        return String(sId) === String(student._id) && r.date === dailyDate;
      });

      // Sort newest first to fetch latest recorded status
      const latestRecord = records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      return {
        student,
        record: latestRecord || null,
        status: latestRecord?.status || 'Unmarked',
        session: latestRecord?.session || '-',
        arrivalTime: latestRecord?.arrivalTime || '-'
      };
    }).filter(item => {
      // Search text filter
      const matchesSearch = 
        item.student.fullName.toLowerCase().includes(dailySearchQuery.toLowerCase()) ||
        (item.student.studentCode || '').toLowerCase().includes(dailySearchQuery.toLowerCase());

      // Status dropdown filter
      const matchesStatus = 
        dailyStatusFilter === 'All' || 
        item.status === dailyStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, allAttendance, dailyDate, dailyStatusFilter, dailySearchQuery]);

  // ==========================================
  // 3. CLASS REPORT CALCULATIONS
  // ==========================================
  // Keep the ledger student selector scoped to the academic class currently
  // selected above it.
  const ledgerStudents = useMemo(() => {
    if (!selectedClassId) return [];

    return students.filter(student => {
      const classId = student.classId?._id || student.classId;
      return String(classId) === String(selectedClassId);
    });
  }, [students, selectedClassId]);

  const classReportData = useMemo(() => {
    if (!selectedClassId) return { studentsList: [], stats: { present: 0, late: 0, absent: 0, percentage: 100 } };

    // Get students in this class
    const classStudents = students.filter(s => {
      const cId = s.classId?._id || s.classId;
      return String(cId) === String(selectedClassId);
    }).filter(s => selectedLedgerStudentId === 'all' || String(s._id) === String(selectedLedgerStudentId));

    const stats = { present: 0, late: 0, absent: 0, percentage: 100 };

    const studentsList = classStudents.map(student => {
      const studentRecs = allAttendance.filter(r => {
        const sId = r.studentId?._id || r.studentId;
        return String(sId) === String(student._id);
      });

      const counts = { present: 0, late: 0, absent: 0 };
      studentRecs.forEach(r => {
        if (r.status === 'Present') { counts.present++; stats.present++; }
        else if (r.status === 'Late') { counts.late++; stats.late++; }
        else if (r.status === 'Absent') { counts.absent++; stats.absent++; }
      });

      const total = counts.present + counts.late + counts.absent;
      // Late and absent records both affect performance. The rate is the
      // percentage of all marked days that were recorded as Present.
      const rate = total > 0 ? Math.round((counts.present / total) * 100) : 0;

      return {
        student,
        counts,
        percentage: rate
      };
    });

    const grandTotal = stats.present + stats.late + stats.absent;
    if (grandTotal > 0) {
      stats.percentage = Math.round((stats.present / grandTotal) * 100);
    }

    return { studentsList, stats };
  }, [selectedClassId, selectedLedgerStudentId, students, allAttendance]);

  // ==========================================
  // 4. INDIVIDUAL REPORT CALCULATIONS
  // ==========================================
  const individualSuggestions = useMemo(() => {
    if (!studentSearchQuery.trim()) return [];
    return students.filter(s => 
      s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.studentCode || '').toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.fatherPhone || '').includes(studentSearchQuery)
    );
  }, [students, studentSearchQuery]);

  const studentReportData = useMemo(() => {
    if (!selectedStudent) return null;

    const history = allAttendance.filter(r => {
      const sId = r.studentId?._id || r.studentId;
      return String(sId) === String(selectedStudent._id);
    }).sort((a, b) => b.date.localeCompare(a.date));

    const stats = { present: 0, late: 0, absent: 0, total: 0, percentage: 100 };
    history.forEach(r => {
      stats.total++;
      if (r.status === 'Present') stats.present++;
      else if (r.status === 'Late') stats.late++;
      else if (r.status === 'Absent') stats.absent++;
    });

    if (stats.total > 0) {
      stats.percentage = Math.round((stats.present / stats.total) * 100);
    }

    // Warnings Logic
    const isLateWarning = stats.late >= 3;
    const isAbsentWarning = stats.absent >= 3;
    const hasWarnings = isLateWarning || isAbsentWarning;

    let warningText = '';
    if (isLateWarning && isAbsentWarning) {
      warningText = `marked Late ${stats.late} times and Absent ${stats.absent} times.`;
    } else if (isLateWarning) {
      warningText = `marked Late ${stats.late} times.`;
    } else if (isAbsentWarning) {
      warningText = `marked Absent ${stats.absent} times.`;
    }

    const parentName = selectedStudent.guardianId?.fullName || selectedStudent.fatherName || 'Parent';
    const parentPhone = selectedStudent.guardianId?.phone || selectedStudent.fatherPhone || '';
    const message = `Hello ${parentName}, this is an official notification that your child ${selectedStudent.fullName} has reached high attendance concerns: ${warningText} Please coordinate with the management.`;
    const waUrl = parentPhone ? `https://wa.me/${parentPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}` : '';

    return {
      history,
      stats,
      warnings: {
        hasWarnings,
        warningText,
        waUrl,
        parentPhone,
        parentName
      }
    };
  }, [selectedStudent, allAttendance]);

  // ==========================================
  // REPORT EXPORTS (PDF & CSV)
  // ==========================================
  
  // CSV Export utility
  const handleExportCSV = (headers, rows, filename) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert({ type: 'success', title: 'Export Complete', message: `CSV exported successfully as ${filename}` });
  };

  // 1. Export Daily CSV
  const exportDailyCSV = () => {
    const headers = ['Student Name', 'Student Code', 'Class', 'Session', 'Status', 'Arrival Time', 'Guardian Name', 'Phone'];
    const rows = dailyReportData.map(item => [
      item.student.fullName,
      item.student.studentCode || item.student.rollNumber || '-',
      classes.find(c => String(c._id) === String(item.student.classId?._id || item.student.classId))?.name || '-',
      item.session,
      item.status,
      item.arrivalTime,
      item.student.guardianId?.fullName || item.student.fatherName || '-',
      item.student.guardianId?.phone || item.student.fatherPhone || '-'
    ]);
    handleExportCSV(headers, rows, `Daily_Attendance_${dailyDate}.csv`);
  };

  // 2. Export Class CSV
  const exportClassCSV = () => {
    const className = classes.find(c => String(c._id) === String(selectedClassId))?.name || 'Class';
    const headers = ['Student Name', 'Student Code', 'Total Present', 'Total Late', 'Total Absent', 'Attendance Rate'];
    const rows = classReportData.studentsList.map(item => [
      item.student.fullName,
      item.student.studentCode || item.student.rollNumber || '-',
      item.counts.present,
      item.counts.late,
      item.counts.absent,
      `${item.percentage}%`
    ]);
    handleExportCSV(headers, rows, `Class_Attendance_${className.replace(/\s+/g, '_')}.csv`);
  };

  // 3. Export Student CSV
  const exportStudentCSV = () => {
    if (!selectedStudent || !studentReportData) return;
    const headers = ['Date', 'Class', 'Session', 'Status', 'Arrival Time', 'Recorded By'];
    const rows = studentReportData.history.map(rec => [
      rec.date,
      rec.classId?.name || '-',
      rec.session || 'Morning',
      rec.status,
      rec.arrivalTime || '-',
      rec.markedBy?.fullName || 'System Admin'
    ]);
    handleExportCSV(headers, rows, `Student_Attendance_${selectedStudent.fullName.replace(/\s+/g, '_')}.csv`);
  };

  // 1. Export Daily PDF
  const exportDailyPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('DAILY ATTENDANCE REPORT', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${dailyDate}`, 14, 26);
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 31);
    
    doc.line(14, 35, 196, 35);
    
    let y = 45;
    doc.setFont('helvetica', 'bold');
    doc.text('Student Name', 14, y);
    doc.text('Code', 70, y);
    doc.text('Session', 100, y);
    doc.text('Status', 130, y);
    doc.text('Arrival Time', 160, y);
    
    doc.line(14, y + 3, 196, y + 3);
    doc.setFont('helvetica', 'normal');
    
    y += 10;
    dailyReportData.forEach(item => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.student.fullName, 14, y);
      doc.text(item.student.studentCode || item.student.rollNumber || '-', 70, y);
      doc.text(item.session, 100, y);
      doc.text(item.status, 130, y);
      doc.text(item.arrivalTime || '-', 160, y);
      y += 8;
    });

    doc.save(`Daily_Attendance_${dailyDate}.pdf`);
  };

  // 2. Export Class PDF
  const exportClassPDF = () => {
    const doc = new jsPDF();
    const className = classes.find(c => String(c._id) === String(selectedClassId))?.name || 'Class';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`CLASS ATTENDANCE REPORT: ${className.toUpperCase()}`, 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Present: ${classReportData.stats.present} | Total Late: ${classReportData.stats.late} | Total Absent: ${classReportData.stats.absent}`, 14, 26);
    doc.text(`Overall Attendance Rate: ${classReportData.stats.percentage}%`, 14, 31);
    
    doc.line(14, 35, 196, 35);
    
    let y = 45;
    doc.setFont('helvetica', 'bold');
    doc.text('Student Name', 14, y);
    doc.text('Code', 70, y);
    doc.text('Present', 100, y);
    doc.text('Late', 125, y);
    doc.text('Absent', 150, y);
    doc.text('Rate', 175, y);
    
    doc.line(14, y + 3, 196, y + 3);
    doc.setFont('helvetica', 'normal');
    
    y += 10;
    classReportData.studentsList.forEach(item => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.student.fullName, 14, y);
      doc.text(item.student.studentCode || item.student.rollNumber || '-', 70, y);
      doc.text(String(item.counts.present), 100, y);
      doc.text(String(item.counts.late), 125, y);
      doc.text(String(item.counts.absent), 150, y);
      doc.text(`${item.percentage}%`, 175, y);
      y += 8;
    });

    doc.save(`Class_Attendance_${className.replace(/\s+/g, '_')}.pdf`);
  };

  // 3. Export Student PDF
  const exportStudentPDF = () => {
    if (!selectedStudent || !studentReportData) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`STUDENT ATTENDANCE DOSSIER`, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${selectedStudent.fullName}`, 14, 28);
    doc.text(`Code: ${selectedStudent.studentCode || selectedStudent.rollNumber || '-'}`, 14, 34);
    doc.text(`Class: ${classes.find(c => String(c._id) === String(selectedStudent.classId?._id || selectedStudent.classId))?.name || '-'}`, 14, 40);
    
    doc.text(`Total Days: ${studentReportData.stats.total}`, 120, 28);
    doc.text(`Present: ${studentReportData.stats.present} | Late: ${studentReportData.stats.late} | Absent: ${studentReportData.stats.absent}`, 120, 34);
    doc.text(`Attendance Rate: ${studentReportData.stats.percentage}%`, 120, 40);

    doc.line(14, 45, 196, 45);
    
    let y = 55;
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 14, y);
    doc.text('Class Name', 50, y);
    doc.text('Session', 100, y);
    doc.text('Status', 130, y);
    doc.text('Arrival Time', 160, y);
    
    doc.line(14, y + 3, 196, y + 3);
    doc.setFont('helvetica', 'normal');
    
    y += 10;
    studentReportData.history.forEach(rec => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(rec.date, 14, y);
      doc.text(rec.classId?.name || '-', 50, y);
      doc.text(rec.session || 'Morning', 100, y);
      doc.text(rec.status, 130, y);
      doc.text(rec.arrivalTime || '-', 160, y);
      y += 8;
    });

    doc.save(`Student_Attendance_${selectedStudent.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Attendance System Datasets...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <History size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Attendance Ledger</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Reports & Diagnostics Hub</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-[20px] border border-slate-200/40 dark:border-slate-700/60 gap-1">
          {[
            { id: 'class', label: 'Attendance Ledger' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                refreshAttendance();
              }}
              className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. OVERVIEW DASHBOARD TAB */}
      {/* ========================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Dashboard Controls: Date Range */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
              <Filter size={14} className="text-brand-500" /> Reporting Cycle Range
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {['Today', 'This Week', 'This Month', 'Custom'].map(f => (
                <button
                  key={f}
                  onClick={() => setDashDateFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    dashDateFilter === f
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {dashDateFilter === 'Custom' && (
              <div className="flex gap-4 items-center">
                <input
                  type="date"
                  value={dashStartDate}
                  onChange={(e) => setDashStartDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                />
                <span className="text-slate-400 font-bold text-xs">to</span>
                <input
                  type="date"
                  value={dashEndDate}
                  onChange={(e) => setDashEndDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* KPICards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <KPICard label="Total Students" value={dashboardStats.stats.totalStudents} icon={<Users size={20} />} color="bg-brand-600" trend={0} description="Active enrollment roster" />
            <KPICard label="Present Today" value={dashboardStats.stats.present} icon={<CheckCircle size={20} />} color="bg-emerald-500" trend={2} description="Explicitly present logs" />
            <KPICard label="Late Today" value={dashboardStats.stats.late} icon={<Clock size={20} />} color="bg-amber-500" trend={-5} description="Tardiness records" />
            <KPICard label="Absent Today" value={dashboardStats.stats.absent} icon={<AlertTriangle size={20} />} color="bg-rose-500" trend={1} description="Explicit absence logs" />
            <KPICard label="Attendance Rate" value={`${dashboardStats.stats.percentage}%`} icon={<TrendingUp size={20} />} color="bg-teal-500" trend={0} description="Present/Late vs Absent" />
          </div>

          {/* Trend Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
            <h3 className="text-lg font-black dark:text-white uppercase tracking-tight mb-8">Daily Attendance Status Trend</h3>
            <div className="h-[400px] w-full">
              {dashboardChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '24px', border: 'none', color: '#fff' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Present" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Late" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Absent" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 font-semibold">
                  No attendance logged in this range. Change the reporting cycle range above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. DAILY ATTENDANCE REPORT TAB */}
      {/* ========================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            {/* Date select, search & status filters */}
            <div className="flex flex-wrap items-center gap-6 flex-1">
              
              {/* Date selection */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Reporting Date</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Attendance Status</label>
                <select
                  value={dailyStatusFilter}
                  onChange={(e) => setDailyStatusFilter(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                >
                  <option value="All">All Students</option>
                  <option value="Present">Present Only</option>
                  <option value="Late">Late Only</option>
                  <option value="Absent">Absent Only</option>
                  <option value="Unmarked">Unmarked Only</option>
                </select>
              </div>

              {/* Live search input */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Search Name / Code</label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search daily list..."
                    value={dailySearchQuery}
                    onChange={(e) => setDailySearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={exportDailyCSV}
                className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <FileSpreadsheet size={16} /> Export Excel
              </button>
              <button
                onClick={exportDailyPDF}
                className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-850 dark:bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <FileText size={16} /> Export PDF
              </button>
            </div>

          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5">Student Name</th>
                    <th className="px-8 py-5">Student Code</th>
                    <th className="px-8 py-5">Class</th>
                    <th className="px-8 py-5">Session</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Arrival Time</th>
                    <th className="px-8 py-5">Guardian Name</th>
                    <th className="px-8 py-5">Phone Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dailyReportData.map((item) => {
                    const isSaving = savingStudentId === item.student._id;
                    return (
                      <tr key={item.student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.student.fullName}
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">
                          {item.student.studentCode || item.student.rollNumber || '-'}
                        </td>
                        <td className="px-8 py-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {classes.find(c => String(c._id) === String(item.student.classId?._id || item.student.classId))?.name || '-'}
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-500">
                          {item.session}
                        </td>
                        <td className="px-8 py-6">
                          <select
                            disabled={isSaving}
                            value={item.status}
                            onChange={(e) => handleQuickStatusChange(item.student, e.target.value, item.arrivalTime)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase border cursor-pointer outline-none transition-all ${
                              item.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                : item.status === 'Late'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                                : item.status === 'Absent'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            <option value="Unmarked">Unmarked</option>
                            <option value="Present">✓ Present</option>
                            <option value="Late">⏰ Late</option>
                            <option value="Absent">✖ Absent</option>
                          </select>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-750 dark:text-slate-300 font-mono">
                          {item.status === 'Late' ? (
                            <input
                              type="text"
                              placeholder="e.g. 08:30"
                              defaultValue={item.arrivalTime !== '-' ? item.arrivalTime : '08:30'}
                              onBlur={(e) => handleArrivalTimeChange(item.student, item.status, e.target.value)}
                              className="w-24 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold outline-none"
                            />
                          ) : (
                            item.arrivalTime || '-'
                          )}
                        </td>
                        <td className="px-8 py-6 text-sm font-semibold text-slate-650 dark:text-slate-400">
                          {item.student.guardianId?.fullName || item.student.fatherName || '-'}
                        </td>
                        <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                          {item.student.guardianId?.phone || item.student.fatherPhone || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {dailyReportData.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-8 py-12 text-center text-slate-400 text-sm font-semibold">
                        No students found matching current selectors.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. CLASS ATTENDANCE REPORT TAB */}
      {/* ========================================== */}
      {activeTab === 'class' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Class selector control panel */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
                <BookOpen size={14} className="text-brand-500" /> Select Academic Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedLedgerStudentId('all');
                }}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-sm"
              >
                <option value="">Select class to audit...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
                  <User size={14} className="text-brand-500" /> Student in Attendance Ledger
                </label>
                <select
                  value={selectedLedgerStudentId}
                  onChange={(e) => {
                    const studentId = e.target.value;
                    setSelectedLedgerStudentId(studentId);
                  }}
                  disabled={!selectedClassId}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-sm"
                >
                  <option value="all">All Students in Selected Class</option>
                  {ledgerStudents.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.fullName} — {student.studentCode || student.rollNumber || 'No code'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export options */}
            <div className="flex items-center gap-3">
              <button
                onClick={exportClassCSV}
                disabled={!selectedClassId}
                className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
              >
                <FileSpreadsheet size={16} /> Export Excel
              </button>
              <button
                onClick={exportClassPDF}
                disabled={!selectedClassId}
                className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-850 dark:bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
              >
                <FileText size={16} /> Export PDF
              </button>
            </div>
          </div>

          {selectedClassId && (
            <>
              {/* Class summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Class Present Days</p>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-2">{classReportData.stats.present} Days</h3>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle size={18} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Class Late Days</p>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-2">{classReportData.stats.late} Days</h3>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Class Absent Days</p>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-2">{classReportData.stats.absent} Days</h3>
                  </div>
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Performance Rate</p>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-2">{classReportData.stats.percentage}%</h3>
                  </div>
                  <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950/40 text-brand-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                </div>
              </div>

              {/* Class students list table */}
              <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Performance Rate = Present ÷ (Present + Late + Absent). Late and absent records are included in the database totals.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="px-8 py-5">Student Name</th>
                        <th className="px-8 py-5">Student Code</th>
                        <th className="px-8 py-5">Total Present Count</th>
                        <th className="px-8 py-5">Total Late Count</th>
                        <th className="px-8 py-5">Total Absent Count</th>
                        <th className="px-8 py-5 text-right font-black">Performance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {classReportData.studentsList.map((item) => (
                        <tr key={item.student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">
                            {item.student.fullName}
                          </td>
                          <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                            {item.student.studentCode || item.student.rollNumber || '-'}
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-emerald-600 dark:text-emerald-450">
                            {item.counts.present} Days
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-amber-600 dark:text-amber-450">
                            {item.counts.late} Days
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-rose-600 dark:text-rose-450">
                            {item.counts.absent} Days
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={`px-3 py-1.5 rounded-full font-bold text-xs border ${
                              item.percentage >= 90
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : item.percentage >= 75
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>
                              {item.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {classReportData.studentsList.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-8 py-12 text-center text-slate-400 text-sm font-semibold">
                            No students registered in this class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 4. INDIVIDUAL STUDENT REPORT TAB */}
      {/* ========================================== */}
      {activeTab === 'student' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Autocomplete Search input */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative">
            <label className="block text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
              <User size={14} className="text-brand-500" /> Lookup Student by Name, Code or Phone
            </label>
            <div className="relative">
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200/60 dark:border-slate-700">
                <Search size={18} className="text-slate-400 mr-3" />
                <input
                  type="text"
                  placeholder="Type student name, student code or guardian phone number..."
                  value={studentSearchQuery}
                  onChange={(e) => {
                    setStudentSearchQuery(e.target.value);
                    setShowStudentSuggestions(true);
                  }}
                  onFocus={() => setShowStudentSuggestions(true)}
                  className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-bold"
                />
              </div>

              {showStudentSuggestions && individualSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {individualSuggestions.map(student => (
                    <button
                      key={student._id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setStudentSearchQuery(`${student.fullName} (${student.studentCode || student.rollNumber || ''})`);
                        setShowStudentSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-200 transition-all"
                    >
                      <div>
                        <div>{student.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">Code: {student.studentCode || student.rollNumber || '-'} | Guardian Phone: {student.guardianId?.phone || student.fatherPhone || '-'}</div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedStudent && studentReportData ? (
            <>
              {/* Warnings Banner if active */}
              {studentReportData.warnings.hasWarnings && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top duration-500">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">System Attendance Warning Triggered</h3>
                      <p className="text-sm font-bold text-amber-700/85 dark:text-amber-500/80 mt-1 max-w-2xl">
                        Student has reached {studentReportData.stats.absent} Absences or {studentReportData.stats.late} Late records. Click the WhatsApp button to alert the parent/guardian phone number.
                      </p>
                    </div>
                  </div>
                  {studentReportData.warnings.waUrl && (
                    <a
                      href={studentReportData.warnings.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 text-center shrink-0"
                    >
                      <MessageSquare size={16} /> WhatsApp Guardian
                    </a>
                  )}
                </div>
              )}

              {/* Profile details & summary card grids */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Basic Information Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 space-y-6">
                  <h3 className="text-base font-black dark:text-white uppercase tracking-tight pb-3 border-b border-slate-100 dark:border-slate-800">
                    Basic Profile Info
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Student Name</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white">{selectedStudent.fullName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Student Code / ID</span>
                      <p className="text-sm font-semibold text-slate-650 dark:text-slate-400 font-mono">{selectedStudent.studentCode || selectedStudent.rollNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Current Academic Class</span>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {classes.find(c => String(c._id) === String(selectedStudent.classId?._id || selectedStudent.classId))?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Guardian/Responsible Name</span>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{studentReportData.warnings.parentName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Guardian Phone Number</span>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 font-mono">{studentReportData.warnings.parentPhone || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Stats Summary KPI Card */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 space-y-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-black dark:text-white uppercase tracking-tight">
                      Attendance Performance Summary
                    </h3>
                    
                    {/* Export */}
                    <div className="flex gap-2">
                      <button
                        onClick={exportStudentCSV}
                        className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-all"
                        title="Export CSV"
                      >
                        <FileSpreadsheet size={16} />
                      </button>
                      <button
                        onClick={exportStudentPDF}
                        className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-all"
                        title="Export PDF"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 my-auto py-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Audited</span>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{studentReportData.stats.total} Days</h4>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Present</span>
                      <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-450 mt-1">{studentReportData.stats.present} Days</h4>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Late</span>
                      <h4 className="text-2xl font-black text-amber-600 dark:text-amber-450 mt-1">{studentReportData.stats.late} Days</h4>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Absent</span>
                      <h4 className="text-2xl font-black text-rose-600 dark:text-rose-450 mt-1">{studentReportData.stats.absent} Days</h4>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Total Rate Percentage</span>
                      <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-0.5">{studentReportData.stats.percentage}%</p>
                    </div>
                    
                    <div className="h-2 w-48 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0 hidden sm:block">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full" style={{ width: `${studentReportData.stats.percentage}%` }} />
                    </div>
                  </div>

                </div>

              </div>

              {/* Detailed history table */}
              <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Class</th>
                        <th className="px-8 py-5">Session</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Arrival Time</th>
                        <th className="px-8 py-5">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentReportData.history.map((rec) => (
                        <tr key={rec._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {rec.date}
                          </td>
                          <td className="px-8 py-6 text-sm font-semibold text-slate-705 dark:text-slate-300">
                            {rec.classId?.name || 'Deleted Class'}
                          </td>
                          <td className="px-8 py-6 text-xs font-bold text-slate-500">
                            {rec.session || 'Morning'}
                          </td>
                          <td className="px-8 py-6">
                            <select
                              value={rec.status}
                              onChange={(e) => handleHistoryStatusUpdate(rec._id, e.target.value, rec.arrivalTime)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase border cursor-pointer outline-none transition-all ${
                                rec.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                  : rec.status === 'Late'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                              }`}
                            >
                              <option value="Present">✓ Present</option>
                              <option value="Late">⏰ Late</option>
                              <option value="Absent">✖ Absent</option>
                            </select>
                          </td>
                          <td className="px-8 py-6 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {rec.status === 'Late' ? (
                              <input
                                type="text"
                                placeholder="08:30"
                                defaultValue={rec.arrivalTime || '08:30'}
                                onBlur={(e) => handleHistoryStatusUpdate(rec._id, rec.status, e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold outline-none"
                              />
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {rec.markedBy?.fullName || 'System Admin'}
                          </td>
                        </tr>
                      ))}
                      {studentReportData.history.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-8 py-12 text-center text-slate-400 text-sm font-semibold">
                            No attendance history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">No Student Selected</h3>
              <p className="text-slate-400 text-sm font-semibold mt-2 max-w-sm mx-auto">
                Please search for a student to view their detailed attendance report profile and trigger warning notifications.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default StudentAttendanceReport;
