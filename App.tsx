
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { GithubConfig, AppState, Language, TableInfo, ViewType, Theme } from './types';
import { I18N, ICONS } from './constants';
import DynamicForm from './components/DynamicForm';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import SqlTerminal from './components/SqlTerminal';
import { ToastContainer, Toast, ToastType } from './components/Toast';
import { initSQLite, executeQuery, getTables, getTableInfo, exportDatabase, importDatabase, isOpfsSupported } from './services/sqliteService';
import { GitHubService } from './services/githubService';

const PAGE_SIZE = 50;

const App: React.FC = () => {
  // App State Initialization
  const [state, setState] = useState<AppState>(() => {
    const savedConfig = localStorage.getItem('gitdb_config');
    let config = null;
    if (savedConfig) {
      try { config = JSON.parse(savedConfig); } 
      catch (e) { localStorage.removeItem('gitdb_config'); }
    }
    return {
      config,
      dbReady: false,
      syncStatus: { state: 'idle' },
      currentTable: null,
      currentView: 'tables',
      hasUnsavedChanges: false
    };
  });

  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('gitdb_lang') as Language) || Language.EN);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('gitdb_theme') as Theme) || Theme.SYSTEM);
  const [tables, setTables] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentTableInfo, setCurrentTableInfo] = useState<TableInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const githubServiceRef = useRef<GitHubService | null>(null);
  const t = I18N[lang];

  const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Prevent accidental exit if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = t.warnings.unsaved_exit;
        return t.warnings.unsaved_exit;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges, t.warnings.unsaved_exit]);

  // Loader cleanup
  useEffect(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) loader.style.display = 'none';
  }, []);

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('gitdb_theme', theme);
    const applyTheme = (t: Theme) => {
      root.classList.remove('light', 'dark');
      if (t === Theme.SYSTEM) {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(t);
      }
    };
    applyTheme(theme);
    if (theme === Theme.SYSTEM) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme(Theme.SYSTEM);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleLanguage = () => {
    const newLang = lang === Language.EN ? Language.ZH : Language.EN;
    setLang(newLang);
    localStorage.setItem('gitdb_lang', newLang);
  };

  const cycleTheme = () => {
    const themes = [Theme.LIGHT, Theme.DARK, Theme.SYSTEM];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const handleAuthConfig = (config: GithubConfig) => {
    localStorage.setItem('gitdb_config', JSON.stringify(config));
    setState(prev => ({ ...prev, config }));
    window.location.reload(); 
  };

  const syncDatabase = useCallback(async () => {
    if (!state.config) {
      try {
        await initSQLite();
        setState(prev => ({ ...prev, dbReady: true, syncStatus: { state: 'idle' } }));
        refreshTables();
      } catch (dbErr: any) { setInitError("Local database failed: " + dbErr.message); }
      return;
    }
    setState(prev => ({ ...prev, syncStatus: { state: 'checking', message: t.status.checking } }));
    try {
      const service = new GitHubService(state.config);
      githubServiceRef.current = service;
      const remoteMeta = await service.getFileMetadata(state.config.path);
      const localSha = localStorage.getItem('gitdb_sha');
      if (remoteMeta && remoteMeta.sha !== localSha) {
        setState(prev => ({ ...prev, syncStatus: { state: 'downloading', message: t.status.downloading } }));
        const remoteData = await service.downloadFile(state.config.path);
        await importDatabase(remoteData);
        localStorage.setItem('gitdb_sha', remoteMeta.sha);
      } else { await initSQLite(); }
      setState(prev => ({ ...prev, dbReady: true, syncStatus: { state: 'ready' }, hasUnsavedChanges: false }));
      refreshTables();
    } catch (error: any) {
      setState(prev => ({ ...prev, syncStatus: { state: 'error', message: error.message } }));
      try {
        await initSQLite();
        setState(prev => ({ ...prev, dbReady: true }));
        refreshTables();
      } catch (dbErr: any) { setInitError("Database failed: " + dbErr.message); }
    }
  }, [state.config, t.status]);

  useEffect(() => { if (!state.dbReady && !initError) syncDatabase(); }, [state.dbReady, syncDatabase, initError]);

  const refreshTables = () => {
    try {
      const tableList = getTables();
      setTables(tableList);
      if (tableList.length > 0 && !state.currentTable) loadTable(tableList[0].name);
    } catch (e) { console.error("Table refresh failed", e); }
  };

  const loadTable = (tableName: string, page: number = 0) => {
    try {
      const colInfo = getTableInfo(tableName);
      const offset = page * PAGE_SIZE;
      const tableData = executeQuery(`SELECT * FROM "${tableName}" LIMIT ${PAGE_SIZE} OFFSET ${offset}`);
      const countRes = executeQuery(`SELECT COUNT(*) as count FROM "${tableName}"`);
      
      setTotalRows(countRes[0]?.count || 0);
      setCurrentPage(page);
      setRows(tableData);
      setCurrentTableInfo({ name: tableName, columns: colInfo });
      setState(prev => ({ ...prev, currentTable: tableName, currentView: 'tables' }));
      setIsEditing(false);
    } catch (e) { console.error("Table load failed", e); }
  };

  const handleSaveRow = (data: any) => {
    if (!state.currentTable || !currentTableInfo) return;
    const columns = currentTableInfo.columns.map(c => c.name);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(c => data[c]);
    try {
      if (editingRow) {
        const pkCol = currentTableInfo.columns.find(c => c.pk === 1);
        if (pkCol) {
          const updateStr = columns.map(c => `"${c}" = ?`).join(', ');
          executeQuery(`UPDATE "${state.currentTable}" SET ${updateStr} WHERE "${pkCol.name}" = ?`, [...values, editingRow[pkCol.name]]);
        }
      } else {
        executeQuery(`INSERT INTO "${state.currentTable}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`, values);
      }
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
      loadTable(state.currentTable, currentPage);
      showToast(lang === Language.EN ? "Record saved successfully" : "记录保存成功", 'success');
    } catch (err: any) { 
      showToast((lang === Language.EN ? "Database error: " : "数据库错误: ") + err.message, 'error');
    }
  };

  const handleDeleteRow = (row: any) => {
    if (!state.currentTable || !currentTableInfo) return;
    const pkCol = currentTableInfo.columns.find(c => c.pk === 1);
    if (!pkCol || !confirm("Delete this record?")) return;
    try {
      executeQuery(`DELETE FROM "${state.currentTable}" WHERE "${pkCol.name}" = ?`, [row[pkCol.name]]);
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
      loadTable(state.currentTable, currentPage);
      showToast(lang === Language.EN ? "Record deleted successfully" : "记录删除成功", 'success');
    } catch (err: any) { 
      showToast((lang === Language.EN ? "Delete failed: " : "删除失败: ") + err.message, 'error');
    }
  };

  const pushToGitHub = async () => {
    if (!state.config || !githubServiceRef.current) { setView('settings'); return; }
    setState(prev => ({ ...prev, syncStatus: { state: 'uploading', message: t.status.saving } }));
    try {
      const data = exportDatabase();
      const currentMeta = await githubServiceRef.current.getFileMetadata(state.config.path);
      const sha = currentMeta?.sha;
      const response = await githubServiceRef.current.uploadFile(state.config.path, data, sha);
      localStorage.setItem('gitdb_sha', response.content.sha);
      setState(prev => ({ ...prev, syncStatus: { state: 'ready' }, hasUnsavedChanges: false }));
      showToast(lang === Language.EN ? "Successfully pushed to GitHub!" : "成功推送到 GitHub！", 'success');
    } catch (err: any) {
      setState(prev => ({ ...prev, syncStatus: { state: 'error', message: err.message } }));
      showToast((lang === Language.EN ? "Push failed: " : "推送失败: ") + err.message, 'error');
    }
  };

  const resetConfig = () => {
    if (confirm("Reset connection settings?")) { localStorage.clear(); window.location.reload(); }
  };

  const setView = (view: ViewType) => setState(prev => ({ ...prev, currentView: view }));

  const markDirty = () => setState(prev => ({ ...prev, hasUnsavedChanges: true }));

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-dark p-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 max-w-md w-full text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Initialization Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm font-mono">{initError}</p>
          <div className="space-y-3">
            <button onClick={() => window.location.reload()} className="w-full bg-primary text-white py-2 rounded-lg font-bold">Retry</button>
            <button onClick={resetConfig} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-sm font-bold">Clear Config</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      <Sidebar 
        currentView={state.currentView}
        currentTable={state.currentTable}
        tables={tables}
        lang={lang}
        onViewChange={setView}
        onTableSelect={(name) => loadTable(name, 0)}
        onSync={pushToGitHub}
        syncing={state.syncStatus.state === 'uploading'}
        onRefresh={refreshTables}
        hasUnsavedChanges={state.hasUnsavedChanges}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-4 min-w-0">
            <h2 className="text-lg font-black truncate tracking-tighter text-gray-800 dark:text-gray-100 uppercase">
              {state.currentView === 'tables' ? (state.currentTable || t.nav.browser) : state.currentView === 'sql' ? t.nav.sql : t.nav.settings}
            </h2>
            {state.hasUnsavedChanges && (
               <span className="flex items-center space-x-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] rounded-full font-black uppercase tracking-tighter">
                 {ICONS.Warning}
                 <span>{t.nav.unsaved}</span>
               </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-3">
             <button onClick={cycleTheme} className="p-2 text-gray-400 hover:text-primary transition-colors flex items-center space-x-1.5" title={t.theme[theme]}>
                {theme === Theme.LIGHT ? ICONS.Sun : theme === Theme.DARK ? ICONS.Moon : ICONS.Monitor}
             </button>
             <div className="h-4 w-px bg-gray-100 dark:bg-gray-700 mx-1"></div>
             <button onClick={toggleLanguage} className="text-[11px] font-black text-gray-400 hover:text-primary p-2 uppercase tracking-widest">
                {lang === Language.EN ? '中文' : 'EN'}
             </button>
             {state.currentView === 'tables' && state.currentTable && (
               <button onClick={() => { setIsEditing(true); setEditingRow(null); }} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 flex items-center space-x-2">
                  {ICONS.Plus}
                  <span className="hidden sm:inline">{t.actions.new_record}</span>
               </button>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50/50 dark:bg-dark/40 custom-scrollbar">
          {state.currentView === 'settings' ? (
            <SettingsView config={state.config} lang={lang} onUpdate={handleAuthConfig} />
          ) : state.currentView === 'sql' ? (
            <SqlTerminal lang={lang} onMutation={markDirty} />
          ) : isEditing && currentTableInfo ? (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-6 flex items-center space-x-2 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                 <button onClick={() => setIsEditing(false)} className="hover:text-primary transition-colors hover:underline">{t.nav.browser}</button>
                 <span>/</span>
                 <span className="text-gray-900 dark:text-gray-100">{editingRow ? t.actions.edit : t.actions.new_record}</span>
               </div>
               <DynamicForm columns={currentTableInfo.columns} initialData={editingRow} lang={lang} onSave={handleSaveRow} onCancel={() => setIsEditing(false)} />
            </div>
          ) : state.currentTable ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="overflow-auto custom-scrollbar flex-1">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        {currentTableInfo?.columns.map(col => (
                          <th key={col.name} className="px-6 py-4 font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter text-[10px]">
                            <div className="flex items-center space-x-1.5">
                              <span>{col.name}</span>
                              {col.pk === 1 && <span className="text-[8px] bg-yellow-400/20 text-yellow-600 px-1.5 py-0.5 rounded font-black tracking-widest">PK</span>}
                            </div>
                          </th>
                        ))}
                        <th className="px-6 py-4 text-right uppercase tracking-tighter font-black text-gray-400 text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {rows.length === 0 ? (
                        <tr><td colSpan={100} className="px-6 py-24 text-center text-gray-300 italic">{t.empty.no_rows}</td></tr>
                      ) : rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                          {currentTableInfo?.columns.map(col => (
                            <td key={col.name} className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 mono text-[12px] group-hover:text-gray-900 dark:group-hover:text-gray-100">
                              {row[col.name]?.toString() ?? <span className="text-gray-200 dark:text-gray-700 italic opacity-40">null</span>}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1 sm:opacity-0 group-hover:opacity-100">
                              <button onClick={() => { setEditingRow(row); setIsEditing(true); }} className="text-gray-400 hover:text-primary p-2 rounded-xl hover:bg-primary/10 transition-all">{ICONS.Edit}</button>
                              <button onClick={() => handleDeleteRow(row)} className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">{ICONS.Trash}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination UI */}
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-gray-400">
                <div className="flex items-center space-x-2">
                  <span>Total: {totalRows}</span>
                  <span className="opacity-30">|</span>
                  <span>Page {currentPage + 1} of {Math.ceil(totalRows / PAGE_SIZE)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    disabled={currentPage === 0} 
                    onClick={() => loadTable(state.currentTable!, currentPage - 1)}
                    className="px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:text-primary disabled:opacity-30 transition-all"
                  >Previous</button>
                  <button 
                    disabled={(currentPage + 1) * PAGE_SIZE >= totalRows} 
                    onClick={() => loadTable(state.currentTable!, currentPage + 1)}
                    className="px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:text-primary disabled:opacity-30 transition-all"
                  >Next</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-8 animate-in zoom-in-95 duration-700">
               <div className="p-12 bg-white dark:bg-gray-800 rounded-full text-primary/10 shadow-inner border border-gray-50 dark:border-gray-700">
                  {!state.config ? ICONS.Rocket : ICONS.Database}
               </div>
               <div className="text-center max-w-xs space-y-3">
                  <p className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-[0.3em]">{!state.config ? t.empty.welcome_title : t.empty.explorer_title}</p>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium">{!state.config ? t.empty.welcome_desc : t.empty.explorer_desc}</p>
                  {!state.config && <button onClick={() => setView('settings')} className="mt-4 bg-primary text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">{t.actions.get_started}</button>}
               </div>
            </div>
          )}
        </div>
        
        <footer className="px-8 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-[9px] text-gray-400 uppercase tracking-[0.2em] font-black shrink-0 transition-colors">
           <div className="flex items-center space-x-8">
              <span className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${!state.config ? 'bg-gray-300' : (state.dbReady ? 'bg-green-500' : 'bg-red-500')}`}></span>
                <span className={!state.config ? 'text-gray-400' : (state.dbReady ? 'text-green-600' : 'text-red-600')}>{!state.config ? t.status.unconfigured : (state.dbReady ? 'READY' : 'OFFLINE')}</span>
              </span>
              {state.config && <><span className="hidden lg:inline bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">SHA: {localStorage.getItem('gitdb_sha')?.substring(0, 8) || 'INITIAL'}</span>{!isOpfsSupported() && <span className="text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">MEM_MODE</span>}</>}
           </div>
           {state.config && <div className="truncate max-w-[300px] font-mono lowercase opacity-50 hover:opacity-100 transition-opacity">{state.config?.repo}:{state.config?.path}</div>}
        </footer>
      </main>

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }`}</style>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default App;
