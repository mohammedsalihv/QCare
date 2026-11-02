import Select from './Select';
export default function ListToolbar({ list, searchLabel = 'Search records', sorts = [{ value: 'name', label: 'Name' }] }) {
  return <div className="flex flex-wrap items-end gap-3 p-4 border-b border-slate-100">
    <label className="flex-1 min-w-48">{searchLabel}<input type="search" maxLength={100} value={list.query.search} onChange={event => list.change({ search: event.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1" /></label>
    <label>Status<Select aria-label="Filter by status" value={list.query.status} onChange={event => list.change({ status: event.target.value })} className="w-full mt-1"><option value="">All statuses</option><option>Active</option><option>Inactive</option></Select></label>
    <label>Sort by<Select aria-label="Sort by" value={list.query.sortBy} onChange={event => list.change({ sortBy: event.target.value })} className="w-full mt-1">{sorts.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</Select></label>
    <label>Order<Select aria-label="Sort order" value={list.query.direction} onChange={event => list.change({ direction: event.target.value })} className="w-full mt-1"><option value="asc">Ascending</option><option value="desc">Descending</option></Select></label>
    <label>Rows<Select aria-label="Rows per page" value={list.query.limit} onChange={event => list.change({ limit: Number(event.target.value) })} className="w-full mt-1">{[10,25,50,100].map(size => <option key={size} value={size}>{size}</option>)}</Select></label>
    <button type="button" disabled={list.loading} onClick={list.refresh} className="border rounded-lg px-3 py-2">Refresh</button>
  </div>;
}
