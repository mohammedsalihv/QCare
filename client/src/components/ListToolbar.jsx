import Select from './Select';
import CompactSearch from './CompactSearch';
import TableToolbar from './TableToolbar';
const option = value => typeof value === 'object' ? value : { value, label: value };
export default function ListToolbar({ list, searchLabel = 'Search records', sorts = [{ value: 'name', label: 'Name' }], statuses = ['Active', 'Inactive'], extraFilters = [], children }) {
  return <TableToolbar>
    <CompactSearch aria-label={searchLabel} placeholder={searchLabel} maxLength={100} value={list.query.search} onChange={event => list.change({ search: event.target.value })} />
    {extraFilters.map(filter => <Select compact key={filter.key} aria-label={filter.label} value={list.query[filter.key] || ''} onChange={event => list.change({ [filter.key]: event.target.value })}><option value="">{filter.allLabel || 'All'}</option>{filter.options.map(option).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>)}
    {statuses && <Select compact aria-label="Filter by status" value={list.query.status} onChange={event => list.change({ status: event.target.value })}><option value="">All statuses</option>{statuses.map(option).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>}
    <Select compact aria-label="Sort by" value={list.query.sortBy} onChange={event => list.change({ sortBy: event.target.value })}>{sorts.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</Select>
    <Select compact aria-label="Sort order" value={list.query.direction} onChange={event => list.change({ direction: event.target.value })}><option value="asc">Ascending</option><option value="desc">Descending</option></Select>
    <Select compact aria-label="Rows per page" value={list.query.limit} onChange={event => list.change({ limit: Number(event.target.value) })}>{[10,25,50,100].map(size => <option key={size} value={size}>{size}</option>)}</Select>
    {children}
  </TableToolbar>;
}
