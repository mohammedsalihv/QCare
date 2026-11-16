import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Native modal dialogs make the rest of the document inert. Keep notifications
// inside the active dialog so they remain visible, readable and dismissible.
export default function ToastOutlet({ children }) {
  const [host, setHost] = useState(document.body);
  useEffect(() => {
    const update = () => setHost([...document.querySelectorAll('dialog[open]')].at(-1) || document.body);
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, []);
  return createPortal(<div className="qc-message-stack">{children}</div>, host);
}
