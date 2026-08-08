import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center gap-2 mt-8 mb-4 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm w-fit mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all active:scale-90"
            >
                <ChevronsLeft size={18} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all active:scale-90"
            >
                <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-1.5 px-2">
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all active:scale-90 ${currentPage === page
                                ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-lg'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all active:scale-90"
            >
                <ChevronRight size={18} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all active:scale-90"
            >
                <ChevronsRight size={18} strokeWidth={2.5} />
            </button>

            <div className="ml-4 pl-4 border-l border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    );
};

export default Pagination;
