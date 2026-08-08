import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Phone, ChevronDown, ChevronRight, Printer, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PayersManagement = () => {
  const { showAlert } = useAlert();
  const [payers, setPayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);

  const fetchPayers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cashbook/payers');
      setPayers(data || []);
    } catch (error) {
      console.error('Failed to load payers', error);
      showAlert({ type: 'danger', title: 'Error', message: 'Failed to load payers.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return payers;
    return payers.filter(
      (p) => (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q)
    );
  }, [payers, search]);

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Header banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MACHAD INSTITUTE - PAYERS CHECKLIST', 14, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Payers: ${filtered.length}`, 14, 20);

    const cols = { no: 12, name: 22, number: 78, students: 132, total: 155, paid: 190 };
    let y = 36;

    const drawHeader = () => {
      doc.setFillColor(30, 41, 59);
      doc.rect(10, y - 5, pageW - 20, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('#', cols.no, y);
      doc.text('PAYER NAME', cols.name, y);
      doc.text('NUMBER', cols.number, y);
      doc.text('STUDENTS', cols.students, y);
      doc.text('TOTAL ($)', cols.total, y);
      doc.text('PAID', cols.paid, y);
      y += 9;
    };

    drawHeader();

    filtered.forEach((p, i) => {
      if (y > pageH - 20) {
        doc.addPage();
        y = 20;
        drawHeader();
      }
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(10, y - 5, pageW - 20, 9, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(i + 1), cols.no, y);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(String(p.name || 'Unknown').slice(0, 28), cols.name, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(String(p.phone || '—'), cols.number, y);
      doc.text(String(p.studentCount), cols.students + 3, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`$${fmtMoney(p.totalFee)}`, cols.total, y);

      // Empty box to tick by hand.
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.rect(cols.paid, y - 4, 5, 5);

      y += 9;
    });

    doc.save(`Machad_Payers_Checklist_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-bold">Loading Payers...</div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 print:hidden">
            <Users size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Payers
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">
              Who pays · how many students · total fee · tick when paid
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <FileDown size={16} /> Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-600/30 active:scale-95"
          >
            <Printer size={16} /> Print Checklist
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md print:hidden">
        <Search size={18} className="text-slate-400 mr-3" />
        <input
          type="text"
          placeholder="Search by payer name or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print:rounded-none print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-5 w-10 print:hidden"></th>
                <th className="px-4 py-5">Payer Name</th>
                <th className="px-8 py-5">Number</th>
                <th className="px-8 py-5 text-center">Students</th>
                <th className="px-8 py-5 text-right">Total Money</th>
                <th className="px-8 py-5 text-center">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => {
                const isOpen = expandedKey === p.key;
                return (
                  <React.Fragment key={p.key}>
                    <tr
                      onClick={() => setExpandedKey(isOpen ? null : p.key)}
                      className={`cursor-pointer transition-colors ${
                        isOpen ? 'bg-slate-50 dark:bg-slate-800/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10'
                      }`}
                    >
                      <td className="px-4 py-6 text-slate-400 print:hidden">
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td className="px-4 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                      <td className="px-8 py-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <Phone size={13} className="text-slate-400 print:hidden" />
                          {p.phone || '—'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 text-xs font-black rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {p.studentCount}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right text-sm font-black text-slate-900 dark:text-white">
                        ${fmtMoney(p.totalFee)}
                      </td>
                      {/* Empty box — printed and ticked by hand */}
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center">
                          <span className="inline-block w-6 h-6 rounded-md border-2 border-slate-900 dark:border-slate-300 print:border-black" />
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-slate-50/70 dark:bg-slate-800/20 print:hidden">
                        <td colSpan={6} className="px-6 pb-6 pt-0">
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                  <th className="px-5 py-3">Student</th>
                                  <th className="px-5 py-3">Class</th>
                                  <th className="px-5 py-3 text-right">Monthly Fee</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {p.students.map((s) => (
                                  <tr key={s.studentId}>
                                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{s.className || '—'}</td>
                                    <td className="px-5 py-3 text-right text-slate-700 dark:text-slate-200">${fmtMoney(s.monthlyFee)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                                  <td className="px-5 py-3 uppercase text-[11px] text-slate-500" colSpan={2}>Total</td>
                                  <td className="px-5 py-3 text-right">${fmtMoney(p.totalFee)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm font-medium">
                    No payers found. They appear here once students with a responsible person's number are added.
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

export default PayersManagement;
