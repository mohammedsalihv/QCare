const invalid = message => { const error = new Error(message); error.status = 400; throw error; };
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function listQuery(query, { sorts, defaultSort = 'name', statuses = ['Active', 'Inactive'] }) {
  const scalar = (key, fallback) => {
    const value = query[key] ?? fallback;
    if (typeof value !== 'string') invalid(`Invalid ${key}.`);
    return value;
  };
  const integer = (key, fallback, max) => {
    const value = scalar(key, fallback);
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max) invalid(`Invalid ${key}.`);
    return Number(value);
  };
  const page = integer('page', '1', 100000);
  const limit = integer('limit', '10', 100);
  const search = scalar('search', '').trim();
  if (search.length > 100) invalid('Search must be at most 100 characters.');
  const sortBy = scalar('sortBy', defaultSort);
  if (!Object.hasOwn(sorts, sortBy)) invalid('Invalid sort field.');
  const direction = scalar('direction', 'asc');
  if (!['asc', 'desc'].includes(direction)) invalid('Invalid sort direction.');
  const status = scalar('status', '');
  if (status && !statuses.includes(status)) invalid('Invalid status filter.');
  return { page, limit, search, regex: search ? new RegExp(escapeRegex(search), 'i') : null, status, sort: { [sorts[sortBy]]: direction === 'asc' ? 1 : -1, _id: 1 } };
}
module.exports = { listQuery };
