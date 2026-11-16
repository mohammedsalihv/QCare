import { useEffect } from 'react';
import { useNotification } from '../NotificationContext';

// Bridge async component feedback into the application's single toast system.
export default function FeedbackToast({ message, type = 'info' }) {
  const { showNotification } = useNotification();
  useEffect(() => { if (message) showNotification(message, type, type === 'error' ? 10000 : 6000); }, [message, type, showNotification]);
  return null;
}
