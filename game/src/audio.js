// Sizzle & Serve — sounds: tiny WebAudio synth, no audio files.
// Every effect is an oscillator or filtered noise built at runtime.

let context = null;

function audioContext() {
  if (context) return context;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
}

/** One short tone: frequency, seconds, shape, volume. */
export function beep(frequency, seconds, type = 'sine', volume = 0.12) {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + seconds);
}

/** A burst of filtered noise, for the grill sizzle and the trash thud. */
export function noiseBurst(seconds, filterFrequency, volume = 0.08) {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFrequency;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

export const SOUNDS = {
  add() { beep(520, 0.08, 'triangle', 0.1); },
  grill() { noiseBurst(0.35, 3200, 0.09); },
  ready() { beep(880, 0.12, 'sine', 0.1); beep(1320, 0.15, 'sine', 0.07); },
  serve() { beep(660, 0.1, 'triangle', 0.12); setTimeout(() => beep(990, 0.16, 'triangle', 0.12), 90); },
  wrong() { beep(180, 0.22, 'sawtooth', 0.08); },
  trash() { noiseBurst(0.15, 500, 0.1); },
  tick() { beep(1200, 0.05, 'square', 0.05); },
  win() { [523, 659, 784, 1047].forEach((note, i) => setTimeout(() => beep(note, 0.2, 'triangle', 0.12), i * 120)); },
};

/** Play a named effect unless the player muted the game. */
export function playSound(state, name) {
  if (state.muted) return;
  const effect = SOUNDS[name];
  if (effect) effect();
}
