import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const variants = {
  success: { label: 'Success', icon: CheckCircle2, accent: 'emerald', Icon: CheckCircle2 },
  error: { label: 'Something went wrong', icon: AlertCircle, accent: 'rose', Icon: AlertCircle },
  warning: { label: 'Attention needed', icon: AlertTriangle, accent: 'amber', Icon: AlertTriangle },
  info: { label: 'QCare update', icon: Info, accent: 'teal', Icon: Info },
};

export default function Notification({ message, type = 'info', duration = 5000, onClose }) {
  const [progress, setProgress] = useState(100);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(null);
  const variant = variants[type] || variants.info;
  const Icon = variant.Icon;
  const close = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => onClose?.(), 180);
  };
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const remaining = Math.max(0, 1 - (Date.now() - start) / duration);
      setProgress(remaining * 100);
      if (!remaining) { clearInterval(timer); close(); }
    }, 80);
    return () => { clearInterval(timer); clearTimeout(closeTimer.current); };
  }, [duration]);
  return <div role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'} className={`pointer-events-auto relative flex w-[min(420px,calc(100vw-32px))] items-start gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 pr-12 text-slate-800 shadow-[0_18px_55px_-18px_rgba(15,40,60,.32)] ring-1 ring-black/[.03] transition duration-200 ${closing ? 'translate-x-4 scale-[.98] opacity-0' : 'animate-in slide-in-from-right-5 fade-in'}`}>
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${type === 'success' ? 'bg-emerald-50 text-emerald-600' : type === 'error' ? 'bg-rose-50 text-rose-600' : type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}><Icon size={20} strokeWidth={2.2}/></span>
    <span className="min-w-0 flex-1 pt-0.5"><span className={`block text-[10px] font-bold uppercase tracking-[.14em] ${type === 'success' ? 'text-emerald-700' : type === 'error' ? 'text-rose-700' : type === 'warning' ? 'text-amber-700' : 'text-teal-700'}`}>{variant.label}</span><span className="mt-1 block break-words text-sm font-semibold leading-5 text-slate-800">{message}</span></span>
    <button type="button" aria-label="Dismiss notification" onClick={close} className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"><X size={16}/></button>
    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-slate-100"><span className={`block h-full origin-left transition-[width] duration-100 ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : type === 'warning' ? 'bg-amber-500' : 'bg-teal-600'}`} style={{width: `${progress}%`}}/></span>
  </div>;
}
