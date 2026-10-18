import { forwardRef } from 'react';

// Table content keeps its existing sorting, selection and status controls.
const Table = forwardRef(function Table({ className = '', children, ...props }, ref) {
  return <table {...props} ref={ref} className={`qc-table ${className}`}>{children}</table>;
});

export default Table;
