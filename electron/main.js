const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;
let mainWindow = null;

const isDev = process.env.NODE_ENV !== 'production';
const backendPort = 3001;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend');
  const isProd = process.env.NODE_ENV === 'production';
  const cmd = isProd ? 'node' : 'node';
  const args = isProd ? ['dist/index.js'] : ['node_modules/tsx/dist/cli.mjs', 'src/index.ts'];
  backendProcess = spawn(cmd, args, {
    cwd: backendPath,
    env: { ...process.env, MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barcode-billing' },
    stdio: 'pipe',
  });
  backendProcess.stderr?.on('data', (d) => console.error('Backend:', d.toString()));
  backendProcess.stdout?.on('data', (d) => console.log('Backend:', d.toString()));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    icon: path.join(__dirname, '..', 'frontend', 'public', 'favicon.svg'),
  });
  const url = isDev ? 'http://localhost:5173' : 'http://localhost:' + backendPort;
  mainWindow.loadURL(url);
  if (isDev) mainWindow.webContents.openDevTools();
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  startBackend();
  setTimeout(() => createWindow(), 2000);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});
