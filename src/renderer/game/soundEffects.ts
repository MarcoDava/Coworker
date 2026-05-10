/**
 * Tiny synthesized SFX via Web Audio. No asset files — frequencies and
 * envelopes are tuned per cue so emotes feel tactile without bloating the
 * bundle. Call `playEmoteBlip` from the send/receive paths.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

type Tone = {
  freq: number;
  durationMs: number;
  /** Optional second tone played just after the first for a "two-note blip". */
  followFreq?: number;
  followOffsetMs?: number;
  type?: OscillatorType;
};

function playTone({ freq, durationMs, followFreq, followOffsetMs = 80, type = 'sine' }: Tone, gain = 0.06): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(gain, now + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(env).connect(c.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.05);

  if (followFreq) {
    const t2 = now + followOffsetMs / 1000;
    const osc2 = c.createOscillator();
    const env2 = c.createGain();
    osc2.type = type;
    osc2.frequency.setValueAtTime(followFreq, t2);
    env2.gain.setValueAtTime(0, t2);
    env2.gain.linearRampToValueAtTime(gain, t2 + 0.008);
    env2.gain.exponentialRampToValueAtTime(0.0001, t2 + durationMs / 1000);
    osc2.connect(env2).connect(c.destination);
    osc2.start(t2);
    osc2.stop(t2 + durationMs / 1000 + 0.05);
  }
}

export function playEmoteSendBlip(): void {
  // Rising two-note "boop" — sender confirmation.
  playTone({ freq: 520, durationMs: 110, followFreq: 780, followOffsetMs: 70, type: 'sine' }, 0.05);
}

export function playEmoteReceiveBlip(): void {
  // Falling two-note "doop" — distinct from send so you know who initiated.
  playTone({ freq: 880, durationMs: 130, followFreq: 660, followOffsetMs: 80, type: 'triangle' }, 0.05);
}
