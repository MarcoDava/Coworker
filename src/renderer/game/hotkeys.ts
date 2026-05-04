import { useEffect } from 'react';

export type HotkeyConfig = {
  peek: string; // e.g. 'Alt'
  callout: string; // e.g. ' ' (space)
  pause: string; // e.g. 'p'
};

export const DEFAULT_HOTKEYS: HotkeyConfig = { peek: 'Tab', callout: ' ', pause: 'p' };
export const LOOK_MODIFIER_OPTIONS = ['Alt', 'Shift', 'Control', 'Meta', 'CapsLock'] as const;
export type LookModifier = (typeof LOOK_MODIFIER_OPTIONS)[number];

function matchesKey(event: KeyboardEvent, key: string) {
  if (key.length === 1) return event.key.toLowerCase() === key.toLowerCase();
  return event.key === key;
}

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
      if (matchesKey(e, cfg.peek)) { e.preventDefault(); handlers.onPeekDown(); }
      else if (matchesKey(e, cfg.callout)) { e.preventDefault(); handlers.onCallout(); }
      else if (matchesKey(e, cfg.pause)) handlers.onPause();
    };
    const up = (e: KeyboardEvent) => {
      if (matchesKey(e, cfg.peek)) handlers.onPeekUp();
    };
    window.addEventListener('keydown', down, { capture: true });
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down, { capture: true });
      window.removeEventListener('keyup', up);
    };
  }, [cfg, handlers]);
}
