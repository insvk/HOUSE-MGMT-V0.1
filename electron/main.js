const { app, BrowserWindow, ipcMain, dialog, powerMonitor, safeStorage } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win = null;
const preload = path.join(__dirname, 'preload.js');

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(process.env.PUBLIC, 'favicon.svg'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  win.once('ready-to-show', () => {
    win?.show();
  });

  powerMonitor.on('resume', () => {
    win?.webContents.send('system-resume');
  });

  powerMonitor.on('suspend', () => {
    win?.webContents.send('system-suspend');
  });

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

function setupIPC() {
  ipcMain.handle('secure-store-set', async (event, key, value) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value);
      return encrypted.toString('base64');
    }
    return value;
  });

  ipcMain.handle('secure-store-get', async (event, key, encryptedBase64) => {
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

  ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
    if (!win) return { canceled: true };
    return await dialog.showSaveDialog(win, options);
  });
  
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

  ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
    const fs = require('fs');
    try {
      fs.writeFileSync(filePath, data);
      return { success: true };
    } catch (error) {
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
    });
  }
}
