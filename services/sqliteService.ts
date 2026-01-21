
import initSqlite3 from '@sqlite.org/sqlite-wasm';

let sqlite3: any = null;
let db: any = null;

/**
 * 等待 crossOriginIsolated 环境准备就绪
 * Service Worker 可能需要一些时间才能激活并设置正确的 COOP/COEP 头
 */
const waitForCrossOriginIsolated = async (maxWait = 3000): Promise<boolean> => {
  // 如果已经准备好了，直接返回
  if (typeof window !== 'undefined' && window.crossOriginIsolated) {
    return true;
  }

  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.crossOriginIsolated) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(checkInterval);
        console.warn(`crossOriginIsolated not available after ${maxWait}ms`);
        resolve(false);
      }
    }, 100);
  });
};

export const isOpfsSupported = () => {
  return typeof window !== 'undefined' &&
         window.crossOriginIsolated === true &&
         typeof SharedArrayBuffer !== 'undefined' && 
         'storage' in navigator && 
         'getDirectory' in navigator.storage;
};

export const initSQLite = async () => {
  if (db) return db;

  try {
    // 等待 crossOriginIsolated 环境准备就绪
    // Service Worker 可能需要时间激活
    const isCrossOriginIsolated = await waitForCrossOriginIsolated();
    
    // Check for SharedArrayBuffer which is required for OPFS workers
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn("SharedArrayBuffer not available. OPFS persistence might fail. Ensure COOP/COEP headers are set.");
    }

    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      console.warn("crossOriginIsolated is false. OPFS may not work. Ensure Service Worker is active and COOP/COEP headers are set.");
    }

    // Fixed: initSqlite3 expects 0 arguments.
    sqlite3 = await initSqlite3();
    
    console.log("SQLite3 loaded version:", sqlite3.version.libVersion);

    // 检查 OPFS 支持情况
    const opfsSupported = isOpfsSupported();
    
    if (opfsSupported && 'oo1' in sqlite3 && 'OpfsDb' in sqlite3.oo1) {
      try {
        db = new sqlite3.oo1.OpfsDb('/gitdb_data.db');
        console.log("Storage: OPFS persistence active");
      } catch (opfsError: any) {
        console.warn("Failed to create OpfsDb, falling back to in-memory:", opfsError.message);
        db = new sqlite3.oo1.DB();
      }
    } else {
      const reasons: string[] = [];
      if (typeof window === 'undefined' || !window.crossOriginIsolated) {
        reasons.push("crossOriginIsolated is false");
      }
      if (typeof SharedArrayBuffer === 'undefined') {
        reasons.push("SharedArrayBuffer not available");
      }
      if (!('storage' in navigator && 'getDirectory' in navigator.storage)) {
        reasons.push("OPFS API not available");
      }
      if (!('oo1' in sqlite3 && 'OpfsDb' in sqlite3.oo1)) {
        reasons.push("OpfsDb not available in SQLite WASM");
      }
      console.warn(`Storage: OPFS not available (${reasons.join(', ')}), using in-memory fallback`);
      db = new sqlite3.oo1.DB();
    }
    
    return db;
  } catch (err) {
    console.error("SQLite Initialization Error:", err);
    throw err;
  }
};

export const getDB = () => db;

export const executeQuery = (sql: string, params: any[] = []) => {
  if (!db) throw new Error("Database not initialized");
  const rows: any[] = [];
  try {
    db.exec({
      sql,
      bind: params,
      rowMode: 'object',
      callback: (row: any) => rows.push(row)
    });
    return rows;
  } catch (err) {
    console.error("Query Error:", sql, err);
    throw err;
  }
};

export const getTables = () => {
  if (!db) return [];
  return executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
};

export const getTableInfo = (tableName: string) => {
  if (!db) return [];
  return executeQuery(`PRAGMA table_info('${tableName}')`);
};

export const exportDatabase = (): Uint8Array => {
  if (!db) throw new Error("DB not initialized");
  return sqlite3.capi.sqlite3_js_db_export(db);
};

export const importDatabase = async (data: Uint8Array) => {
  if (!sqlite3) await initSQLite();
  
  if (db) {
    db.close();
  }
  
  try {
    if (isOpfsSupported()) {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle('gitdb_data.db', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      
      db = new sqlite3.oo1.OpfsDb('/gitdb_data.db');
      console.log("Database imported to OPFS");
    } else {
      // Fallback for non-OPFS: load into memory
      // This is trickier with standard oo1, but we can reopen an in-memory DB and use backup API or similar
      // For now, assume OPFS or fresh start
      db = new sqlite3.oo1.DB();
      console.warn("OPFS import not supported in this browser environment");
    }
  } catch (err) {
    console.error("Import Error:", err);
    db = new sqlite3.oo1.DB();
  }
  
  return db;
};
