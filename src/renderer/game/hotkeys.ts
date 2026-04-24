import { useEffect } from 'react';

export type HotkeyConfig = {
  peek: string; // e.g. 'Alt'
  callout: string; // e.g. ' ' (space)
  pause: string; // e.g. 'p'
};

export const DEFAULT_HOTKEYS: HotkeyConfig = { peek: 'Alt', callout: ' ', pause: 'p' };

export function useHotkeys(
  cfg: HotkeyConfig,
  handlers: {
    onPeekDown: () => void;
    onPeekUp: () => void;
    onCallout: () => void;
    onPause: () => void;
  },
) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === cfg.peek) handlers.onPeekDown();
      else if (e.key === cfg.callout) handlers.onCallout();
      else if (e.key.toLowerCase() === cfg.pause.toLowerCase()) handlers.onPause();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === cfg.peek) handlers.onPeekUp();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [cfg, handlers]);
}
