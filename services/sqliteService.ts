
// 使用 Wrapped Worker 方式，支持 OPFS（这是唯一支持 OPFS 的方式）
let promiser: any = null;
let dbId: number | null = null;
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
  if (dbId !== null) return { dbId, promiser };

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
    // 步骤3: 动态导入 SQLite WASM（使用 Wrapped Worker 方式，支持 OPFS）
    if (!sqlite3Module) {
      sqlite3Module = await import('@sqlite.org/sqlite-wasm');
      console.log("SQLite WASM module loaded from importmap");
    }
    
    // 步骤4: 初始化 SQLite WASM Wrapped Worker（这是唯一支持 OPFS 的方式）
    console.log("Step 4: Initializing SQLite WASM with Wrapped Worker (OPFS support)...");
    
    // 从 CDN 加载时，需要确保 Worker 文件也能从 CDN 正确加载
    // sqlite3Worker1Promiser 需要 Worker 文件的 URL
    // 检查模块是否有 worker 路径信息
    const cdnBase = 'https://esm.sh/@sqlite.org/sqlite-wasm@3.51.2-build2';
    const workerPath = `${cdnBase}/sqlite3-worker1.mjs`;
    
    console.log("Using Worker path:", workerPath);
    
    promiser = await new Promise((resolve, reject) => {
      try {
        const _promiser = sqlite3Module.sqlite3Worker1Promiser({
          // 显式指定 Worker 文件路径，确保从 CDN 正确加载
          worker: workerPath,
          onready: () => {
            console.log("SQLite WASM Worker ready");
            resolve(_promiser);
          },
          onerror: (err: any) => {
            console.error("SQLite WASM Worker error:", err);
            reject(err);
          }
        });
      } catch (err) {
        console.error("Failed to create sqlite3Worker1Promiser:", err);
        reject(err);
      }
    });

    // 获取版本信息
    const configResponse = await promiser('config-get', {});
    console.log("SQLite3 loaded version:", configResponse.result.version.libVersion);

    // 步骤5: 打开 OPFS 数据库（必须使用 OPFS）
    console.log("Step 5: Opening OPFS database...");
    const openResponse = await promiser('open', {
      filename: 'file:gitdb_data.db?vfs=opfs',
    });
    
    if (openResponse.result.code !== 0) {
      throw new Error(`Failed to open OPFS database: ${openResponse.result.message || 'Unknown error'}`);
    }
    
    dbId = openResponse.result.dbId;
    console.log("Storage: OPFS persistence active, database opened");
    
    return { dbId, promiser };
  } catch (err) {
    console.error("SQLite Initialization Error:", err);
    throw err;
  }
};

// 兼容性：保持原有的 getDB API
export const getDB = () => {
  if (dbId === null || !promiser) {
    throw new Error("Database not initialized");
  }
  return { dbId, promiser };
};

export const executeQuery = async (sql: string, params: any[] = []) => {
  if (dbId === null || !promiser) {
    throw new Error("Database not initialized");
  }
  
  try {
    // 使用 Worker1 API 执行查询
    const response = await promiser('exec', {
      dbId,
      sql,
      bind: params,
      returnValue: 'resultRows',
      rowMode: 'object'
    });
    
    if (response.result.code !== 0) {
      throw new Error(response.result.message || 'Query execution failed');
    }
    
    return response.result.resultRows || [];
  } catch (err) {
    console.error("Query Error:", sql, err);
    throw err;
  }
};

export const getTables = async () => {
  if (dbId === null) return [];
  return await executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
};

export const getTableInfo = async (tableName: string) => {
  if (dbId === null) return [];
  return await executeQuery(`PRAGMA table_info('${tableName}')`);
};

export const exportDatabase = async (): Promise<Uint8Array> => {
  if (dbId === null || !promiser) {
    throw new Error("DB not initialized");
  }

  try {
    // 应用必须使用 OPFS，直接从文件系统读取，避免内存问题
    // 即使使用 Worker1 API，数据库文件仍然存储在 OPFS 中
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
  if (!promiser) {
    await initSQLite();
  }
  
  if (dbId !== null) {
    // 关闭现有数据库
    await promiser('close', { dbId });
    dbId = null;
  }
  
  // 应用必须使用 OPFS
  if (!isOpfsSupported()) {
    throw new Error("OPFS is required for database import. Please ensure OPFS is supported and COOP/COEP headers are set.");
  }

  try {
    // 将数据写入 OPFS
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('gitdb_data.db', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data as any);
    await writable.close();
    
    // 重新打开数据库
    const openResponse = await promiser('open', {
      filename: 'file:gitdb_data.db?vfs=opfs',
    });
    
    if (openResponse.result.code !== 0) {
      throw new Error(`Failed to open imported database: ${openResponse.result.message || 'Unknown error'}`);
    }
    
    dbId = openResponse.result.dbId;
    console.log("Database imported to OPFS");
    
    return { dbId, promiser };
  } catch (err: any) {
    throw new Error(`Failed to import database to OPFS: ${err.message}`);
  }
};
