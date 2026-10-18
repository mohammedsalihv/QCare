import Select from './Select.jsx';
import React from 'react';

/**
 * Reusable dropdown for selecting AD sources.
 *
 * @param {Object[]} options - Array of { value, label } objects.
 * @param {string} selected - Currently selected value.
 * @param {function} onChange - Change handler receiving the event.
 * @param {string} [className] - Additional Tailwind classes.
 */
const ADSourceDropdown = ({ options, selected, onChange, className }) => (
  <Select
    value={selected}
    onChange={onChange}
    className={`px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#040404] transition-all text-xs font-bold text-black font-bold ${className || ''}`.trim()}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </Select>
);

export default ADSourceDropdown;
