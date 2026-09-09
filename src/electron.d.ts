export interface ElectronAPI {
  secureStoreSet: (key: string, value: string) => Promise<string>;
  secureStoreGet: (key: string, encryptedBase64: string) => Promise<string | null>;
  showSaveDialog: (options: any) => Promise<any>;
  printToPDF: (options: any) => Promise<Uint8Array | null>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<{ success: boolean; error?: string }>;
  onSystemResume: (callback: () => void) => () => void;
  onSystemSuspend: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: () => void) => () => void;
  onUpdateDownloaded: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
