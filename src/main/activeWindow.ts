import type { Result as ActiveWinResult } from 'active-win';

export type ActiveWindowInfo = {
  title: string;
  app: string;
  url?: string;
};

let timer: NodeJS.Timeout | null = null;

export function startActiveWindowPolling(
  onUpdate: (info: ActiveWindowInfo) => void,
  intervalMs = 1500,
) {
  if (timer) return;
  const tick = async () => {
    try {
      const mod = await import('active-win');
      const res = (await mod.default()) as ActiveWinResult | undefined;
      if (res) {
        onUpdate({
          title: res.title,
          app: res.owner?.name ?? 'unknown',
          url: (res as unknown as { url?: string }).url,
        });
      }
    } catch {
      // ignore — permissions denied on macOS etc.
    }
  };
  tick();
  timer = setInterval(tick, intervalMs);
}

export function stopActiveWindowPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
