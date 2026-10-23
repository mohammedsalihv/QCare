import Select from './Select';
import { useMasterData } from '../hooks/useMasterData';
import { isActiveRecord, masterSources } from '../utils/masterData';

export default function MasterSelect({ resource, valueKey = '_id', labelKey = masterSources[resource]?.labelKey, placeholder = 'Select an option', value = '', onChange, onRecordChange, children, ...props }) {
  const { data, loading, error, refresh } = useMasterData(resource);
  const records = data.filter(row => isActiveRecord(row) || String(row[valueKey]) === String(value));
  const selected = records.find(row => String(row[valueKey]) === String(value));
  return <>
    <Select {...props} value={value} disabled={props.disabled || loading || Boolean(error)} onChange={event => {
      onChange?.(event);
      onRecordChange?.(data.find(row => String(row[valueKey]) === event.target.value));
    }}>
      <option value="">{loading ? 'Loading…' : error ? 'Unable to load options' : records.length ? placeholder : 'No records in master'}</option>
      {children}
      {value && !selected && <option value={value} disabled>{value} (unavailable)</option>}
      {records.map(row => <option key={row._id} value={row[valueKey]} disabled={!isActiveRecord(row)}>{row[labelKey]}{resource === 'users' && row.employeeId ? ` (${row.employeeId})` : ''}{!isActiveRecord(row) ? ' (inactive)' : ''}</option>)}
    </Select>
    {error && <span role="alert" className="block text-sm text-red-700">{error} <button type="button" onClick={refresh} className="underline">Retry</button></span>}
  </>;
}
