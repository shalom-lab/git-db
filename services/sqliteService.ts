
// 使用动态导入，确保在环境准备好后再加载 SQLite WASM
let sqlite3: any = null;
let db: any = null;
let sqlite3Module: any = null;

/**
 * 等待 Service Worker 完全准备好
 */
const waitForServiceWorkerReady = async (maxWait = 10000): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    // 等待 Service Worker 注册完成
    const registration = await navigator.serviceWorker.ready;
    console.log("Service Worker ready:", registration.active?.state);
    
    // 如果 Service Worker 已激活，等待一小段时间确保它完全控制页面
    if (registration.active && registration.active.state === 'activated') {
      // 等待 controller 可用（如果支持）
      if (navigator.serviceWorker.controller) {
        console.log("Service Worker controller is available");
        return true;
      }
      // 即使没有 controller，如果已激活也应该可以
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Service Worker ready check failed:", err);
    return false;
  }
};

/**
 * 等待 crossOriginIsolated 环境准备就绪
 * Service Worker 可能需要一些时间才能激活并设置正确的 COOP/COEP 头
 * 在 GitHub Pages 上，Service Worker 需要时间接管页面
 */
const waitForCrossOriginIsolated = async (maxWait = 15000): Promise<boolean> => {
  // 如果已经准备好了，直接返回
  if (typeof window !== 'undefined' && window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') {
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
    // 步骤1: 等待 Service Worker 完全准备好
    console.log("Step 1: Waiting for Service Worker to be ready...");
    await waitForServiceWorkerReady(10000);
    
    // 步骤2: 等待 crossOriginIsolated 环境准备就绪（最多等待15秒）
    console.log("Step 2: Waiting for crossOriginIsolated environment...");
    const isCrossOriginIsolated = await waitForCrossOriginIsolated(15000);
    
    // 严格检查：应用必须使用 OPFS，环境不满足就报错
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error("SharedArrayBuffer not available. OPFS requires COOP/COEP headers. Please refresh the page to allow Service Worker to activate.");
    }

    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      throw new Error("crossOriginIsolated is false. OPFS requires COOP/COEP headers. Service Worker may need more time. Please refresh the page - the app will reload automatically when Service Worker is ready.");
    }

    console.log("Step 3: Environment ready, dynamically loading SQLite WASM...");
    // 步骤3: 动态导入 SQLite WASM（确保在环境准备好后再加载）
    // 这样可以避免模块加载时环境还没准备好的问题
    if (!sqlite3Module) {
      sqlite3Module = await import('@sqlite.org/sqlite-wasm');
    }
    
    // 步骤4: 初始化 SQLite WASM（必须在 crossOriginIsolated 为 true 时初始化，否则 OpfsDb 可能不可用）
    console.log("Step 4: Initializing SQLite WASM...");
    sqlite3 = await sqlite3Module.default();
    console.log("SQLite3 loaded version:", sqlite3.version.libVersion);

    // 再次确认环境状态（确保在 SQLite WASM 初始化后仍然有效）
    const opfsSupported = isOpfsSupported();
    console.log("Environment check after SQLite init:", {
      crossOriginIsolated: typeof window !== 'undefined' ? window.crossOriginIsolated : 'N/A',
      hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      hasStorage: 'storage' in navigator,
      hasGetDirectory: 'storage' in navigator && 'getDirectory' in navigator.storage,
      opfsSupported
    });
    
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

    // 检查 OpfsDb 是否可用
    // 根据 SQLite WASM 文档，OpfsDb 应该可用，即使 OPFS VFS 在主线程安装失败
    // 因为 OpfsDb 会自动在 Worker 中处理
    console.log("Step 5: Checking for OpfsDb availability...");
    console.log("SQLite3 object structure:", {
      hasOo1: 'oo1' in sqlite3,
      hasCapi: 'capi' in sqlite3,
      oo1Keys: 'oo1' in sqlite3 ? Object.keys(sqlite3.oo1) : [],
      hasOpfsDb: 'oo1' in sqlite3 && 'OpfsDb' in sqlite3.oo1,
      hasOpfsVfs: 'capi' in sqlite3 && sqlite3.capi.sqlite3_vfs_find ? sqlite3.capi.sqlite3_vfs_find('opfs') !== null : 'N/A'
    });

    if (!('oo1' in sqlite3)) {
      throw new Error("SQLite WASM oo1 API not available. This is unexpected.");
    }

    if (!('OpfsDb' in sqlite3.oo1)) {
      // 根据文档，OpfsDb 应该可用。如果不可用，可能是版本问题或环境问题
      console.error("OpfsDb not available in sqlite3.oo1. Available classes:", Object.keys(sqlite3.oo1));
      
      // 检查是否有 OPFS VFS
      if ('capi' in sqlite3 && sqlite3.capi.sqlite3_vfs_find) {
        const opfsVfs = sqlite3.capi.sqlite3_vfs_find('opfs');
        console.log("OPFS VFS status:", opfsVfs ? "Found" : "Not found");
      }
      
      throw new Error("OpfsDb is not available in SQLite WASM. This application requires OPFS support. Please ensure you are using a compatible browser and that COOP/COEP headers are properly set.");
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
