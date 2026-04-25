import { app, BrowserWindow, desktopCapturer, ipcMain, powerMonitor, session, globalShortcut } from 'electron';
import { join } from 'path';
import { startActiveWindowPolling, stopActiveWindowPolling } from './activeWindow';
import { initRichPresence, updateRichPresence, destroyRichPresence } from './rpc';

let mainWindow: BrowserWindow | null = null;
let screenModeActive = false;

function unregisterScreenModeShortcuts() {
  globalShortcut.unregister('Escape');
  globalShortcut.unregister('CommandOrControl+Shift+H');
}

function registerScreenModeShortcuts() {
  unregisterScreenModeShortcuts();
  globalShortcut.register('Escape', () => {
    mainWindow?.webContents.send('window:screenModeEscape');
  });
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    mainWindow?.webContents.send('window:screenModeToggleHud');
  });
}

function setScreenMode(active: boolean) {
  if (!mainWindow) return;
  screenModeActive = active;

  if (active) {
    registerScreenModeShortcuts();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    mainWindow.setFocusable(false);
    mainWindow.blur();
  } else {
    unregisterScreenModeShortcuts();
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setVisibleOnAllWorkspaces(false);
    mainWindow.setFocusable(true);
    mainWindow.focus();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      cb({ video: sources[0], audio: 'loopback' });
    });
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

ipcMain.handle('capture:getSources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
  }));
});

ipcMain.handle('system:idleTime', () => powerMonitor.getSystemIdleTime());

ipcMain.handle('activeWindow:start', (e) => {
  startActiveWindowPolling((info) => {
    e.sender.send('activeWindow:update', info);
  });
});
ipcMain.handle('activeWindow:stop', () => stopActiveWindowPolling());

ipcMain.handle('rpc:init', () => initRichPresence());
ipcMain.handle('rpc:update', (_e, payload: { details: string; state: string; endTimestamp?: number }) =>
  updateRichPresence(payload),
);

ipcMain.handle('window:setScreenMode', (_e, active: boolean) => {
  setScreenMode(active);
  return { active: screenModeActive };
});

ipcMain.handle('hotkey:registerPeek', (e, accelerator: string) => {
  try {
    globalShortcut.register(accelerator, () => e.sender.send('hotkey:peek'));
    return true;
  } catch {
    return false;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopActiveWindowPolling();
  destroyRichPresence();
  if (process.platform !== 'darwin') app.quit();
});
