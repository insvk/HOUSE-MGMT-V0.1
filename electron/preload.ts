import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Secure Storage
  secureStoreSet: (key: string, value: string) => ipcRenderer.invoke('secure-store-set', key, value),
  secureStoreGet: (key: string, encryptedBase64: string) => ipcRenderer.invoke('secure-store-get', key, encryptedBase64),

  // File System Dialog
  showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  
  // Printing to PDF
  printToPDF: (options: any) => ipcRenderer.invoke('print-to-pdf', options),
  
  // Write to File directly
  writeFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('fs:writeFile', filePath, data),

  // Power Monitor Events
  onSystemResume: (callback: () => void) => {
    ipcRenderer.on('system-resume', callback);
    return () => ipcRenderer.removeListener('system-resume', callback);
  },
  onSystemSuspend: (callback: () => void) => {
    ipcRenderer.on('system-suspend', callback);
    return () => ipcRenderer.removeListener('system-suspend', callback);
  },

  // Auto-Updater Events
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  }
});
