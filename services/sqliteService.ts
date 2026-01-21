
import initSqlite3 from '@sqlite.org/sqlite-wasm';

let sqlite3: any = null;
let db: any = null;

export const isOpfsSupported = () => {
  return typeof SharedArrayBuffer !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
};

export const initSQLite = async () => {
  if (db) return db;

  try {
    // Check for SharedArrayBuffer which is required for OPFS workers
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn("SharedArrayBuffer not available. OPFS persistence might fail. Ensure COOP/COEP headers are set.");
    }

    // Fixed: initSqlite3 expects 0 arguments.
    sqlite3 = await initSqlite3();
    
    console.log("SQLite3 loaded version:", sqlite3.version.libVersion);

    if (isOpfsSupported() && 'oo1' in sqlite3 && 'OpfsDb' in sqlite3.oo1) {
      db = new sqlite3.oo1.OpfsDb('/gitdb_data.db');
      console.log("Storage: OPFS persistence active");
    } else {
      console.warn("Storage: OPFS not available, using in-memory fallback");
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
