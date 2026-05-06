import { contextBridge, ipcRenderer } from 'electron';

export type CaptureSource = { id: string; name: string; thumbnail: string };
export type ActiveWindowInfo = { title: string; app: string; url?: string };

const api = {
  capture: {
    getSources: (): Promise<CaptureSource[]> => ipcRenderer.invoke('capture:getSources'),
    setProtection: (enabled: boolean): Promise<void> => ipcRenderer.invoke('capture:setProtection', enabled),
  },
  system: {
    idleTime: (): Promise<number> => ipcRenderer.invoke('system:idleTime'),
  },
  activeWindow: {
    start: () => ipcRenderer.invoke('activeWindow:start'),
    stop: () => ipcRenderer.invoke('activeWindow:stop'),
    onUpdate: (cb: (info: ActiveWindowInfo) => void) => {
      const listener = (_e: unknown, info: ActiveWindowInfo) => cb(info);
      ipcRenderer.on('activeWindow:update', listener);
      return () => ipcRenderer.off('activeWindow:update', listener);
    },
  },
  rpc: {
    init: () => ipcRenderer.invoke('rpc:init'),
    update: (payload: { details: string; state: string; endTimestamp?: number }) =>
      ipcRenderer.invoke('rpc:update', payload),
  },
  window: {
    setScreenMode: (active: boolean): Promise<{ active: boolean }> =>
      ipcRenderer.invoke('window:setScreenMode', active),
    onScreenModeEscape: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('window:screenModeEscape', listener);
      return () => ipcRenderer.off('window:screenModeEscape', listener);
    },
    onScreenModeToggleHud: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('window:screenModeToggleHud', listener);
      return () => ipcRenderer.off('window:screenModeToggleHud', listener);
    },
    onToggleMode: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('window:toggleMode', listener);
      return () => ipcRenderer.off('window:toggleMode', listener);
    },
  },
  hotkey: {
    registerPeek: (accelerator: string): Promise<boolean> =>
      ipcRenderer.invoke('hotkey:registerPeek', accelerator),
    onPeek: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('hotkey:peek', listener);
      return () => ipcRenderer.off('hotkey:peek', listener);
    },
  },
  global: {
    onKeyActivity: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('global:keyActivity', listener);
      return () => ipcRenderer.off('global:keyActivity', listener);
    },
  },
};

contextBridge.exposeInMainWorld('coworker', api);

export type CoworkerApi = typeof api;
declare global {
  interface Window {
    coworker: CoworkerApi;
  }
}
