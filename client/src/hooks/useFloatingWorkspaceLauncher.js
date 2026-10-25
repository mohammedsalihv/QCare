import { useEffect, useRef, useState } from 'react';

const defaultPosition = { side: 'right', fraction: 0.45 };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function readPosition(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (['left', 'right'].includes(value?.side) && Number.isFinite(value.fraction)) {
      return { side: value.side, fraction: clamp(value.fraction, 0, 1) };
    }
  } catch { /* Position preferences are optional when storage is unavailable. */ }
  return defaultPosition;
}

function boundsFor(element) {
  const rect = element.getBoundingClientRect();
  const css = window.getComputedStyle(element);
  const inset = edge => Math.max(12, parseFloat(css.getPropertyValue('--qc-launcher-safe-' + edge)) || 0);
  return {
    minX: inset('left'), maxX: Math.max(inset('left'), window.innerWidth - rect.width - inset('right')),
    minY: inset('top'), maxY: Math.max(inset('top'), window.innerHeight - rect.height - inset('bottom')),
    width: rect.width,
  };
}

export default function useFloatingWorkspaceLauncher(userId, onOpen) {
  const storageKey = 'qcare.workspace-launcher.position:' + (userId || 'guest');
  const [position, setPosition] = useState(() => readPosition(storageKey));
  const [drag, setDrag] = useState(null);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const button = useRef(null);
  const commit = next => {
    setPosition(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the current-session preference. */ }
  };
  const cancelGesture = () => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.moved) suppressClick.current = true;
    setDrag(null);
    if (current && button.current?.hasPointerCapture(current.id)) button.current.releasePointerCapture(current.id);
  };
  useEffect(() => {
    // CSS keeps the docked position in bounds after a resize or orientation change.
    const resize = () => {
      const current = gesture.current;
      gesture.current = null;
      if (current?.moved) suppressClick.current = true;
      setDrag(null);
      if (current && button.current?.hasPointerCapture(current.id)) button.current.releasePointerCapture(current.id);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const onPointerDown = event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    const rect = event.currentTarget.getBoundingClientRect();
    gesture.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false, bounds: boundsFor(event.currentTarget) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = event => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) < 6) return;
    event.preventDefault();
    current.moved = true;
    suppressClick.current = true;
    current.lastLeft = clamp(current.left + dx, current.bounds.minX, current.bounds.maxX);
    current.lastTop = clamp(current.top + dy, current.bounds.minY, current.bounds.maxY);
    setDrag({ left: current.lastLeft, top: current.lastTop });
  };
  const onPointerUp = event => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    gesture.current = null;
    if (current.moved) {
      const { minY, maxY, width } = current.bounds;
      commit({ side: current.lastLeft + width / 2 < window.innerWidth / 2 ? 'left' : 'right', fraction: maxY > minY ? clamp((current.lastTop - minY) / (maxY - minY), 0, 1) : 0 });
    }
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onKeyDown = event => {
    if (event.key === 'Escape' && gesture.current) { event.preventDefault(); cancelGesture(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    cancelGesture();
    const bounds = boundsFor(event.currentTarget);
    const step = (event.shiftKey ? 64 : 24) / Math.max(1, bounds.maxY - bounds.minY);
    const next = { ...position };
    if (event.key === 'ArrowLeft') next.side = 'left';
    if (event.key === 'ArrowRight') next.side = 'right';
    if (event.key === 'ArrowUp') next.fraction = clamp(next.fraction - step, 0, 1);
    if (event.key === 'ArrowDown') next.fraction = clamp(next.fraction + step, 0, 1);
    if (event.key === 'Home') next.fraction = 0;
    if (event.key === 'End') next.fraction = 1;
    commit(next);
  };
  return {
    side: position.side,
    dragging: Boolean(drag),
    buttonProps: {
      ref: button,
      'data-side': position.side,
      style: { '--qc-launcher-fraction': position.fraction, ...(drag ? { left: drag.left, top: drag.top, right: 'auto' } : {}) },
      onPointerDown, onPointerMove, onPointerUp,
      onPointerCancel: cancelGesture,
      onLostPointerCapture: () => { if (gesture.current) cancelGesture(); },
      onKeyDown,
      onClick: event => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; event.preventDefault(); return; }
        suppressClick.current = false;
        onOpen();
      },
      onDragStart: event => event.preventDefault(),
    },
  };
}
