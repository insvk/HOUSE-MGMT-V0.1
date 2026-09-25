const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  secureStoreSet: (key, value) => ipcRenderer.invoke('secure-store-set', key, value),
  secureStoreGet: (key, encryptedBase64) => ipcRenderer.invoke('secure-store-get', key, encryptedBase64),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  dbQuery: (queryText, values) => ipcRenderer.invoke('db:query', queryText, values),
  onSystemResume: (callback) => {
    ipcRenderer.on('system-resume', callback);
    return () => ipcRenderer.removeListener('system-resume', callback);
  },
  onSystemSuspend: (callback) => {
    ipcRenderer.on('system-suspend', callback);
    return () => ipcRenderer.removeListener('system-suspend', callback);
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  }
});
