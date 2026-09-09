import { app, BrowserWindow, ipcMain, dialog, powerMonitor, safeStorage } from 'electron';
import { join } from 'path';
import { autoUpdater } from 'electron-updater';
import { fileURLToPath } from 'url';

// Determine __dirname for ES modules
const __dirname = fileURLToPath(new URL('.', import.meta.url));

process.env.DIST = join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const preload = join(__dirname, 'preload.mjs');

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: join(process.env.PUBLIC, 'favicon.svg'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Wait until ready-to-show to prevent visual flash
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(process.env.DIST, 'index.html'));
  }

  win.once('ready-to-show', () => {
    win?.show();
  });

  // Handle sleep/wake events for Realtime reconnection
  powerMonitor.on('resume', () => {
    console.log('System resumed from sleep.');
    win?.webContents.send('system-resume');
  });

  powerMonitor.on('suspend', () => {
    console.log('System going to sleep.');
    win?.webContents.send('system-suspend');
  });

  // Setup auto-updater
  setupAutoUpdater();
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  setupIPC();
  createWindow();
});

// Secure Storage IPC
function setupIPC() {
  ipcMain.handle('secure-store-set', async (event, key: string, value: string) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value);
      return encrypted.toString('base64');
    }
    return value; // Fallback if encryption unavailable
  });

  ipcMain.handle('secure-store-get', async (event, key: string, encryptedBase64: string) => {
    if (safeStorage.isEncryptionAvailable() && encryptedBase64) {
      try {
        const buffer = Buffer.from(encryptedBase64, 'base64');
        return safeStorage.decryptString(buffer);
      } catch (e) {
        console.error('Failed to decrypt:', e);
        return null;
      }
    }
    return encryptedBase64;
  });

  // Native File Dialog IPC
  ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
    if (!win) return { canceled: true };
    return await dialog.showSaveDialog(win, options);
  });
  
  // PDF Printing IPC
  ipcMain.handle('print-to-pdf', async (event, options) => {
    if (!win) return null;
    try {
      const data = await win.webContents.printToPDF(options || {});
      return data;
    } catch (e) {
      console.error('Failed to print PDF:', e);
      return null;
    }
  });

  // Write file IPC
  ipcMain.handle('fs:writeFile', async (event, filePath: string, data: Uint8Array) => {
    const fs = require('fs');
    try {
      fs.writeFileSync(filePath, data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

function setupAutoUpdater() {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      win?.webContents.send('update-available');
    });

    autoUpdater.on('update-downloaded', () => {
      win?.webContents.send('update-downloaded');
      // Optionally prompt user to restart
    });
  }
}
