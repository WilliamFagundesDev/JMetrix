import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 3001;
const isDev = process.env.NODE_ENV === 'development';

/**
 * Checks if the backend HTTP server is responding on localhost
 */
function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/dashboard/overview`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Spawns the backend Node.js process if not already running
 */
async function startBackendIfNeeded() {
  const isRunning = await checkBackendHealth();
  if (isRunning) {
    console.log('[Electron] Backend já está em execução na porta', BACKEND_PORT);
    return;
  }

  console.log('[Electron] Iniciando backend Node.js...');
  const backendEntry = path.join(rootDir, 'backend', 'src', 'server.js');
  const backendCwd = path.join(rootDir, 'backend');

  // Use embedded Electron binary with ELECTRON_RUN_AS_NODE if packaged, or system 'node' in dev
  const execCmd = app.isPackaged ? process.execPath : 'node';
  const customEnv = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    STORAGE_DIR: app.isPackaged
      ? path.join(app.getPath('userData'), 'storage')
      : path.join(rootDir, 'backend', 'storage'),
    RESOURCES_PATH: process.resourcesPath || ''
  };

  if (app.isPackaged) {
    customEnv.ELECTRON_RUN_AS_NODE = '1';
  }

  backendProcess = spawn(execCmd, [backendEntry], {
    cwd: backendCwd,
    env: customEnv,
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('[Electron] Erro ao iniciar backend:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`[Electron] Backend finalizado (código: ${code}, sinal: ${signal})`);
    backendProcess = null;
  });

  // Wait for backend to become ready
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const healthy = await checkBackendHealth();
    if (healthy) {
      console.log('[Electron] Backend pronto e respondendo!');
      return;
    }
  }

  console.warn('[Electron] Tempo limite excedido aguardando o backend.');
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: 'JMETRIX — Test. Measure. Dominate.',
    backgroundColor: '#f8fafc',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    show: false,
    autoHideMenuBar: true
  });

  // Target URL: Vite dev server in development, or Express static server on port 3001
  const startUrl = isDev ? 'http://localhost:5173' : `http://127.0.0.1:${BACKEND_PORT}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Clean up backend process on exit
function cleanup() {
  if (backendProcess) {
    console.log('[Electron] Encerrando processo do backend...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t']);
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error('[Electron] Erro ao matar backend:', e);
    }
    backendProcess = null;
  }
}

app.on('before-quit', cleanup);
app.on('will-quit', cleanup);

// App Lifecycle
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.jmetrix.app');
  }
  await startBackendIfNeeded();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
