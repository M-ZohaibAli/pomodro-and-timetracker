const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');

let mainWindow = null;
let server = null;
let tray = null;

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const outDir = app.isPackaged
      ? path.join(process.resourcesPath, 'app', 'out')
      : path.join(__dirname, '..', 'out');

    // Fallback if structure varies in packaged mode
    const publicPath = require('fs').existsSync(outDir)
      ? outDir
      : path.join(__dirname, '..', 'out');

    server = http.createServer((request, response) => {
      return handler(request, response, {
        public: publicPath,
        cleanUrls: true,
      });
    });

    // Listen on random available port on localhost only
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address.port;
      console.log(`Internal server running on http://127.0.0.1:${port}`);
      resolve(`http://127.0.0.1:${port}`);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 840,
    minHeight: 600,
    title: 'Focus — Advanced Pomodoro & Time Tracker',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    show: false, // show when ready-to-show to prevent flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const isDev = process.env.NODE_ENV === 'development';
  let appUrl = 'http://localhost:3000';

  if (!isDev) {
    try {
      appUrl = await startStaticServer();
    } catch (err) {
      console.error('Failed to start static server:', err);
    }
  }

  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});
