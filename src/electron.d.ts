export interface ElectronAPI {
  query: <T = unknown>(args: { table: string, action: string, data?: unknown, query?: unknown, mode?: string }) => Promise<T>;
  login: <T = unknown>(credentials: { email: string, password: string, mode?: string }) => Promise<T>;
  backupDatabase: (args: { mode: string }) => Promise<{ success: boolean, path?: string, error?: string, cancelled?: boolean }>;
  restoreDatabase: (args: { mode: string }) => Promise<{ success: boolean, error?: string, cancelled?: boolean }>;
  setTitleBarColor: (colors: { color: string, symbolColor: string }) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
