const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Импортируем модули настроек и масштабирования
const settings = require('./crates/mod/settings');
const uiScaling = require('./crates/mod/ui_scaling');
const store = require('./crates/mod/store');
const fileSystem = require('./crates/mod/file_system');
const sessions = require('./crates/mod/sessions');
const gitUtils = require('./crates/mod/git_utils');

let mainWindow;
let currentProjectPath = null;

function createWindow() {
  // Load window state from sessions
  const windowState = sessions.getWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.bounds.width,
    height: windowState.bounds.height,
    x: windowState.bounds.x,
    y: windowState.bounds.y,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'crates/zen/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: false,
    titleBarStyle: 'hidden'
  });

  // If window was maximized last session, maximize it
  if (windowState.maximized) {
    mainWindow.maximize();
  }

  mainWindow.loadFile(path.join(__dirname, 'crates/ui/welcome.html'));
  
  // Инициализируем масштабирование UI
  uiScaling.initWindow(mainWindow);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check if there's a last project to open
    const lastProject = sessions.getCurrentProject();
    if (lastProject && fs.existsSync(lastProject)) {
      openProjectPath(lastProject);
    }
  });

  // Save window state when resizing or moving
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  mainWindow.on('closed', () => {
    // Cleanup file watchers when the window is closed
    if (currentProjectPath) {
      fileSystem.stopWatching(currentProjectPath);
      currentProjectPath = null;
    }
    mainWindow = null;
  });
}

// Save current window state to sessions
function saveWindowState() {
  if (!mainWindow) return;
  
  const isMaximized = mainWindow.isMaximized();
  const bounds = isMaximized ? mainWindow.getNormalBounds() : mainWindow.getBounds();
  
  sessions.saveWindowState({
    maximized: isMaximized,
    bounds
  });
}

// File system change event handler
function handleFileSystemChange(event) {
  if (mainWindow) {
    mainWindow.webContents.send('file-system-change', event);
  }
}

// Open a project path directly
function openProjectPath(projectPath) {
  try {
    // Use the file system module to open the project
    const result = fileSystem.openProject(projectPath);
    
    // Save the current project path
    currentProjectPath = projectPath;
    
    // Save to sessions
    sessions.saveCurrentProject(projectPath);
    
    // Setup file watcher with event forwarding
    fileSystem.watchProject(projectPath, handleFileSystemChange);
    
    // Check if the project is a Git repository and get branch info
    const gitInfo = gitUtils.initProject(projectPath);
    
    // Send to renderer
    if (mainWindow) {
      mainWindow.webContents.send('project-opened', {
        ...result,
        gitInfo
      });
    }
    
    // Listen for Git branch changes
    gitUtils.on('branch-changed', ({ newBranch }) => {
      if (mainWindow) {
        mainWindow.webContents.send('git-branch-changed', { branchName: newBranch });
      }
    });
    
    return {
      ...result,
      gitInfo
    };
  } catch (err) {
    console.error('Error opening project:', err);
    return null;
  }
}

// IPC handlers
ipcMain.handle('open-project', async (_, projectPath) => {
  try {
    // If a path is provided, open it directly
    if (projectPath && fs.existsSync(projectPath)) {
      return openProjectPath(projectPath);
    }
    
    // Otherwise, show the dialog to select a directory
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (!canceled && filePaths.length > 0) {
      const selectedPath = filePaths[0];
      return openProjectPath(selectedPath);
    }
  } catch (err) {
    console.error('Error opening project:', err);
  }
  
  return null;
});

ipcMain.handle('get-recent-projects', () => {
  return sessions.getRecentProjects();
});

ipcMain.handle('get-current-project', () => {
  return sessions.getCurrentProject();
});

ipcMain.handle('get-directory-contents', (_, dirPath) => {
  try {
    return fileSystem.getDirectoryContents(dirPath);
  } catch (err) {
    console.error('Error getting directory contents:', err);
    return null;
  }
});

ipcMain.handle('expand-directory', (_, dirPath) => {
  try {
    return fileSystem.expandDirectory(dirPath);
  } catch (err) {
    console.error('Error expanding directory:', err);
    return null;
  }
});

ipcMain.handle('read-file-contents', (_, filePath) => {
  try {
    return fileSystem.readFileContents(filePath);
  } catch (err) {
    console.error('Error reading file contents:', err);
    return null;
  }
});

ipcMain.handle('new-file', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Create New File',
    buttonLabel: 'Create',
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!canceled) {
    fs.writeFileSync(filePath, '', 'utf8');
    return filePath;
  }
  return null;
});

ipcMain.handle('clone-repo', async () => {
  // In a real app, this would show a dialog to get the git URL
  // and then use a git library to clone the repo
  return 'Clone repository action triggered';
});

ipcMain.handle('toggle-setting', (_, key, value) => {
  settings.set(key, value);
  
  // Если изменился размер шрифта, обновляем UI всех окон
  if (key === 'ui_font_size') {
    uiScaling.updateAllWindows();
  }
  
  return true;
});

// Window control handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Обработчики масштабирования UI
ipcMain.handle('increase-ui-scale', () => {
  if (mainWindow) {
    uiScaling.increaseRemSize(mainWindow, 1);
    return true;
  }
  return false;
});

ipcMain.handle('decrease-ui-scale', () => {
  if (mainWindow) {
    uiScaling.decreaseRemSize(mainWindow, 1);
    return true;
  }
  return false;
});

ipcMain.handle('reset-ui-scale', () => {
  if (mainWindow) {
    uiScaling.resetRemSize(mainWindow);
    return true;
  }
  return false;
});

ipcMain.handle('save-ui-scale', () => {
  if (mainWindow) {
    uiScaling.saveToSettings(mainWindow);
    return true;
  }
  return false;
});

ipcMain.handle('get-settings', () => {
  return {
    ui_font_size: settings.get('ui_font_size')
  };
});

// Store handlers
ipcMain.handle('store-get', (_, key, defaultValue) => {
  return store.get(key, defaultValue);
});

ipcMain.handle('store-set', (_, key, value) => {
  return store.set(key, value);
});

ipcMain.handle('store-has', (_, key) => {
  return store.has(key);
});

ipcMain.handle('store-remove', (_, key) => {
  return store.remove(key);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 