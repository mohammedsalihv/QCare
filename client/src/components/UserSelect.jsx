import { useEffect, useState } from 'react';
import { loadUserDirectory, directoryErrorMessage } from '../utils/userDirectory';
import Select from './Select';
import { getAuthConfig } from '../utils/authConfig';

// Display names only; keep identifiers in option values for saved relationships.
export default function UserSelect({ value = '', onChange, valueField = '_id', selectedLabel, placeholder = 'Select a staff member', disabled, ...props }) {
  const [directory, setDirectory] = useState({ users: [], loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    loadUserDirectory({ ...getAuthConfig(), signal: controller.signal }, role).then(data => {
      setDirectory({ users: data, loading: false, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted) setDirectory({ users: [], loading: false, error: directoryErrorMessage(error) });
    });
    return () => controller.abort();
  }, [revision]);
  const current = typeof value === 'object' ? value?._id || '' : value;
  const missing = current && !directory.users.some(user => String(user[valueField]) === String(current));
  return <div>
    <Select {...props} value={current} onChange={onChange} disabled={disabled || directory.loading || Boolean(directory.error)}>
      <option value="">{directory.loading ? 'Loading staff…' : placeholder}</option>
      {missing && <option value={current}>{selectedLabel || (valueField === 'employeeName' ? current : 'Selected user')}</option>}
      {directory.users.map(user => <option key={user._id} value={user[valueField]}>{user.employeeName}</option>)}
    </Select>
    {directory.error && <p role="alert" className="text-sm text-red-700 mt-2">{directory.error} <button type="button" disabled={disabled} className="underline" onClick={() => { setDirectory({ users: [], loading: true, error: '' }); setRevision(number => number + 1); }}>Retry staff list</button></p>}
    {!directory.loading && !directory.error && !directory.users.length && <p className="text-sm text-slate-600 mt-2">No active users found. Add or activate staff in User Management.</p>}
  </div>;
}
