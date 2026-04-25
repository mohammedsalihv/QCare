import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ totalRecords, recordsPerPage = 10, currentPage = 1, onPageChange }) => {
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  if (totalPages <= 1) return null;

  return (
    <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        Showing {recordsPerPage} items | Total {totalRecords} Records
      </span>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-[#b59662] hover:border-[#b59662] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1.5 mx-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => onPageChange(i + 1)}
              className={`w-10 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                currentPage === i + 1 
                ? 'bg-[#b59662] text-white shadow-lg shadow-[#b59662]/30' 
                : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 shadow-sm'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-[#b59662] hover:border-[#b59662] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
