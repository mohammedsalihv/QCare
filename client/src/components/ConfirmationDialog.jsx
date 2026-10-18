import { useEffect, useRef } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export default function ConfirmationDialog({ state, onCancel, onConfirm }) {
  const dialog = useRef(null);
  const danger = state.type === 'danger';
  useEffect(() => {
    const element = dialog.current;
    if (!element.open) element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className="qc-confirm-dialog" aria-labelledby="qc-confirm-title" aria-describedby="qc-confirm-message" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <button type="button" className="qc-confirm-close" aria-label="Close confirmation" onClick={onCancel}><X size={19} /></button>
    <div className={`qc-confirm-symbol ${danger ? 'danger' : ''}`}>{danger ? <AlertTriangle size={26} /> : <HelpCircle size={26} />}</div>
    <h2 id="qc-confirm-title">{state.title}</h2><p id="qc-confirm-message">{state.message}</p>
    <div className="qc-confirm-actions"><button type="button" autoFocus onClick={onCancel}>{state.cancelLabel || 'Cancel'}</button><button type="button" className={danger ? 'danger' : 'primary'} onClick={onConfirm}>{state.confirmLabel || 'Confirm'}</button></div>
  </dialog>;
}
