import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unreadArrivals } from './notificationArrival.js';
import { playNotificationSound, unlockNotificationSound, cancelPendingSound } from './notificationSound.js';

test('unread login summary and new arrivals do not repeat on subsequent polls', () => {
  const feed = [{ _id: 'request', isRead: false }, { _id: 'old', isRead: true }];
  assert.deepEqual(unreadArrivals(feed, null).map(n => n._id), ['request']);
  const seen = new Set(feed.map(n => n._id));
  assert.deepEqual(unreadArrivals(feed, seen), []);
  assert.deepEqual(unreadArrivals([...feed, { _id: 'approval', isRead: false }], seen).map(n => n._id), ['approval']);
  assert.equal(unreadArrivals([], null).length, 0);
});

test('audio queues until interaction, cancels muted pending sounds, and coalesces bursts', async () => {
  let starts = 0, audio;
  class AudioMock {
    constructor() { audio = this; this.state = 'suspended'; this.currentTime = 1; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createOscillator() { return { frequency: {}, connect() {}, disconnect() {}, start() { starts++; }, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  globalThis.window = { AudioContext: AudioMock };
  try {
    playNotificationSound(); assert.equal(starts, 0);
    unlockNotificationSound(); await Promise.resolve(); assert.equal(starts, 2);
    playNotificationSound(); assert.equal(starts, 2);
    audio.state = 'suspended'; audio.currentTime = 3;
    playNotificationSound(); cancelPendingSound();
    unlockNotificationSound(); await Promise.resolve(); assert.equal(starts, 2);
    playNotificationSound(); assert.equal(starts, 4);
  } finally { delete globalThis.window; }
});
