import { playNotificationSound, unlockNotificationSound, cancelPendingSound } from '../utils/notificationSound';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import UserMessage from './feedback/UserMessage';
import ConfirmationDialog from './ConfirmationDialog';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';

const NotificationContext = createContext(null);

// The provider and its consumer hook deliberately share this module.
// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]); // Toast notifications
    const [feedNotifications, setFeedNotifications] = useState([]); // Database notifications (feed)
    const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('notificationSound') !== 'off');
    const seen = useRef(null), account = useRef(null), fetching = useRef(false);
    const toggleSound = () => setSoundEnabled(previous => { const next = !previous; localStorage.setItem('notificationSound', next ? 'on' : 'off'); if (next) unlockNotificationSound(); else cancelPendingSound(); return next; });
    useEffect(() => {
      if (!soundEnabled) return;
      const unlock = () => unlockNotificationSound();
      window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
      return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    }, [soundEnabled]);
    const [confirmState, setConfirmState] = useState(null);

    const showNotification = useCallback((message, type = 'info', duration = 5000) => {
        // Prevent duplicate notifications within 5 seconds
        const now = Date.now();
        setNotifications((prev) => {
          // Remove notifications older than 5 seconds for duplicate check
          const recent = prev.filter((n) => now - n.timestamp < 5000);
          if (recent.some((n) => n.message === message && n.type === type)) {
            return prev; // duplicate, do not add
          }
          return [...prev, { id: Math.random().toString(36).substr(2, 9), message, type, duration, timestamp: now }];
        });
    }, []);


    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const fetchFeed = useCallback(async () => {
        if (fetching.current) return;
        fetching.current = true;
        try {
            const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const identity = user._id || user.id || localStorage.getItem('token');
            if (account.current !== identity) { account.current = identity; seen.current = null; cancelPendingSound(); }
            const { data } = await axios.get('/api/notifications', getAuthConfig());
            const feed = Array.isArray(data) ? data : [];
            const incoming = seen.current ? feed.filter(n => n._id && !n.isRead && !seen.current.has(n._id)) : [];
            if (!seen.current) seen.current = new Set();
            feed.forEach(n => { if(n._id) seen.current.add(n._id); });
            setFeedNotifications(feed);
            if (incoming.length) { if (soundEnabled) playNotificationSound(); showNotification(incoming.length === 1 ? incoming[0].message : incoming.length + ' new notifications', 'info'); }
        } catch (error) { console.error('Error fetching notification feed:', error); }
        finally { fetching.current = false; }
    }, [soundEnabled, showNotification]);

    useEffect(() => {
        const refresh = () => { if (localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token) fetchFeed(); };
        refresh();
        const timer = setInterval(refresh, 10000);
        window.addEventListener('focus', refresh);
        return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
    }, [fetchFeed]);
    const clearFeed = useCallback(async () => {
        try {
            await axios.delete('/api/notifications/clear-all', getAuthConfig());
            setFeedNotifications([]);
        } catch (error) {
            console.error('Error clearing notification feed:', error);
        }
    }, []);

    const confirm = useCallback(({ title, message, onConfirm, type = 'warning', confirmLabel, cancelLabel }) => {
        setConfirmState({ title, message, onConfirm, type, confirmLabel, cancelLabel });
    }, []);

    const closeConfirm = () => setConfirmState(null);

    const handleConfirmAction = () => {
        if (confirmState?.onConfirm) confirmState.onConfirm();
        closeConfirm();
    };

    return (
        <NotificationContext.Provider value={{
            showNotification,
            confirm,
            feedNotifications,
            setFeedNotifications,
            fetchFeed,
            clearFeed, soundEnabled, toggleSound
        }}>
            {children}

            {/* Notifications Container */}
            <div className="qc-message-stack">
                {notifications.map((notification) => (
                    <UserMessage
                        key={notification.id}
                        {...notification}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>

            {confirmState && <ConfirmationDialog state={confirmState} onCancel={closeConfirm} onConfirm={handleConfirmAction} />}
        </NotificationContext.Provider>
    );
};
