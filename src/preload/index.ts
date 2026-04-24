import { contextBridge, ipcRenderer } from 'electron';

export type CaptureSource = { id: string; name: string; thumbnail: string };
export type ActiveWindowInfo = { title: string; app: string; url?: string };

const api = {
  capture: {
    getSources: (): Promise<CaptureSource[]> => ipcRenderer.invoke('capture:getSources'),
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
  hotkey: {
    registerPeek: (accelerator: string): Promise<boolean> =>
      ipcRenderer.invoke('hotkey:registerPeek', accelerator),
    onPeek: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('hotkey:peek', listener);
      return () => ipcRenderer.off('hotkey:peek', listener);
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
