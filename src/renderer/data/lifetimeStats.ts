/**
 * Lifetime focus tracking — accumulates seconds spent in unpaused sessions
 * across all runs. Persists in localStorage so the next launch shows the
 * total ("you've co-worked X hours so far") on the Hero screen.
 */

const KEY_FOCUS_SEC = 'coworker_lifetime_focus_sec_v1';
const KEY_SESSIONS = 'coworker_lifetime_sessions_v1';

export type LifetimeStats = {
  focusSec: number;
  sessions: number;
};

export function loadLifetimeStats(): LifetimeStats {
  return {
    focusSec: parseInt(localStorage.getItem(KEY_FOCUS_SEC) || '0', 10) || 0,
    sessions: parseInt(localStorage.getItem(KEY_SESSIONS) || '0', 10) || 0,
  };
}

export function addFocusSec(seconds: number): void {
  const cur = parseInt(localStorage.getItem(KEY_FOCUS_SEC) || '0', 10) || 0;
  localStorage.setItem(KEY_FOCUS_SEC, String(cur + Math.max(0, Math.floor(seconds))));
}

export function recordSessionCompleted(): void {
  const cur = parseInt(localStorage.getItem(KEY_SESSIONS) || '0', 10) || 0;
  localStorage.setItem(KEY_SESSIONS, String(cur + 1));
}

export function formatFocusDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
