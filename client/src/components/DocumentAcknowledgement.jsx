import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';
import { useNotification } from './NotificationContext';

export default function DocumentAcknowledgement({ document: doc, ready, onAcknowledged }) {
  const [reading, setReading] = useState(null), [busy, setBusy] = useState(false);
  const { showNotification } = useNotification();
  useEffect(() => {
    const controller = new AbortController();
    axios.get(`/api/documents/${doc._id}/reading`, { ...getAuthConfig(), signal: controller.signal })
      .then(({ data }) => setReading(data.mine || {}))
      .catch(() => { if (!controller.signal.aborted) showNotification('Unable to load your acknowledgement status. Reopen the document to retry.', 'error'); });
    return () => controller.abort();
  }, [doc._id, doc.version, showNotification]);
  const acknowledge = async () => {
    setBusy(true);
    try {
      const { data } = await axios.post(`/api/documents/${doc._id}/acknowledge`, { version: doc.version }, getAuthConfig());
      setReading(value => ({ ...value, acknowledgedAt: new Date().toISOString() }));
      onAcknowledged(doc._id);
      showNotification(data.message, 'success');
    } catch (e) { showNotification(e.response?.data?.message || 'Unable to record your acknowledgement.', 'error'); }
    finally { setBusy(false); }
  };
  const effective = new Date(doc.revisedDate) <= new Date() && (!doc.expiryDate || new Date(doc.expiryDate) > new Date());
  return <footer className="dl-acknowledgement"><span>Version {doc.version}</span><button className="dl-primary" disabled={!reading || !ready || !effective || busy || !!reading?.acknowledgedAt} onClick={acknowledge}>{reading?.acknowledgedAt ? 'Acknowledged' : busy ? 'Recording…' : 'I have read and understood this document'}</button></footer>;
}
