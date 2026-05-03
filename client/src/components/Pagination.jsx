import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ totalRecords, recordsPerPage = 10, currentPage = 1, onPageChange }) => {
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const windowSize = 2; // Show 2 pages before and after current
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - windowSize);
      let end = Math.min(totalPages - 1, currentPage + windowSize);
      
      if (start > 2) pages.push('...');
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) pages.push('...');
      
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
        Showing {recordsPerPage} items | Total {totalRecords} Records
      </span>
      
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => { onPageChange(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          disabled={currentPage === 1}
          className="w-9 h-9 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-1.5 mx-1">
          {getPageNumbers().map((page, i) => (
            page === '...' ? (
              <span key={`sep-${i}`} className="px-2 text-slate-300 font-bold">...</span>
            ) : (
              <button
                key={page}
                onClick={() => { onPageChange(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-9 h-9 rounded-md text-[10px] font-black transition-all active:scale-95 ${
                  currentPage === page 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 shadow-sm'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>
 
        <button 
          onClick={() => { onPageChange(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          disabled={currentPage === totalPages}
          className="w-9 h-9 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
