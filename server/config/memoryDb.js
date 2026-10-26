// Development-only local MongoDB (MONGO_URI=memory): no MongoDB install needed.
// Data is kept in server/.data so it survives restarts.
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// MEMORY_DB_DIR lets a second copy (e.g. a test run) use its own data folder
const DATA_DIR = process.env.MEMORY_DB_DIR
  ? path.resolve(process.env.MEMORY_DB_DIR)
  : path.resolve(__dirname, '..', '.data', 'db');
const RUNTIME_DLLS = ['vcruntime140.dll', 'vcruntime140_1.dll', 'msvcp140.dll'];

/**
 * mongod.exe needs the Visual C++ runtime. When it is not installed system wide,
 * copy the x64 runtime that ships with Microsoft Edge next to the binary (app-local deployment).
 */
const ensureWindowsRuntime = (binaryPath) => {
  if (process.platform !== 'win32' || !binaryPath) return;
  const system32 = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32');
  if (RUNTIME_DLLS.every((dll) => fs.existsSync(path.join(system32, dll)))) return;

  const binDir = path.dirname(binaryPath);
  if (RUNTIME_DLLS.every((dll) => fs.existsSync(path.join(binDir, dll)))) return;

  const edgeRoot = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application';
  const source = fs.existsSync(edgeRoot)
    ? fs
        .readdirSync(edgeRoot)
        .map((d) => path.join(edgeRoot, d))
        .find((d) => RUNTIME_DLLS.every((dll) => fs.existsSync(path.join(d, dll))))
    : null;
  if (!source) {
    logger.warn('Visual C++ runtime not found. Install https://aka.ms/vs/17/release/vc_redist.x64.exe if mongod fails to start.');
    return;
  }
  RUNTIME_DLLS.forEach((dll) => fs.copyFileSync(path.join(source, dll), path.join(binDir, dll)));
  logger.info('Copied Visual C++ runtime next to mongod.exe');
};

const isPortOpen = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.setTimeout(800);
    socket.once('connect', () => socket.end() && resolve(true));
    socket.once('timeout', () => socket.destroy() && resolve(false));
    socket.once('error', () => resolve(false));
  });

export const startMemoryDb = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('MONGO_URI=memory is for development only');
  const port = Number(process.env.MEMORY_DB_PORT) || 27018;

  // Already running (server + `npm run seed`, or a leftover process): just reuse it
  if (await isPortOpen(port)) {
    logger.info(`Reusing local dev MongoDB on port ${port}`);
    return `mongodb://127.0.0.1:${port}/shopease`;
  }
  // Dev dependency, only loaded when this mode is used
  const { MongoMemoryServer, MongoBinary } = await import('mongodb-memory-server');
  fs.mkdirSync(DATA_DIR, { recursive: true });

  ensureWindowsRuntime(await MongoBinary.getPath());
  const server = await MongoMemoryServer.create({
    instance: { dbPath: DATA_DIR, storageEngine: 'wiredTiger', port },
  });
  const stop = () => server.stop({ doCleanup: false }).catch(() => {});
  process.once('exit', stop);
  logger.info(`Local dev MongoDB running (data in ${DATA_DIR})`);
  return `${server.getUri()}shopease`;
};
