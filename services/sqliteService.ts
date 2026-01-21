
import initSqlite3 from '@sqlite.org/sqlite-wasm';

let sqlite3: any = null;
let db: any = null;

/**
 * 等待 crossOriginIsolated 环境准备就绪
 * Service Worker 可能需要一些时间才能激活并设置正确的 COOP/COEP 头
 * 在 GitHub Pages 上，Service Worker 需要时间接管页面
 */
const waitForCrossOriginIsolated = async (maxWait = 15000): Promise<boolean> => {
  // 如果已经准备好了，直接返回
  if (typeof window !== 'undefined' && window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') {
    // 确保 Service Worker 已注册并可能控制页面（如果支持）
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return true;
    }
    // 即使没有 controller，如果 crossOriginIsolated 为 true，也应该可以
    return true;
  }

  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') {
        clearInterval(checkInterval);
        console.log("crossOriginIsolated and SharedArrayBuffer are ready");
        resolve(true);
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(checkInterval);
        console.warn(`crossOriginIsolated not available after ${maxWait}ms. Service Worker may need more time to activate.`);
        resolve(false);
      }
    }, 50); // 更频繁的检查
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
    // 等待 crossOriginIsolated 环境准备就绪（最多等待15秒）
    // Service Worker 可能需要时间激活（在 GitHub Pages 上可能需要更长时间）
    console.log("Waiting for crossOriginIsolated environment...");
    const isCrossOriginIsolated = await waitForCrossOriginIsolated(15000);
    
    // 严格检查：应用必须使用 OPFS，环境不满足就报错
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error("SharedArrayBuffer not available. OPFS requires COOP/COEP headers. Please refresh the page to allow Service Worker to activate.");
    }

    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      throw new Error("crossOriginIsolated is false. OPFS requires COOP/COEP headers. Service Worker may need more time. Please refresh the page - the app will reload automatically when Service Worker is ready.");
    }

    console.log("Environment ready, initializing SQLite WASM...");
    // 初始化 SQLite WASM（必须在 crossOriginIsolated 为 true 时初始化，否则 OpfsDb 可能不可用）
    // 注意：SQLite WASM 在初始化时会检查环境，如果此时环境不对，OpfsDb 就不会被注册
    sqlite3 = await initSqlite3();
    console.log("SQLite3 loaded version:", sqlite3.version.libVersion);

    // 再次确认环境状态（确保在 SQLite WASM 初始化后仍然有效）
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
      throw new Error(`OPFS is required but not available: ${reasons.join(', ')}. Please refresh the page to allow Service Worker to activate.`);
    }

    // 检查 OpfsDb 是否可用（这取决于 SQLite WASM 初始化时的环境状态）
    // 如果 OpfsDb 不可用，说明 SQLite WASM 初始化时环境还没准备好
    if (!('oo1' in sqlite3 && 'OpfsDb' in sqlite3.oo1)) {
      console.error("OpfsDb not available in SQLite WASM. This means the environment was not ready when SQLite WASM initialized.");
      throw new Error("OpfsDb is not available in SQLite WASM. The Service Worker may not have activated in time. Please refresh the page - the app will reload automatically when Service Worker is ready.");
    }

    console.log("Creating OPFS database...");
    // 创建 OPFS 数据库（这是唯一允许的方式，必须使用 OPFS）
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
