import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Notification from './Notification';
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
        try {
            const { data } = await axios.get('/api/notifications', getAuthConfig());
            setFeedNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching notification feed:', error);
        }
    }, []);

    useEffect(() => {
        const refresh = () => { if (localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token) fetchFeed(); };
        refresh();
        const timer = setInterval(refresh, 30000);
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
            clearFeed 
        }}>
            {children}
            
            {/* Notifications Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
                {notifications.map((notification) => (
                    <Notification
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
