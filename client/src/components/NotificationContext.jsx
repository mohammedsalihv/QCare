import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from './Notification';
import { HelpCircle, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';

const NotificationContext = createContext(null);

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
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const fetchFeed = useCallback(async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/notifications', getAuthConfig());
            setFeedNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching notification feed:', error);
        }
    }, []);

    const clearFeed = useCallback(async () => {
        try {
            await axios.delete('http://localhost:5000/api/notifications/clear-all', getAuthConfig());
            setFeedNotifications([]);
        } catch (error) {
            console.error('Error clearing notification feed:', error);
        }
    }, []);

    const confirm = useCallback(({ title, message, onConfirm, type = 'warning' }) => {
        setConfirmState({ title, message, onConfirm, type });
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

            {/* Premium Confirmation Modal */}
            {confirmState && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={closeConfirm}
                    ></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl relative w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-6 flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                                confirmState.type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                            }`}>
                                {confirmState.type === 'danger' ? (
                                    <AlertTriangle className="w-8 h-8" />
                                ) : (
                                    <HelpCircle className="w-8 h-8" />
                                )}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                                {confirmState.title}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                {confirmState.message}
                            </p>
                        </div>

                        <div className="p-6 pt-2 flex gap-3">
                            <button 
                                onClick={closeConfirm}
                                className="flex-1 py-3.5 px-4 rounded-xl text-xs font-black text-slate-400 hover:bg-slate-50 border border-slate-100 transition-all uppercase tracking-widest active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmAction}
                                className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-black text-white shadow-lg transition-all uppercase tracking-widest active:scale-[0.98] ${
                                    confirmState.type === 'danger' 
                                    ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600' 
                                    : 'bg-[#b59662] shadow-[#b59662]/20 hover:bg-[#a68959]'
                                }`}
                            >
                                Confirm
                            </button>
                        </div>

                        <button 
                            onClick={closeConfirm}
                            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
