import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './UserMessage.css';

const variants = {
  success: { title: 'Completed successfully', Icon: CheckCircle2 },
  error: { title: 'Unable to complete', Icon: AlertCircle },
  warning: { title: 'Your attention is needed', Icon: AlertTriangle },
  info: { title: 'A new update', Icon: Info },
};

/** Standalone feedback card. duration <= 0 keeps it visible until dismissed. */
export default function UserMessage({ message, type = 'info', title, duration = 5000, onClose }) {
  const tone = variants[type] ? type : 'info';
  const { Icon, title: defaultTitle } = variants[tone];
  const [closing, setClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const callback = useRef(onClose);
  const closingRef = useRef(false);
  const exitTimer = useRef(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  useEffect(() => { callback.current = onClose; }, [onClose]);
  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    exitTimer.current = setTimeout(() => callback.current?.(), 220);
  }, []);
  useEffect(() => {
    if (!(duration > 0)) return;
    let elapsed = 0, previous = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      if (!hovered.current && !focused.current && !document.hidden && !closingRef.current) {
        elapsed += now - previous;
        setProgress(Math.max(0, 100 * (1 - elapsed / duration)));
        if (elapsed >= duration) dismiss();
      }
      previous = now;
    }, 80);
    return () => clearInterval(timer);
  }, [duration, dismiss]);
  useEffect(() => () => clearTimeout(exitTimer.current), []);
  return <article className={`qc-message ${closing ? 'qc-message--closing' : ''}`} data-tone={tone}
    role={tone === 'error' ? 'alert' : 'status'} aria-atomic="true"
    onMouseEnter={() => { hovered.current = true; }} onMouseLeave={() => { hovered.current = false; }}
    onFocusCapture={() => { focused.current = true; }} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) focused.current = false; }}>
    <span className="qc-message__light" aria-hidden="true" />
    <span className="qc-message__icon" aria-hidden="true"><Icon size={23} strokeWidth={1.8}/></span>
    <div className="qc-message__body"><span className="qc-message__eyebrow">QCare <i/> {tone === 'success' ? 'Success' : tone === 'error' ? 'Error' : tone === 'warning' ? 'Attention' : 'Update'}</span><strong className="qc-message__title">{title || defaultTitle}</strong><p className="qc-message__text">{message}</p></div>
    <button className="qc-message__close" type="button" aria-label="Dismiss notification" onClick={dismiss}><X size={17}/></button>
    {duration > 0 && <span className="qc-message__track" aria-hidden="true"><span style={{ transform: `scaleX(${progress / 100})` }}/></span>}
  </article>;
}
