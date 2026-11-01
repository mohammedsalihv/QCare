let context, pending = false, lastPlayed = -Infinity;
export function unlockNotificationSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    if (!context || context.state === 'closed') context = new Audio();
    context.resume().then(() => { if (pending && context.state === 'running') playNotificationSound(); }).catch(() => {});
  } catch { /* Unsupported audio must never interrupt the portal. */ }
}
export function playNotificationSound() {
  if (!context || context.state !== 'running') { pending = true; return; }
  pending = false;
  const now = context.currentTime;
  if (now - lastPlayed < .7) return;
  lastPlayed = now;
  [660, 880].forEach((frequency, i) => {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    const start = now + i * .16;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(.09, start + .025);
    gain.gain.exponentialRampToValueAtTime(.001, start + .24);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + .26);
  });
}
export function cancelPendingSound() { pending = false; }
