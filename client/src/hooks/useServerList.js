import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';

// Cancel obsolete requests; refresh visible lists on focus and every 30 seconds.
export default function useServerList(endpoint) {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: '', status: '', sortBy: 'name', direction: 'asc' });
  const [result, setResult] = useState({ items: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  const change = useCallback(patch => setQuery(previous => ({ ...previous, page: 1, ...patch })), []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(endpoint, { ...getAuthConfig(), params: query, signal: controller.signal, timeout: 10000 });
        if (!Array.isArray(data.items) || !Number.isInteger(data.total)) throw new Error('The connected server needs the listing update.');
        if (!controller.signal.aborted) { setResult(data); setError(''); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.response?.data?.message || err.message || 'Unable to load records.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, query.search ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [endpoint, query, version]);
  useEffect(() => {
    const refreshVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refreshVisible);
    const timer = setInterval(refreshVisible, 30000);
    return () => { window.removeEventListener('focus', refreshVisible); clearInterval(timer); };
  }, [refresh]);
  return { ...result, query, change, loading, error, refresh };
}
