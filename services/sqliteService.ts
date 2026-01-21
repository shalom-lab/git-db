
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
    
    // 检查 OPFS 必需的环境
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error("SharedArrayBuffer not available. OPFS requires COOP/COEP headers. Please ensure Service Worker is active.");
    }

    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      throw new Error("crossOriginIsolated is false. OPFS requires COOP/COEP headers. Please ensure Service Worker is active.");
    }

    // 初始化 SQLite WASM
    sqlite3 = await initSqlite3();
    console.log("SQLite3 loaded version:", sqlite3.version.libVersion);

    // 应用必须使用 OPFS，检查支持情况
    const opfsSupported = isOpfsSupported();
    
    if (!opfsSupported) {
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
      throw new Error(`OPFS is required but not available: ${reasons.join(', ')}. Please ensure your browser supports OPFS and COOP/COEP headers are set.`);
    }

    if (!('oo1' in sqlite3 && 'OpfsDb' in sqlite3.oo1)) {
      throw new Error("OpfsDb is not available in SQLite WASM. This application requires OPFS support.");
    }

    // 创建 OPFS 数据库（这是唯一允许的方式）
    db = new sqlite3.oo1.OpfsDb('/gitdb_data.db');
    console.log("Storage: OPFS persistence active");
    
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

export const exportDatabase = async (): Promise<Uint8Array> => {
  if (!db) throw new Error("DB not initialized");
  
  // 应用必须使用 OPFS，直接从文件系统读取，避免内存问题
  if (!(db instanceof sqlite3.oo1.OpfsDb)) {
    throw new Error("Database must use OPFS storage. This application requires OPFS.");
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('gitdb_data.db');
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    // 创建新的 ArrayBuffer 并复制数据，确保类型兼容
    const newBuffer = new ArrayBuffer(arrayBuffer.byteLength);
    const source = new Uint8Array(arrayBuffer);
    const target = new Uint8Array(newBuffer);
    target.set(source);
    return target;
  } catch (err: any) {
    throw new Error(`Failed to read OPFS database file: ${err.message}. Please ensure OPFS is properly configured.`);
  }
};

export const importDatabase = async (data: Uint8Array) => {
  if (!sqlite3) await initSQLite();
  
  if (db) {
    db.close();
  }
  
  // 应用必须使用 OPFS
  if (!isOpfsSupported()) {
    throw new Error("OPFS is required for database import. Please ensure OPFS is supported and COOP/COEP headers are set.");
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('gitdb_data.db', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data as any);
    await writable.close();
    
    db = new sqlite3.oo1.OpfsDb('/gitdb_data.db');
    console.log("Database imported to OPFS");
  } catch (err: any) {
    throw new Error(`Failed to import database to OPFS: ${err.message}`);
  }
  
  return db;
};
