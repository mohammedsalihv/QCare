import { useCallback, useEffect, useState } from 'react';
import { fetchMasterData } from '../utils/masterData';

export function useMasterData(resource) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const changed = event => { if (!event.detail || event.detail === resource) refresh(); };
    window.addEventListener('qcare:master-changed', changed);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('qcare:master-changed', changed); window.removeEventListener('focus', refresh); };
  }, [resource, refresh]);
  useEffect(() => {
    const controller = new AbortController();
    fetchMasterData(resource, controller.signal).then(rows => {
      if (!controller.signal.aborted) { setData(rows); setError(''); }
    }).catch(failure => {
      if (!controller.signal.aborted) { setData([]); setError(failure.response?.data?.message || 'Unable to load master records.'); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [resource, revision]);
  return { data, loading, error, refresh };
}
