import Select from './Select';
import CompactSearch from './CompactSearch';
export default function ListToolbar({ list, searchLabel = 'Search records', sorts = [{ value: 'name', label: 'Name' }], statuses = ['Active', 'Inactive'], extraFilters = [] }) {
  return <div className="qc-list-toolbar" role="group" aria-label="List controls">
    <CompactSearch aria-label={searchLabel} placeholder={searchLabel} maxLength={100} value={list.query.search} onChange={event => list.change({ search: event.target.value })} />
    {extraFilters.map(filter => <Select compact key={filter.key} aria-label={filter.label} value={list.query[filter.key] || ''} onChange={event => list.change({ [filter.key]: event.target.value })}><option value="">{filter.allLabel || 'All'}</option>{filter.options.map(value => <option key={value}>{value}</option>)}</Select>)}
    <Select compact aria-label="Filter by status" value={list.query.status} onChange={event => list.change({ status: event.target.value })}><option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</Select>
    <Select compact aria-label="Sort by" value={list.query.sortBy} onChange={event => list.change({ sortBy: event.target.value })}>{sorts.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</Select>
    <Select compact aria-label="Sort order" value={list.query.direction} onChange={event => list.change({ direction: event.target.value })}><option value="asc">Ascending</option><option value="desc">Descending</option></Select>
    <Select compact aria-label="Rows per page" value={list.query.limit} onChange={event => list.change({ limit: Number(event.target.value) })}>{[10,25,50,100].map(size => <option key={size} value={size}>{size}</option>)}</Select>
  </div>;
}
