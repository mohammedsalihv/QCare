import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
    success: "border-emerald-100 bg-white/90 shadow-emerald-500/10",
    error: "border-red-100 bg-white/90 shadow-red-500/10",
    warning: "border-amber-100 bg-white/90 shadow-amber-500/10",
    info: "border-blue-100 bg-white/90 shadow-blue-500/10",
};

const progressBarStyles = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
};

const Notification = ({ message, type = 'info', duration = 5000, onClose }) => {
    const [progress, setProgress] = useState(100);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const startTime = Date.now();
        const endTime = startTime + duration;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;
            const percentage = (remaining / duration) * 100;

            if (percentage <= 0) {
                clearInterval(interval);
                handleClose();
            } else {
                setProgress(percentage);
            }
        }, 10);

        return () => clearInterval(interval);
    }, [duration]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    return (
        <div 
            className={`
                pointer-events-auto relative group overflow-hidden
                flex items-center gap-4 p-4 pr-10 rounded-2xl border backdrop-blur-xl
                transition-all duration-300 ease-out
                ${styles[type]}
                ${isClosing ? 'opacity-0 translate-x-12 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-8'}
                shadow-2xl hover:shadow-3xl
            `}
        >
            <div className="flex-shrink-0">
                <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                    {icons[type]}
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                    {type.charAt(0) + type.slice(1)}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                    {message}
                </p>
            </div>

            <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Progress Bar Container */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100/50">
                <div 
                    className={`h-full transition-all duration-75 linear ${progressBarStyles[type]}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default Notification;
