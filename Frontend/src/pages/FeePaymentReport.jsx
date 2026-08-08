import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FileText,
  Printer,
  FileDown,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
  Filter,
  Users,
  Building2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const FeePaymentReport = () => {
  const { showAlert } = useAlert();

  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPayments, resStudents, resWallets] = await Promise.all([
        api.get('/payments'),
        api.get('/students'),
        api.get('/wallets')
      ]);
      setPayments(resPayments.data || []);
      setStudents(resStudents.data || []);
      setWallets(resWallets.data || []);
    } catch (error) {
      console.error('Failed to fetch fee payment report data', error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to load payment report data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStudentInfo = (studentRef) => {
    if (typeof studentRef === 'object' && studentRef !== null) {
      return studentRef;
    }
    return students.find(s => s._id === studentRef) || {};
  };

  // Payer (fee payer / guardian) details for a student.
  const getPayerInfo = (student) => {
    const guardian = student?.guardianId && typeof student.guardianId === 'object' ? student.guardianId : null;
    return {
      name: guardian?.fullName || student?.fatherName || student?.fullName || 'Unknown Payer',
      phone: guardian?.phone || student?.fatherPhone || 'N/A'
    };
  };

  // Total completed payments per student+month, to compute the remaining (unpaid) amount.
  const paidByStudentMonth = useMemo(() => {
    const map = {};
    payments.forEach(p => {
      if (p.status !== 'Completed') return;
      const sid = typeof p.studentId === 'object' ? p.studentId?._id : p.studentId;
      const key = `${sid}:${p.month}`;
      map[key] = (map[key] || 0) + Number(p.amount || 0);
    });
    return map;
  }, [payments]);

  const getRemaining = (student, item) => {
    const sid = typeof item.studentId === 'object' ? item.studentId?._id : item.studentId;
    const fee = Number(student.monthlyFee ?? student.fee ?? 0);
    const paid = paidByStudentMonth[`${sid}:${item.month}`] || 0;
    return Math.max(0, fee - paid);
  };

  const filtered = useMemo(() => {
    return payments.filter(item => {
      const student = getStudentInfo(item.studentId);
      const payer = getPayerInfo(student);
      const studentName = student.fullName || '';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q ||
        payer.name.toLowerCase().includes(q) ||
        payer.phone.toLowerCase().includes(q) ||
        studentName.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.paymentMethod || '').toLowerCase().includes(q);

      const isPaid = item.status === 'Completed';
      const paidAmount = isPaid ? Number(item.amount || 0) : 0;
      const remaining = getRemaining(student, item);

      let matchesStatus = true;
      if (statusFilter === 'Paid') matchesStatus = remaining <= 0;        // fully settled this month
      else if (statusFilter === 'Unpaid') matchesStatus = paidAmount <= 0; // nothing paid on this entry
      else if (statusFilter === 'Remaining') matchesStatus = remaining > 0; // still owes a balance

      // Custom date range on the payment date (inclusive).
      const rawDate = item.paymentDate || item.createdAt;
      const entryDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : '';
      const matchesFrom = !dateFrom || (entryDate && entryDate >= dateFrom);
      const matchesTo = !dateTo || (entryDate && entryDate <= dateTo);

      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [payments, students, searchQuery, statusFilter, dateFrom, dateTo, paidByStudentMonth]);

  // Total Calculations for bottom row and KPI cards
  const totalAmount = useMemo(() => filtered.reduce((sum, item) => sum + Number(item.amount || 0), 0), [filtered]);
  const completedList = useMemo(() => filtered.filter(i => i.status === 'Completed'), [filtered]);
  const completedAmount = useMemo(() => completedList.reduce((sum, item) => sum + Number(item.amount || 0), 0), [completedList]);
  const pendingList = useMemo(() => filtered.filter(i => i.status === 'Pending'), [filtered]);
  const pendingAmount = useMemo(() => pendingList.reduce((sum, item) => sum + Number(item.amount || 0), 0), [pendingList]);

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Dark Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MACHAD INSTITUTE - FEE PAYMENT REPORT', 14, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Total Entries: ${filtered.length}`, 14, 20);

    let y = 35;
    const cols = { no: 12, name: 22, number: 75, month: 115, amount: 145, status: 175 };

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(10, y - 5, pageW - 20, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('#', cols.no, y);
    doc.text('PAYER NAME', cols.name, y);
    doc.text('PAYER PHONE', cols.number, y);
    doc.text('MONTH', cols.month, y);
    doc.text('PAID ($)', cols.amount, y);
    doc.text('UNPAID ($)', cols.status, y);

    y += 8;

    filtered.forEach((item, i) => {
      if (y > pageH - 25) {
        doc.addPage();
        y = 20;
      }

      const student = getStudentInfo(item.studentId);
      const payer = getPayerInfo(student);
      const isPaid = item.status === 'Completed';
      const paidAmount = isPaid ? Number(item.amount || 0) : 0;
      const unpaid = getRemaining(student, item);

      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(10, y - 5, pageW - 20, 8, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(i + 1), cols.no, y);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(payer.name, cols.name, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(String(payer.phone), cols.number, y);
      doc.text(item.month || 'Current', cols.month, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 163, 74);
      doc.text(`$${paidAmount.toLocaleString()}`, cols.amount, y);

      doc.setTextColor(unpaid > 0 ? 180 : 22, unpaid > 0 ? 83 : 163, unpaid > 0 ? 9 : 74);
      doc.text(`$${unpaid.toLocaleString()}`, cols.status, y);

      y += 8;
    });

    // Bottom Total Row in PDF
    if (y > pageH - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(15, 23, 42);
    doc.rect(10, y - 5, pageW - 20, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL PAID:', 75, y + 1);
    doc.setTextColor(74, 222, 128);
    doc.text(`$${completedAmount.toLocaleString()}`, 145, y + 1);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Paid: ${completedList.length} ($${completedAmount.toLocaleString()}) | Pending: ${pendingList.length} ($${pendingAmount.toLocaleString()})`, 10, pageH - 8);

    doc.save(`Machad_Fee_Payment_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Loading Fee Payment Report...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1 print:hidden">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 rounded-[20px] flex items-center justify-center text-brand-400 shadow-xl border border-slate-700 ring-4 ring-brand-400/10">
            <FileText size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Fee Payment Report
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-1.5 uppercase tracking-[0.2em]">
              Machad Institute Student Fee Collection & Financial Statements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <FileDown size={16} /> Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-600/30 active:scale-95"
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Total Money Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${completedAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold">{completedList.length} Paid entries</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Total Pending Fee</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold">{pendingList.length} Pending entries</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Grand Total Money</span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${totalAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Sum of all {filtered.length} report rows</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md w-full">
          <Search size={18} className="text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search payer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 outline-none"
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 outline-none"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 ml-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {['All', 'Paid', 'Unpaid', 'Remaining'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  statusFilter === status
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Document Body */}
      <div className="bg-white dark:bg-slate-900 rounded-[36px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Printable Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900 dark:border-slate-700 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={24} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">MACHAD EDUCATIONAL INSTITUTE</h2>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Official Fee Payment & Collection Report</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">Report Date:</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Payer Name</th>
                <th className="px-6 py-4">Payer Phone</th>
                <th className="px-6 py-4">Month / Date</th>
                <th className="px-6 py-4">Deposit Wallet</th>
                <th className="px-6 py-4">Paid ($)</th>
                <th className="px-6 py-4">Unpaid ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item, index) => {
                const student = getStudentInfo(item.studentId);
                const payer = getPayerInfo(student);
                const isPaid = item.status === 'Completed';
                const paidAmount = isPaid ? Number(item.amount || 0) : 0;
                const unpaid = getRemaining(student, item);

                return (
                  <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{payer.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">Student: {student.fullName || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">
                        {payer.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.month || 'Current'}</p>
                      <p className="text-[11px] text-slate-400">{new Date(item.paymentDate || item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.walletId?.name || (wallets.find(w => w._id === item.walletId)?.name) || 'Main Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ${paidAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-black">
                      {unpaid > 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-black rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Clock size={12} /> ${unpaid.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-black rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 size={12} /> $0
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-8 py-12 text-center text-slate-400 text-sm font-medium">No fee payment records found.</td>
                </tr>
              )}
            </tbody>

            {/* Bottom Total Row */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-sm border-t-2 border-slate-700">
                  <td colSpan="5" className="px-6 py-5 text-right uppercase tracking-wider text-slate-300">
                    TOTAL PAID / UNPAID:
                  </td>
                  <td className="px-6 py-5 text-xl font-black text-emerald-400">
                    ${completedAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-xl font-black text-amber-400">
                    ${pendingAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Printable Signatures */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-16 text-center text-xs font-bold text-slate-600">
          <div>
            <div className="border-b border-slate-400 mb-2 h-10" />
            <p className="uppercase tracking-wider">Accountant / Cashier Signature</p>
          </div>
          <div>
            <div className="border-b border-slate-400 mb-2 h-10" />
            <p className="uppercase tracking-wider">Director / Management Stamp</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FeePaymentReport;
