
export interface GithubConfig {
  token: string;
  repo: string;
  path: string;
}

export interface SyncStatus {
  state: 'idle' | 'checking' | 'downloading' | 'uploading' | 'ready' | 'error' | 'dirty';
  message?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export enum Language {
  EN = 'en',
  ZH = 'zh'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export type ViewType = 'tables' | 'sql' | 'settings';

export interface AppState {
  config: GithubConfig | null;
  dbReady: boolean;
  syncStatus: SyncStatus;
  currentTable: string | null;
  currentView: ViewType;
  hasUnsavedChanges: boolean;
}
