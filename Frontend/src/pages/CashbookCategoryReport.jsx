import React, { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart,
  Printer,
  FileDown,
  TrendingUp,
  TrendingDown,
  Scale,
  Building2,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Build the current billing period: 25th of one month → 24th of the next.
const currentPeriod = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  // On/after the 25th the period starts this month; before, it started last month.
  const start = d >= 25 ? new Date(y, m, 25) : new Date(y, m - 1, 25);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 24);
  const iso = (dt) => dt.toISOString().split('T')[0];
  return { from: iso(start), to: iso(end) };
};

const thisMonth = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (dt) => dt.toISOString().split('T')[0];
  return { from: iso(first), to: iso(last) };
};

const CashbookCategoryReport = () => {
  const { showAlert } = useAlert();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/cashbook/entries');
        setEntries(data || []);
      } catch (error) {
        console.error('Failed to load cashbook entries', error);
        showAlert({ type: 'danger', title: 'Error', message: 'Failed to load report data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inRange = (d) => {
    if (!d) return false;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const filteredEntries = useMemo(
    () => entries.filter((e) => inRange(e.date)),
    [entries, dateFrom, dateTo]
  );

  // Aggregate amount per category, split by Income / Expense.
  const { incomeRows, expenseRows, totalIncome, totalExpense } = useMemo(() => {
    const map = new Map();
    for (const e of filteredEntries) {
      const cat = e.categoryId;
      const title = cat?.title || 'Uncategorised';
      const type = cat?.type || 'Income';
      const key = `${type}::${title}`;
      const prev = map.get(key) || { name: title, type, total: 0, count: 0 };
      prev.total += Number(e.amount) || 0;
      prev.count += 1;
      map.set(key, prev);
    }
    const all = [...map.values()];
    const incomeRows = all
      .filter((r) => r.type === 'Income')
      .sort((a, b) => b.total - a.total);
    const expenseRows = all
      .filter((r) => r.type === 'Expense')
      .sort((a, b) => b.total - a.total);
    return {
      incomeRows,
      expenseRows,
      totalIncome: incomeRows.reduce((s, r) => s + r.total, 0),
      totalExpense: expenseRows.reduce((s, r) => s + r.total, 0)
    };
  }, [filteredEntries]);

  const netIncome = totalIncome - totalExpense;

  const rangeLabel = dateFrom || dateTo ? `${dateFrom || '…'}  →  ${dateTo || '…'}` : 'All Time';

  const applyPeriod = (p) => {
    setDateFrom(p.from);
    setDateTo(p.to);
  };

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
    doc.text('MACHAD INSTITUTE - CATEGORY SUMMARY REPORT', 14, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Period: ${rangeLabel}`, 14, 20);

    let y = 34;

    const drawTable = (heading, rows, total, accent) => {
      if (y > pageH - 40) {
        doc.addPage();
        y = 20;
      }
      // Section heading
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(heading, 14, y);
      y += 4;

      // Table header
      doc.setFillColor(30, 41, 59);
      doc.rect(10, y, pageW - 20, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('CATEGORY NAME', 14, y + 5.5);
      doc.text('TYPE', 110, y + 5.5);
      doc.text('ENTRIES', 140, y + 5.5);
      doc.text('TOTAL ($)', pageW - 40, y + 5.5);
      y += 8;

      if (rows.length === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, pageW - 20, 8, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text('No records in this period', 14, y + 5.5);
        y += 8;
      }

      rows.forEach((r, i) => {
        if (y > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
        doc.rect(10, y, pageW - 20, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.text(String(r.name).slice(0, 55), 14, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(r.type, 110, y + 5.5);
        doc.text(String(r.count), 140, y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`$${fmtMoney(r.total)}`, pageW - 40, y + 5.5);
        y += 8;
      });

      // Total row
      doc.setFillColor(15, 23, 42);
      doc.rect(10, y, pageW - 20, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${heading} TOTAL`, 14, y + 6);
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text(`$${fmtMoney(total)}`, pageW - 40, y + 6);
      y += 16;
    };

    drawTable('INCOME SUMMARY', incomeRows, totalIncome, [74, 222, 128]);
    drawTable('EXPENSE SUMMARY', expenseRows, totalExpense, [248, 113, 113]);

    // Net income
    if (y > pageH - 25) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(37, 99, 235);
    doc.rect(10, y, pageW - 20, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('NET INCOME (Income - Expense)', 14, y + 7);
    doc.text(`$${fmtMoney(netIncome)}`, pageW - 45, y + 7);

    doc.save(`Machad_Category_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-bold">Loading Category Summary Report...</div>;
  }

  const SummaryTable = ({ title, rows, total, tone }) => (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print:rounded-none print:border print:shadow-none print:mb-6">
      <div
        className={`px-8 py-5 flex items-center justify-between ${
          tone === 'income'
            ? 'bg-emerald-50 dark:bg-emerald-950/30'
            : 'bg-rose-50 dark:bg-rose-950/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {tone === 'income' ? (
            <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={22} />
          ) : (
            <TrendingDown className="text-rose-600 dark:text-rose-400" size={22} />
          )}
          <h3
            className={`text-lg font-black uppercase tracking-wide ${
              tone === 'income'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {title}
          </h3>
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {rows.length} categor{rows.length === 1 ? 'y' : 'ies'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
              <th className="px-8 py-4">Category Name</th>
              <th className="px-8 py-4">Type</th>
              <th className="px-8 py-4 text-center">Entries</th>
              <th className="px-8 py-4 text-right">Total Amount ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={`${r.type}-${r.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{r.name}</td>
                <td className="px-8 py-4">
                  <span
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                      r.type === 'Income'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {r.type}
                  </span>
                </td>
                <td className="px-8 py-4 text-sm text-center font-semibold text-slate-500 dark:text-slate-400">
                  {r.count}
                </td>
                <td className="px-8 py-4 text-sm text-right font-black text-slate-900 dark:text-white">
                  ${fmtMoney(r.total)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-sm">
                  No {tone} records in this period.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr
              className={`text-white font-black text-sm ${
                tone === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <td colSpan={3} className="px-8 py-5 text-right uppercase tracking-wider">
                {title} Total
              </td>
              <td className="px-8 py-5 text-right text-xl">${fmtMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1 print:hidden">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 rounded-[20px] flex items-center justify-center text-brand-400 shadow-xl border border-slate-700 ring-4 ring-brand-400/10">
            <FileBarChart size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Category Summary Report
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-1.5 uppercase tracking-[0.2em]">
              Income &amp; Expense totals grouped by category
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Income Summary
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${fmtMoney(totalIncome)}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold">{incomeRows.length} income categories</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
              Expense Summary
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${fmtMoney(totalExpense)}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold">{expenseRows.length} expense categories</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              Net Income
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Scale size={18} />
            </div>
          </div>
          <p className={`text-3xl font-black ${netIncome >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
            ${fmtMoney(netIncome)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Income minus Expense</p>
        </div>
      </div>

      {/* Date filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-slate-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Report period</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-black uppercase tracking-wider"
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => applyPeriod(currentPeriod())}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Current Period (25→24)
            </button>
            <button
              type="button"
              onClick={() => applyPeriod(thisMonth())}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Printable document */}
      <div className="space-y-8 print:space-y-4">
        {/* Printable header (visible in print + on screen) */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={24} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
                MACHAD EDUCATIONAL INSTITUTE
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Category Summary — Income &amp; Expense
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">Period</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{rangeLabel}</p>
            <p className="text-[11px] text-slate-400 mt-1">Generated {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Income table (top) */}
        <SummaryTable title="Income Summary" rows={incomeRows} total={totalIncome} tone="income" />

        {/* Expense table (bottom) */}
        <SummaryTable title="Expense Summary" rows={expenseRows} total={totalExpense} tone="expense" />

        {/* Net income banner */}
        <div className="bg-brand-600 text-white rounded-[28px] px-8 py-6 flex items-center justify-between shadow-lg print:rounded-none">
          <div className="flex items-center gap-3">
            <Scale size={26} />
            <span className="text-lg font-black uppercase tracking-wide">Net Income (Income − Expense)</span>
          </div>
          <span className="text-3xl font-black">${fmtMoney(netIncome)}</span>
        </div>
      </div>
    </div>
  );
};

export default CashbookCategoryReport;
