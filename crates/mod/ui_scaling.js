const settings = require('./settings');
const { BrowserWindow } = require('electron');

/**
 * @class UiScaling
 * @description Module for managing UI scaling in the application
 */
class UiScaling {
  constructor() {
    /* Minimum allowed rem size */
    this.MIN_REM_SIZE = settings.MIN_FONT_SIZE;
    /* Maximum allowed rem size */
    this.MAX_REM_SIZE = settings.MAX_FONT_SIZE;
    /* Current rem size overrides for each window */
    this.windowRemSizeOverrides = new Map();
    /* List of tracked windows */
    this.windows = new Set();

    /* Listen for settings changes */
    settings.on('change', (newSettings, oldSettings) => {
      if (newSettings.ui_font_size !== oldSettings.ui_font_size) {
        this.updateAllWindows();
      }
    });
  }

  /**
   * Initializes scaling handling for a window
   * @param {BrowserWindow} window - Electron window
   */
  initWindow(window) {
    if (!window || this.windows.has(window.id)) return;
    
    this.windows.add(window.id);
    this.applyRemSize(window);
    
    /* Track window closing for resource cleanup */
    window.on('closed', () => {
      this.windowRemSizeOverrides.delete(window.id);
      this.windows.delete(window.id);
    });
  }

  /**
   * Returns the rem size for the specified window
   * @param {BrowserWindow|number} windowOrId - Window or window ID
   * @returns {number} Current rem size
   */
  getRemSize(windowOrId) {
    const windowId = typeof windowOrId === 'object' ? windowOrId.id : windowOrId;
    
    /* If there's an override for this window, use it */
    if (this.windowRemSizeOverrides.has(windowId)) {
      return this.windowRemSizeOverrides.get(windowId);
    }
    
    /* Otherwise use the size from settings */
    return Math.min(
      Math.max(settings.get('ui_font_size'), this.MIN_REM_SIZE),
      this.MAX_REM_SIZE
    );
  }

  /**
   * Sets the rem size for the specified window
   * @param {BrowserWindow|number} windowOrId - Window or window ID
   * @param {number} size - New rem size
   */
  setRemSize(windowOrId, size) {
    const windowId = typeof windowOrId === 'object' ? windowOrId.id : windowOrId;
    const window = typeof windowOrId === 'object' ? windowOrId : BrowserWindow.fromId(windowId);
    
    if (!window) return;
    
    /* Set override for the window with clamping */
    const clampedSize = Math.min(
      Math.max(size, this.MIN_REM_SIZE),
      this.MAX_REM_SIZE
    );
    this.windowRemSizeOverrides.set(windowId, clampedSize);
    
    /* Apply changes */
    this.applyRemSize(window);
  }

  /**
   * Resets rem size override for a window and reverts to settings
   * @param {BrowserWindow|number} windowOrId - Window or window ID
   */
  resetRemSize(windowOrId) {
    const windowId = typeof windowOrId === 'object' ? windowOrId.id : windowOrId;
    const window = typeof windowOrId === 'object' ? windowOrId : BrowserWindow.fromId(windowId);
    
    if (!window) return;
    
    /* Remove override */
    this.windowRemSizeOverrides.delete(windowId);
    
    /* Apply size from settings */
    this.applyRemSize(window);
  }

  /**
   * Increases rem size for a window
   * @param {BrowserWindow|number} windowOrId - Window or window ID
   * @param {number} increment - Amount to increase (default 1)
   */
  increaseRemSize(windowOrId, increment = 1) {
    const current = this.getRemSize(windowOrId);
    this.setRemSize(windowOrId, current + increment);
  }

  /**
   * Decreases rem size for a window
   * @param {BrowserWindow|number} windowOrId - Window or window ID
   * @param {number} decrement - Amount to decrease (default 1)
   */
  decreaseRemSize(windowOrId, decrement = 1) {
    const current = this.getRemSize(windowOrId);
    this.setRemSize(windowOrId, current - decrement);
  }

  /**
   * Applies the current rem size to a window
   * @param {BrowserWindow} window - Electron window
   * @private
   */
  applyRemSize(window) {
    if (!window) return;
    
    const remSize = this.getRemSize(window);
    
    /* Calculate derived values based on rem size */
    const titleBarHeight = Math.max(1.75 * remSize, 34);
    
    /* Calculate SVG scaling factor relative to default size */
    const svgScaleFactor = remSize / 16; // 16px is the base size
    
    /* Send update to renderer */
    window.webContents.send('update-ui-scaling', {
      remSize,
      titleBarHeight,
      svgScaleFactor,
      /* Additional values that should scale with rem */
      iconSize: remSize,
      baseFontSize: remSize,
      smallFontSize: remSize * 0.875, // 14px at 16px base
      extraSmallFontSize: remSize * 0.75, // 12px at 16px base
      largeFontSize: remSize * 1.125, // 18px at 16px base
      baseSpacing: remSize * 0.25, // 4px at 16px base
      doubleSpacing: remSize * 0.5, // 8px at 16px base
      tripleSpacing: remSize * 0.75, // 12px at 16px base
      quadSpacing: remSize // 16px at 16px base
    });
  }

  /**
   * Updates UI of all open windows when settings change
   */
  updateAllWindows() {
    for (const windowId of this.windows) {
      const window = BrowserWindow.fromId(windowId);
      if (window) {
        this.applyRemSize(window);
      }
    }
  }

  /**
   * Saves current rem size to settings
   * @param {BrowserWindow|number} windowOrId - Window or window ID
   */
  saveToSettings(windowOrId) {
    const remSize = this.getRemSize(windowOrId);
    settings.set('ui_font_size', remSize);
    
    /* Clear the override, as it's now in settings */
    if (typeof windowOrId === 'object') {
      this.windowRemSizeOverrides.delete(windowOrId.id);
    } else {
      this.windowRemSizeOverrides.delete(windowOrId);
    }
  }
}

module.exports = new UiScaling(); 