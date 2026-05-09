import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { LOOK_MODIFIER_OPTIONS, type LookModifier } from './hotkeys';

const LOOK_STORAGE_KEY = 'coworker.lookModifier';

function readLookModifier(): LookModifier {
  if (typeof window === 'undefined') return 'Alt';
  const saved = window.localStorage.getItem(LOOK_STORAGE_KEY);
  if (saved && (LOOK_MODIFIER_OPTIONS as readonly string[]).includes(saved)) return saved as LookModifier;
  return 'Alt';
}

export function useFreeLook(disabled: boolean) {
  const freeLookRef = useRef({ enabled: false, yaw: 0, pitch: 0 });
  const draggingRef = useRef(false);
  const [lookModifier, setLookModifier] = useState<LookModifier>(readLookModifier);
  const [lookHeld, setLookHeld] = useState(false);

  function reset() {
    draggingRef.current = false;
    freeLookRef.current.enabled = false;
    freeLookRef.current.yaw = 0;
    freeLookRef.current.pitch = 0;
  }

  useEffect(() => {
    window.localStorage.setItem(LOOK_STORAGE_KEY, lookModifier);
  }, [lookModifier]);

  useEffect(() => {
    const isInput = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled || e.repeat || isInput(e)) return;
      if (e.key === lookModifier) setLookHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === lookModifier) {
        setLookHeld(false);
        reset();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [disabled, lookModifier]);

  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (!draggingRef.current) return;
      freeLookRef.current.enabled = true;
      freeLookRef.current.yaw -= e.movementX * 0.004;
      freeLookRef.current.pitch = Math.max(-1.1, Math.min(1.1, freeLookRef.current.pitch - e.movementY * 0.0035));
    };
    const onMouseUp = () => {
      draggingRef.current = false;
      if (!lookHeld) reset();
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [lookHeld]);

  function onCanvasMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (disabled || !lookHeld || e.button !== 0) return;
    draggingRef.current = true;
    freeLookRef.current.enabled = true;
  }

  return { freeLookRef, draggingRef, lookModifier, setLookModifier, lookHeld, onCanvasMouseDown, reset };
}
