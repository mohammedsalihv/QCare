import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Select from './Select';

const OptionDropdown = ({ trigger, options, onSelect, value, className = "", fullWidth = false, searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      setSearchTerm(''); // Reset search term when opening
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => (opt.value ?? opt.label) === value);

  const filteredOptions = searchable
    ? options.filter(opt => (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}  ${className}`} ref={dropdownRef} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setIsOpen(false); } }}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer h-full">
        {trigger ? trigger : (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-semibold text-slate-800 hover:bg-white hover:border-[var(--color-primary)] transition-all">
            <span className={!selectedOption ? 'text-slate-800 font-semibold' : ''}>
              {selectedOption ? selectedOption.label : 'Select Option'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-800 font-semibold transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>

      {isOpen && (
        <div 
          className={`qc-action-popup absolute left-0 ${openUpwards ? 'bottom-full mb-2' : 'mt-2'}  ${fullWidth ? 'w-full' : 'w-56'} bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] animate-in fade-in zoom-in-95 duration-200 ${openUpwards ? 'origin-bottom' : 'origin-top'}`}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-[13px] bg-white border border-slate-200 rounded-lg outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          )}
          <div className="py-1.5 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSelect(option.value ?? option.label);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold transition-colors truncate ${
                  (option.value ?? option.label) === value 
                  ? 'bg-[var(--color-primary)] text-slate-800 font-semibold' 
                  : 'text-slate-800 font-semibold hover:bg-slate-50 hover:text-[var(--color-primary)]'
                }`}
              >
                {option.icon && <option.icon className="w-3.5 h-3.5" />}
                <span>{option.label}</span>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-[13px] font-semibold text-slate-500 text-center">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Dropdown({ options = [], trigger, searchable, onSelect, value, fullWidth = false, className = '', ...props }) {
  if (trigger) return <OptionDropdown {...props} options={options} trigger={trigger} searchable={searchable} onSelect={onSelect} value={value} fullWidth={fullWidth} className={className} />;
  const hasValue = options.some(option => String(option.value ?? option.label) === String(value ?? ''));
  return <Select {...props} searchable={searchable ?? true} value={value ?? ''} className={`${fullWidth ? 'w-full' : 'max-w-full'} px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium ${className}`} onChange={event => {
    const option = options.find(item => String(item.value ?? item.label) === event.target.value);
    if (option) onSelect?.(option.value ?? option.label);
  }}>
    {!hasValue && <option value="" disabled>Select an option</option>}
    {options.map((option, index) => <option key={String(option.value ?? option.label ?? index)} value={option.value ?? option.label} disabled={option.disabled}>{option.label}</option>)}
  </Select>;
}
