let context, pending = false;
export function unlockNotificationSound() {
 const Audio = window.AudioContext || window.webkitAudioContext;
 if (!Audio) return;
 context ||= new Audio();
 context.resume().then(() => { if (pending) { pending = false; playNotificationSound(); } }).catch(() => {});
}
export function playNotificationSound() {
 if (!context || context.state !== 'running') { pending = true; return; }
 const now = context.currentTime;
 [660, 880].forEach((frequency, i) => {
  const oscillator = context.createOscillator(), gain = context.createGain();
  oscillator.type = 'sine'; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, now + i * .12);
  gain.gain.linearRampToValueAtTime(.035, now + i * .12 + .015);
  gain.gain.exponentialRampToValueAtTime(.001, now + i * .12 + .15);
  oscillator.connect(gain); gain.connect(context.destination);
  oscillator.start(now + i * .12); oscillator.stop(now + i * .12 + .17);
 });
}
export function cancelPendingSound() { pending = false; }
