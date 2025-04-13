const { contextBridge, ipcRenderer } = require('electron');

/* UI scale change callback */
let uiScaleChangeCallback = null;

/* File system change callback */
let fileSystemChangeCallback = null;

/* Project opened callback */
let projectOpenedCallback = null;

/* Git branch changed callback */
let gitBranchChangedCallback = null;

/* Handle messages from the main process */
ipcRenderer.on('update-ui-scaling', (_, data) => {
  if (uiScaleChangeCallback) {
    uiScaleChangeCallback(data);
  }
  
  /* Apply CSS variables for rem size, title bar height, and SVG scaling */
  document.documentElement.style.setProperty('--rem-size', `${data.remSize}px`);
  document.documentElement.style.setProperty('--titlebar-height', `${data.titleBarHeight}px`);
  document.documentElement.style.setProperty('--svg-scale', data.svgScaleFactor);
  
  /* Apply other scaling variables */
  document.documentElement.style.setProperty('--icon-size', `${data.iconSize}px`);
  document.documentElement.style.setProperty('--base-font-size', `${data.baseFontSize}px`);
  document.documentElement.style.setProperty('--small-font-size', `${data.smallFontSize}px`);
  document.documentElement.style.setProperty('--xs-font-size', `${data.extraSmallFontSize}px`);
  document.documentElement.style.setProperty('--large-font-size', `${data.largeFontSize}px`);
  document.documentElement.style.setProperty('--base-spacing', `${data.baseSpacing}px`);
  document.documentElement.style.setProperty('--spacing-2', `${data.doubleSpacing}px`);
  document.documentElement.style.setProperty('--spacing-3', `${data.tripleSpacing}px`);
  document.documentElement.style.setProperty('--spacing-4', `${data.quadSpacing}px`);
  
  /* Find all SVG elements and scale them */
  const svgs = document.querySelectorAll('svg');
  svgs.forEach(svg => {
    if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
      const baseWidth = parseFloat(svg.getAttribute('data-base-width') || svg.getAttribute('width'));
      const baseHeight = parseFloat(svg.getAttribute('data-base-height') || svg.getAttribute('height'));
      
      /* Store original dimensions as data attributes if not already set */
      if (!svg.hasAttribute('data-base-width')) {
        svg.setAttribute('data-base-width', baseWidth);
        svg.setAttribute('data-base-height', baseHeight);
      }
      
      /* Apply scaling */
      svg.setAttribute('width', baseWidth * data.svgScaleFactor);
      svg.setAttribute('height', baseHeight * data.svgScaleFactor);
    }
  });
});

/* Handle file system change events from the main process */
ipcRenderer.on('file-system-change', (_, data) => {
  if (fileSystemChangeCallback) {
    fileSystemChangeCallback(data);
  }
});

/* Handle project opened event from the main process */
ipcRenderer.on('project-opened', (_, data) => {
  if (projectOpenedCallback) {
    projectOpenedCallback(data);
  }
});

/* Handle Git branch changed event from the main process */
ipcRenderer.on('git-branch-changed', (_, data) => {
  if (gitBranchChangedCallback) {
    gitBranchChangedCallback(data);
  }
});

/* Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld(
  'api', {
    /* Project management */
    openProject: (path) => ipcRenderer.invoke('open-project', path),
    getDirectoryContents: (dirPath) => ipcRenderer.invoke('get-directory-contents', dirPath),
    expandDirectory: (dirPath) => ipcRenderer.invoke('expand-directory', dirPath),
    readFileContents: (filePath) => ipcRenderer.invoke('read-file-contents', filePath),
    getRecentProjects: () => ipcRenderer.invoke('get-recent-projects'),
    getCurrentProject: () => ipcRenderer.invoke('get-current-project'),
    
    /* File system change events */
    onFileSystemChange: (callback) => {
      fileSystemChangeCallback = callback;
    },
    
    /* Project opened event */
    onProjectOpened: (callback) => {
      projectOpenedCallback = callback;
    },
    
    /* Git branch changed event */
    onGitBranchChanged: (callback) => {
      gitBranchChangedCallback = callback;
    },
    
    /* Other project actions */
    newFile: () => ipcRenderer.invoke('new-file'),
    cloneRepo: () => ipcRenderer.invoke('clone-repo'),
    installCli: () => ipcRenderer.invoke('install-cli'),
    signIn: () => ipcRenderer.invoke('sign-in'),
    exploreExtensions: () => ipcRenderer.invoke('explore-extensions'),
    toggleSetting: (key, value) => ipcRenderer.invoke('toggle-setting', key, value),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    /* Store functionality for persistent state */
    storeGet: (key, defaultValue) => ipcRenderer.invoke('store-get', key, defaultValue),
    storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
    storeHas: (key) => ipcRenderer.invoke('store-has', key),
    storeRemove: (key) => ipcRenderer.invoke('store-remove', key),
    
    /* UI scaling - internal use only */
    _increaseUiScale: () => ipcRenderer.invoke('increase-ui-scale'),
    _decreaseUiScale: () => ipcRenderer.invoke('decrease-ui-scale'),
    _resetUiScale: () => ipcRenderer.invoke('reset-ui-scale'),
    _saveUiScale: () => ipcRenderer.invoke('save-ui-scale'),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    
    /* Subscribe to UI scale changes */
    onUiScaleChange: (callback) => {
      uiScaleChangeCallback = callback;
    }
  }
); 