import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Dropdown = ({ trigger, options, onSelect, value, className = "", fullWidth = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => (opt.value || opt.label) === value);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer h-full">
        {trigger ? trigger : (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-white hover:border-[#2dd4bf] transition-all">
            <span className={!selectedOption ? 'text-slate-400' : ''}>
              {selectedOption ? selectedOption.label : 'Select Option'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>

      {isOpen && (
        <div 
          className={`absolute left-0 ${openUpwards ? 'bottom-full mb-2' : 'mt-2'} ${fullWidth ? 'w-full' : 'w-56'} bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] animate-in fade-in zoom-in-95 duration-200 ${openUpwards ? 'origin-bottom' : 'origin-top'}`}
        >
          <div className="py-1.5 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSelect(option.value || option.label);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors truncate ${
                  (option.value || option.label) === value 
                  ? 'bg-[#2dd4bf] text-slate-950' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#2dd4bf]'
                }`}
              >
                {option.icon && <option.icon className="w-3.5 h-3.5" />}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
