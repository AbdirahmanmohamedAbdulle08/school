import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Printer,
  FileDown,
  TrendingUp,
  TrendingDown,
  Scale,
  Building2,
  Filter,
  RotateCcw,
  CalendarRange
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Credit = Income (money in), Debit = Expense (money out).
const typeToLabel = (type) => (type === 'Income' ? 'Credit' : 'Debit');

// Current billing period: 25th of one month → 24th of the next.
const currentPeriod = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const start = d >= 25 ? new Date(y, m, 25) : new Date(y, m - 1, 25);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 24);
  const iso = (dt) => dt.toISOString().split('T')[0];
  return { from: iso(start), to: iso(end) };
};

const partyText = (name, phone) => {
  if (name && phone) return `${name} (${phone})`;
  return name || phone || '—';
};

const CashbookPaymentReport = () => {
  const { showAlert } = useAlert();

  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 'All' | 'Credit' | 'Debit'
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, entryRes] = await Promise.all([
          api.get('/cashbook/categories'),
          api.get('/cashbook/entries')
        ]);
        setCategories(catRes.data || []);
        setEntries(entryRes.data || []);
      } catch (error) {
        console.error('Failed to load payment report data', error);
        showAlert({ type: 'danger', title: 'Error', message: 'Failed to load payment report data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        const cat = e.categoryId;
        const catId = cat?._id || cat;
        const type = cat?.type; // 'Income' | 'Expense'

        if (typeFilter !== 'All') {
          const wanted = typeFilter === 'Credit' ? 'Income' : 'Expense';
          if (type !== wanted) return false;
        }
        if (categoryFilter !== 'All' && String(catId) !== String(categoryFilter)) return false;
        const d = e.date || '';
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [entries, typeFilter, categoryFilter, dateFrom, dateTo]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of filtered) {
      const amt = Number(e.amount) || 0;
      if (e.categoryId?.type === 'Income') income += amt;
      else expense += amt;
    }
    return { totalIncome: income, totalExpense: expense };
  }, [filtered]);

  const netIncome = totalIncome - totalExpense;

  // Category options respect the chosen type filter.
  const categoryOptions = useMemo(() => {
    if (typeFilter === 'All') return categories;
    const wanted = typeFilter === 'Credit' ? 'Income' : 'Expense';
    return categories.filter((c) => c.type === wanted);
  }, [categories, typeFilter]);

  const rangeLabel = dateFrom || dateTo ? `${dateFrom || '…'}  →  ${dateTo || '…'}` : 'All Time';

  const resetFilters = () => {
    setTypeFilter('All');
    setCategoryFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MACHAD INSTITUTE - PAYMENT REPORT', 14, 11);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated: ${new Date().toLocaleString()}   |   Type: ${typeFilter}   |   Period: ${rangeLabel}   |   Entries: ${filtered.length}`,
      14,
      18
    );

    let y = 32;
    const cols = { no: 12, name: 22, cat: 70, sender: 100, receiver: 150, type: 200, amount: 225, date: 260 };

    const drawHeader = () => {
      doc.setFillColor(30, 41, 59);
      doc.rect(8, y - 5, pageW - 16, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('#', cols.no, y);
      doc.text('NAME / TITLE', cols.name, y);
      doc.text('CATEGORY', cols.cat, y);
      doc.text('SENDER', cols.sender, y);
      doc.text('RECEIVER', cols.receiver, y);
      doc.text('TYPE', cols.type, y);
      doc.text('AMOUNT ($)', cols.amount, y);
      doc.text('DATE', cols.date, y);
      y += 8;
    };

    drawHeader();

    filtered.forEach((item, i) => {
      if (y > pageH - 25) {
        doc.addPage();
        y = 20;
        drawHeader();
      }
      const cat = item.categoryId;
      const isCredit = cat?.type === 'Income';
      const name = item.description || cat?.title || '—';

      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(8, y - 5, pageW - 16, 8, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(String(i + 1), cols.no, y);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(String(name).slice(0, 26), cols.name, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(String(cat?.title || '—').slice(0, 16), cols.cat, y);
      doc.text(partyText(item.senderName, item.senderPhone).slice(0, 26), cols.sender, y);
      doc.text(partyText(item.receiverName, item.receiverPhone).slice(0, 26), cols.receiver, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isCredit ? 22 : 220, isCredit ? 163 : 38, isCredit ? 74 : 38);
      doc.text(typeToLabel(cat?.type), cols.type, y);

      doc.setTextColor(15, 23, 42);
      doc.text(`$${fmtMoney(item.amount)}`, cols.amount, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.date || '—', cols.date, y);

      y += 8;
    });

    // Financial summary block
    if (y > pageH - 45) {
      doc.addPage();
      y = 20;
    }
    y += 4;
    doc.setFillColor(15, 23, 42);
    doc.rect(8, y, pageW - 16, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('FINANCIAL SUMMARY', 14, y + 9);
    doc.setFontSize(9);
    doc.setTextColor(74, 222, 128);
    doc.text(`Total Income: $${fmtMoney(totalIncome)}`, 14, y + 20);
    doc.setTextColor(248, 113, 113);
    doc.text(`Total Expense: $${fmtMoney(totalExpense)}`, 90, y + 20);
    doc.setTextColor(147, 197, 253);
    doc.text(`Net Income: $${fmtMoney(netIncome)}`, 170, y + 20);

    doc.save(`Machad_Payment_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-bold">Loading Payment Report...</div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1 print:hidden">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 rounded-[20px] flex items-center justify-center text-brand-400 shadow-xl border border-slate-700 ring-4 ring-brand-400/10">
            <Receipt size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Payment Report
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-1.5 uppercase tracking-[0.2em]">
              All money movements — credit &amp; debit ledger
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

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-slate-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter payments</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCategoryFilter('All');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            >
              <option value="All">All</option>
              <option value="Credit">Credit (Income)</option>
              <option value="Debit">Debit (Expense)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            >
              <option value="All">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} · {typeToLabel(c.type)}
                </option>
              ))}
            </select>
          </div>
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
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              const p = currentPeriod();
              setDateFrom(p.from);
              setDateTo(p.to);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-black uppercase tracking-wider"
          >
            <CalendarRange size={14} /> Current Period (25 → 24)
          </button>
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            All Time
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <span className="ml-auto text-[11px] font-bold text-slate-400">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Printable document */}
      <div className="bg-white dark:bg-slate-900 rounded-[36px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-8 print:p-0 print:border-none print:shadow-none">
        {/* Printable header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900 dark:border-slate-700 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={24} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
                MACHAD EDUCATIONAL INSTITUTE
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Payment Report — Credit &amp; Debit Ledger
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">Period</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{rangeLabel}</p>
            <p className="text-[11px] text-slate-400 mt-1">Generated {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">Name / Title</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Sender</th>
                <th className="px-4 py-4">Receiver</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4 text-right">Amount ($)</th>
                <th className="px-4 py-4 text-right">Remaining ($)</th>
                <th className="px-4 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item, index) => {
                const cat = item.categoryId;
                const isCredit = cat?.type === 'Income';
                const name = item.description || cat?.title || '—';
                return (
                  <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white">{name}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {cat?.title || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">{item.senderName || '—'}</p>
                      {item.senderPhone && <p className="text-[11px] text-slate-400 font-mono">{item.senderPhone}</p>}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">{item.receiverName || '—'}</p>
                      {item.receiverPhone && (
                        <p className="text-[11px] text-slate-400 font-mono">{item.receiverPhone}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                          isCredit
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {typeToLabel(cat?.type)}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 text-sm font-black text-right whitespace-nowrap ${
                        isCredit ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isCredit ? '+' : '−'}${fmtMoney(item.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-right whitespace-nowrap">
                      {item.feeRemaining != null && item.feeRemaining > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">${fmtMoney(item.feeRemaining)}</span>
                      ) : item.feeRemaining === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Paid</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.date || '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-8 py-12 text-center text-slate-400 text-sm font-medium">
                    No payment records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial summary — small page */}
        <div className="mt-10 border-t-2 border-slate-900 dark:border-slate-700 pt-8">
          <h3 className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white mb-5">
            Financial Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-6">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Total Income ($)</span>
              </div>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">${fmtMoney(totalIncome)}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-6">
              <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                <TrendingDown size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Total Expense ($)</span>
              </div>
              <p className="text-3xl font-black text-rose-700 dark:text-rose-300">${fmtMoney(totalExpense)}</p>
            </div>
            <div className="rounded-2xl border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/30 p-6">
              <div className="flex items-center gap-2 mb-2 text-brand-600 dark:text-brand-400">
                <Scale size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Net Income ($)</span>
              </div>
              <p
                className={`text-3xl font-black ${
                  netIncome >= 0 ? 'text-brand-700 dark:text-brand-300' : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                ${fmtMoney(netIncome)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashbookPaymentReport;
