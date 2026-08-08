import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Users,
  Phone,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  CreditCard,
  AlertCircle,
  Printer,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const currentMonth = () => new Date().toISOString().substring(0, 7);

const GuardianPaymentReport = () => {
  const { showAlert, showConfirm } = useAlert();
  const printRef = useRef(null);

  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const thisMonth = currentMonth();

  // ─── Fetch ───────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [resG, resS, resP] = await Promise.all([
        api.get('/guardians'),
        api.get('/students'),
        api.get('/payments'),
      ]);
      setGuardians(resG.data || []);
      setStudents(resS.data || []);
      setPayments(resP.data || []);
    } catch {
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Derived ─────────────────────────────────────────────────────
  const studentsByGuardian = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const gId = String(s.guardianId?._id || s.guardianId || '');
      if (!gId) return;
      if (!map[gId]) map[gId] = [];
      map[gId].push(s);
    });
    return map;
  }, [students]);

  const guardianPaidStatus = useMemo(() => {
    const result = {};
    guardians.forEach(g => {
      const gStudents = studentsByGuardian[g._id] || [];
      if (gStudents.length === 0) {
        result[g._id] = { paid: false, paidCount: 0, total: 0, paidStudentIds: new Set() };
        return;
      }
      const paidStudentIds = new Set(
        payments
          .filter(p => {
            const gId = String(p.guardianId?._id || p.guardianId || '');
            return gId === String(g._id) && p.month === thisMonth && p.status === 'Completed';
          })
          .map(p => String(p.studentId?._id || p.studentId || ''))
      );
      const paidCount = gStudents.filter(s => paidStudentIds.has(String(s._id))).length;
      result[g._id] = {
        paid: paidCount === gStudents.length && gStudents.length > 0,
        paidCount,
        total: gStudents.length,
        paidStudentIds
      };
    });
    return result;
  }, [guardians, studentsByGuardian, payments, thisMonth]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return guardians;
    return guardians.filter(g =>
      g.fullName.toLowerCase().includes(q) || g.phone.includes(q)
    );
  }, [guardians, searchQuery]);

  const stats = useMemo(() => {
    const total = guardians.length;
    const paid = guardians.filter(g => guardianPaidStatus[g._id]?.paid).length;
    return { total, paid, pending: total - paid };
  }, [guardians, guardianPaidStatus]);

  // ─── Mark paid ───────────────────────────────────────────────────
  const handleMarkAllPaid = async (guardian) => {
    const gStudents = studentsByGuardian[guardian._id] || [];
    const status = guardianPaidStatus[guardian._id] || {};
    const unpaid = gStudents.filter(s => !status.paidStudentIds?.has(String(s._id)));

    if (unpaid.length === 0) {
      showAlert({ type: 'info', title: 'Already Paid', message: 'All students already paid for this month.' });
      return;
    }

    const totalAmount = unpaid.reduce((sum, s) => sum + (s.monthlyFee || s.fee || 0), 0);
    const confirmed = await showConfirm({
      type: 'info',
      title: 'Confirm Payment',
      message: `Record payment for ${unpaid.length} student(s) under "${guardian.fullName}"?\nTotal: $${totalAmount} (${thisMonth})`,
      confirmText: 'Yes, Record',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      setProcessingId(guardian._id);
      for (const student of unpaid) {
        await api.post('/payments', {
          studentId: student._id,
          guardianId: guardian._id,
          amount: student.monthlyFee || student.fee || 0,
          month: thisMonth,
          paymentMethod: 'Cash',
          status: 'Completed',
        });
      }
      showAlert({ type: 'success', title: 'Payment Recorded', message: `All fees recorded for ${guardian.fullName}.` });
      const { data } = await api.get('/payments');
      setPayments(data || []);
    } catch (err) {
      showAlert({ type: 'danger', title: 'Error', message: err.response?.data?.message || 'Failed to record payment.' });
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Export PDF (payers only) ─────────────────────────────────────
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Dark header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('PAYMENT RESPONSIBILITY REPORT', 14, 11);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Month: ${thisMonth}   |   Generated: ${new Date().toLocaleString()}`, 14, 18);

    // Column config (portrait A4 = 210mm wide, margins 14)
    let y = 32;
    const cols = { no: 14, name: 22, phone: 75, rel: 120, students: 150, status: 180 };

    // Table header
    doc.setFillColor(30, 41, 59);
    doc.rect(10, y - 5, pageW - 20, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('#', cols.no, y);
    doc.text('PAYER NAME', cols.name, y);
    doc.text('PHONE', cols.phone, y);
    doc.text('RELATIONSHIP', cols.rel, y);
    doc.text('STUDENTS', cols.students, y);
    doc.text('PAID', cols.status, y);

    y += 8;

    filtered.forEach((g, i) => {
      if (y > pageH - 20) {
        doc.addPage();
        y = 20;
      }

      const gStudents = studentsByGuardian[String(g._id)] || [];
      const gStatus = guardianPaidStatus[g._id] || { paid: false, paidCount: 0, total: 0 };

      // Alternating row
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(10, y - 5, pageW - 20, 9, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(i + 1), cols.no, y);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(g.fullName, cols.name, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(g.phone || '—', cols.phone, y);
      doc.text(g.relationship || g.type || 'Parent', cols.rel, y);
      doc.text(`${gStatus.paidCount} / ${gStatus.total}`, cols.students, y);

      // Tick box for Paid column
      const boxX = cols.status;
      const boxY = y - 4;
      const boxSize = 4.5;

      doc.setLineWidth(0.3);
      if (gStatus.paid) {
        doc.setDrawColor(22, 163, 74);
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(boxX, boxY, boxSize, boxSize, 0.8, 0.8, 'FD');
        // Green checkmark tick
        doc.setDrawColor(22, 163, 74);
        doc.setLineWidth(0.6);
        doc.line(boxX + 1, boxY + 2.3, boxX + 1.9, boxY + 3.4);
        doc.line(boxX + 1.9, boxY + 3.4, boxX + 3.6, boxY + 1.2);
      } else {
        doc.setDrawColor(148, 163, 184);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(boxX, boxY, boxSize, boxSize, 0.8, 0.8, 'FD');
      }

      y += 9;
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Total records: ${filtered.length}   |   Institute Management System`, 14, pageH - 8);

    doc.save(`Payment_Responsibility_${thisMonth}.pdf`);
  };

  // ─── Print (payers only) ──────────────────────────────────────────
  const handlePrint = () => {
    const rows = filtered.map((g, i) => {
      const gStatus = guardianPaidStatus[g._id] || { paid: false, paidCount: 0, total: 0 };
      const bg = i % 2 === 0 ? '#fff' : '#f8fafc';
      return `
        <tr style="background:${bg};">
          <td style="padding:9px 14px;color:#64748b;font-size:11px;">${i + 1}</td>
          <td style="padding:9px 14px;font-weight:700;font-size:12px;color:#0f172a;">${g.fullName}</td>
          <td style="padding:9px 14px;font-size:12px;color:#475569;font-family:monospace;">${g.phone || '—'}</td>
          <td style="padding:9px 14px;font-size:11px;color:#64748b;">${g.relationship || g.type || 'Parent'}</td>
          <td style="padding:9px 14px;font-size:12px;font-weight:700;color:#0f172a;">${gStatus.paidCount} / ${gStatus.total}</td>
          <td style="padding:9px 14px;">
            <span style="font-size:11px;font-weight:800;padding:4px 12px;border-radius:8px;background:${gStatus.paid ? '#dcfce7' : '#fee2e2'};color:${gStatus.paid ? '#16a34a' : '#dc2626'};">
              ${gStatus.paid ? '✓ PAID' : '✗ PENDING'}
            </span>
          </td>
        </tr>
        ${studentRows}`;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Payment Responsibility — ${thisMonth}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#fff; color:#0f172a; }
          .header { background:#0f172a; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; }
          .header h1 { font-size:17px; font-weight:900; letter-spacing:0.05em; text-transform:uppercase; }
          .header p  { font-size:10px; opacity:0.7; margin-top:3px; }
          .kpi { display:flex; gap:0; border-bottom:2px solid #e2e8f0; }
          .kpi-item { flex:1; padding:12px 24px; border-right:1px solid #e2e8f0; }
          .kpi-item:last-child { border-right:none; }
          .kpi-label { font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; }
          .kpi-value { font-size:22px; font-weight:900; margin-top:2px; }
          table { width:100%; border-collapse:collapse; }
          thead tr { background:#f1f5f9; }
          th { padding:9px 12px; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#64748b; text-align:left; border-bottom:1px solid #e2e8f0; }
          @media print {
            @page { margin:12mm; size:A4 landscape; }
            button { display:none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Payment Responsibility Report</h1>
            <p>Month: ${thisMonth} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div style="font-size:11px;opacity:0.75;text-align:right;">
            Institute Management System
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-item">
            <div class="kpi-label">Total Guardians</div>
            <div class="kpi-value" style="color:#0f172a;">${stats.total}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Paid This Month</div>
            <div class="kpi-value" style="color:#16a34a;">${stats.paid}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Not Yet Paid</div>
            <div class="kpi-value" style="color:#dc2626;">${stats.pending}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Guardian / Responsible</th>
              <th>Phone Number</th>
              <th>Relationship</th>
              <th>Students</th>
              <th>Total Fees</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${printContent}</tbody>
        </table>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=1100,height=750');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 size={32} className="animate-spin text-brand-500" />
        <span className="ml-3 text-slate-500 font-bold text-sm">Loading payment responsibility data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 rounded-[20px] flex items-center justify-center text-brand-400 shadow-xl border border-slate-700 ring-4 ring-brand-400/10">
            <CreditCard size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Payment Responsibility
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-1 uppercase tracking-[0.2em]">
              {thisMonth} · Who has paid student fees
            </p>
          </div>
        </div>

        {/* Export / Print buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
          >
            <FileDown size={16} />
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-brand-600/30"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Guardians',  value: stats.total,   color: 'text-slate-900 dark:text-white' },
          { label: 'Paid This Month',  value: stats.paid,    color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Not Yet Paid',     value: stats.pending, color: 'text-rose-600 dark:text-rose-400' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200/60 dark:border-slate-700">
          <Search size={17} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by guardian name or phone number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-semibold"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div ref={printRef} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] px-8 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          {['Guardian / Responsible', 'Phone Number', 'Relationship', 'Students', 'Paid?'].map(h => (
            <span key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 && (
            <div className="px-8 py-16 text-center text-slate-400 text-sm font-semibold">
              {searchQuery ? 'No guardians match your search.' : 'No guardians found.'}
            </div>
          )}

          {filtered.map(guardian => {
            const gStatus = guardianPaidStatus[guardian._id] || { paid: false, paidCount: 0, total: 0 };
            const gStudents = studentsByGuardian[guardian._id] || [];
            const isExpanded = expandedId === guardian._id;
            const isProcessing = processingId === guardian._id;

            return (
              <div key={guardian._id}>
                <div
                  className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center px-8 py-5 transition-colors cursor-pointer ${
                    isExpanded ? 'bg-slate-50/60 dark:bg-slate-800/20' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/10'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : guardian._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-600/10 dark:bg-brand-400/10 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                      <User size={16} />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{guardian.fullName}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    <Phone size={13} className="text-slate-400" />
                    {guardian.phone}
                  </div>

                  <div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {guardian.relationship || guardian.type || 'Parent'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {gStatus.paidCount}/{gStatus.total} students
                    </span>
                  </div>

                  <div
                    className="flex items-center justify-center"
                    onClick={e => { e.stopPropagation(); if (!gStatus.paid && !isProcessing) handleMarkAllPaid(guardian); }}
                  >
                    {isProcessing ? (
                      <Loader2 size={22} className="animate-spin text-brand-500" />
                    ) : gStatus.paid ? (
                      <CheckCircle2 size={26} className="text-emerald-500 drop-shadow-sm" />
                    ) : (
                      <Circle size={26} className="text-slate-300 dark:text-slate-600 hover:text-emerald-400 transition-colors cursor-pointer" />
                    )}
                  </div>
                </div>

                {isExpanded && gStudents.length > 0 && (
                  <div className="px-8 pb-6 pt-2 bg-slate-50/40 dark:bg-slate-800/10 animate-in slide-in-from-top-1 duration-200">
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3 bg-slate-100/60 dark:bg-slate-800/60 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Student Name</span><span>Code</span><span>Monthly Fee</span><span>This Month</span>
                      </div>
                      {gStudents.map(student => {
                        const isPaid = gStatus.paidStudentIds?.has(String(student._id));
                        return (
                          <div key={student._id} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.fullName}</span>
                            <span className="text-xs font-mono text-slate-500">{student.studentCode || student.rollNumber || '—'}</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">${student.monthlyFee || student.fee || 0}</span>
                            <span className={`text-xs font-black uppercase ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                              {isPaid ? '✓ Paid' : '✗ Unpaid'}
                            </span>
                          </div>
                        );
                      })}
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3.5 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                        <span className="text-xs font-black uppercase text-slate-400">Total</span>
                        <span />
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          ${gStudents.reduce((s, st) => s + (st.monthlyFee || st.fee || 0), 0)}
                        </span>
                        <span className={`text-xs font-black uppercase ${gStatus.paid ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {gStatus.paid ? 'All Paid' : `${gStatus.total - gStatus.paidCount} remaining`}
                        </span>
                      </div>
                    </div>
                    {!gStatus.paid && (
                      <button
                        onClick={e => { e.stopPropagation(); handleMarkAllPaid(guardian); }}
                        disabled={isProcessing}
                        className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm disabled:opacity-60"
                      >
                        {isProcessing ? 'Recording...' : `Mark All Paid — ${guardian.fullName}`}
                      </button>
                    )}
                  </div>
                )}

                {isExpanded && gStudents.length === 0 && (
                  <div className="px-8 pb-6 pt-2 text-sm text-slate-400 font-semibold flex items-center gap-2">
                    <AlertCircle size={15} /> No students connected to this guardian.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default GuardianPaymentReport;
