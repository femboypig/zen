const fs = require('fs');
const path = require('path');
const os = require('os');
const events = require('events');
const { FileWatcherManager, WatchEventType } = require('./file_watcher');

/**
 * @class ThemeManager
 * @description Module for managing Zen Editor themes with hot-reload
 */
class ThemeManager extends events.EventEmitter {
  constructor() {
    super();
    this.settings = require('./settings');
    this.currentTheme = null;
    this.themeWatcher = new FileWatcherManager();
    this.themesPath = this._getThemesPath();
    this._ensureThemesDirectoryExists();
    this._createDefaultThemes();
    this._loadTheme();
    this._setupWatchers();
    
    // Listen for settings changes
    this.settings.on('change', (newSettings, oldSettings) => {
      if (!newSettings.theme || !oldSettings.theme) return;
      if (newSettings.theme.name !== oldSettings.theme.name) {
        this._loadTheme();
      }
    });
  }
  
  /**
   * Returns the path to themes directory (same location as settings.json)
   * @private
   * @returns {string} Path to themes directory
   */
  _getThemesPath() {
    const settingsDir = path.dirname(this.settings.settingsPath);
    return path.join(settingsDir, 'themes');
  }
  
  /**
   * Creates themes directory if it doesn't exist
   * @private
   */
  _ensureThemesDirectoryExists() {
    if (!fs.existsSync(this.themesPath)) {
      fs.mkdirSync(this.themesPath, { recursive: true });
    }
  }
  
  /**
   * Creates default light and dark themes if they don't exist
   * @private
   */
  _createDefaultThemes() {
    this._createLightTheme();
    this._createDarkTheme();
  }
  
  /**
   * Creates default light theme
   * @private
   */
  _createLightTheme() {
    const lightThemePath = path.join(this.themesPath, 'light.json');
    if (!fs.existsSync(lightThemePath)) {
      const lightTheme = {
        manifest: {
          name: "light",
          author: "Zen Editor",
          version: "1.0.0",
          description: "Default light theme"
        },
        variables: {
          // Base colors
          "body-bg": "#ffffff",
          "body-text": "#333333",
          
          // Titlebar
          "titlebar-bg": "#f5f5f5",
          "titlebar-border": "#e1e1e1",
          "titlebar-text": "#555",
          "window-control-hover-bg": "#e5e5e5",
          "window-control-close-hover-bg": "#ff5252",
          
          // Sidebar
          "sidebar-bg": "#f8f8f8",
          "sidebar-border": "#e1e1e1",
          
          // Tabs
          "tabs-container-bg": "#f5f5f5",
          "tab-border": "#e1e1e1",
          "tab-active-bg": "#fff",
          "tab-text": "#333",
          "tab-unsaved-indicator": "#4a9eff",
          
          // Scrollbars
          "scrollbar-thumb": "#cdcdcd",
          "scrollbar-thumb-translucent": "#cdcdcd8f",
          
          // Welcome screen
          "subtitle-text": "#666",
          
          // Buttons
          "option-button-bg": "transparent",
          "option-button-text": "#333",
          "option-button-hover-bg": "rgba(0, 0, 0, 0.05)",
          "option-button-active-bg": "rgba(0, 0, 0, 0.1)",
          
          // Settings panel
          "settings-panel-bg": "#f8f8f8",
          "settings-panel-border": "#e0e0e0",
          
          // Checkbox
          "checkbox-border": "#ccc",
          "checkbox-bg": "#fff",
          "checkbox-checked-bg": "#555",
          "checkbox-label-text": "#333",
          
          // Downbar
          "downbar-bg": "#f5f5f5",
          "downbar-border": "#e1e1e1",
          "downbar-active-icon": "#2196F3",
          "downbar-icon-hover-filter": "opacity(0.6) drop-shadow(0 0 1px rgba(0, 0, 0, 0.3))",
          "downbar-icon-active-filter": "invert(48%) sepia(80%) saturate(2476%) hue-rotate(190deg) brightness(90%) contrast(95%)",
          
          // Icons
          "icon-filter": "none", // No filter for light theme
          "icon-hover-filter": "opacity(0.6)",
          "filetree-icon-filter": "none",
          
          // Command palette
          "command-palette-bg": "#fff",
          "command-palette-shadow": "rgba(0, 0, 0, 0.15)",
          "command-palette-input-border": "#e0e0e0",
          "command-palette-input-bg": "#f8f8f8",
          "command-item-hover-bg": "#f0f0f0",
          
          // Reorganize dialog
          "dialog-bg": "#fff",
          "dialog-shadow": "rgba(0, 0, 0, 0.15)",
          "dialog-header-bg": "#f8f8f8",
          "dialog-header-border": "#e0e0e0",
          "dialog-footer-bg": "#f8f8f8",
          "dialog-footer-border": "#e0e0e0",
          
          // Reorganize buttons
          "reorganize-button-bg": "#f5f5f5",
          "reorganize-button-border": "#e0e0e0",
          "reorganize-button-hover-bg": "#e8e8e8",
          "reorganize-button-active-bg": "#e0e0e0",
          
          // Overlay
          "overlay-bg": "rgba(0, 0, 0, 0.3)",
          
          // Recent projects
          "recent-projects-header-text": "#666",
          "recent-project-item-text": "#333",
          "recent-project-item-hover-bg": "rgba(0, 0, 0, 0.05)",
          "recent-project-item-active-bg": "rgba(0, 0, 0, 0.1)",
          
          // File tree
          "file-tree-item-hover-bg": "rgba(0, 0, 0, 0.05)",
          "file-tree-item-active-bg": "rgba(0, 0, 0, 0.1)",
          
          // JavaScript Dynamic Styles
          "git-branch-text": "#888",
          "tab-arrow-inactive-opacity": "0.5",
          "tab-arrow-active-opacity": "1"
        }
      };
      
      fs.writeFileSync(lightThemePath, JSON.stringify(lightTheme, null, 2), 'utf8');
    }
  }
  
  /**
   * Creates default dark theme
   * @private
   */
  _createDarkTheme() {
    const darkThemePath = path.join(this.themesPath, 'dark.json');
    if (!fs.existsSync(darkThemePath)) {
      const darkTheme = {
        manifest: {
          name: "dark",
          author: "Zen Editor",
          version: "1.0.0",
          description: "Default dark theme"
        },
        variables: {
          // Base colors
          "body-bg": "#1e1e1e",
          "body-text": "#cccccc",
          
          // Titlebar
          "titlebar-bg": "#252526",
          "titlebar-border": "#1e1e1e",
          "titlebar-text": "#cccccc",
          "window-control-hover-bg": "#333333",
          "window-control-close-hover-bg": "#c41e3a",
          
          // Sidebar
          "sidebar-bg": "#252526",
          "sidebar-border": "#1e1e1e",
          
          // Tabs
          "tabs-container-bg": "#252526",
          "tab-border": "#1e1e1e",
          "tab-active-bg": "#1e1e1e",
          "tab-text": "#cccccc",
          "tab-unsaved-indicator": "#4a9eff",
          
          // Scrollbars
          "scrollbar-thumb": "#424242",
          "scrollbar-thumb-translucent": "#4242428f",
          
          // Welcome screen
          "subtitle-text": "#999999",
          
          // Buttons
          "option-button-bg": "transparent",
          "option-button-text": "#cccccc",
          "option-button-hover-bg": "rgba(255, 255, 255, 0.1)",
          "option-button-active-bg": "rgba(255, 255, 255, 0.15)",
          
          // Settings panel
          "settings-panel-bg": "#252526",
          "settings-panel-border": "#333333",
          
          // Checkbox
          "checkbox-border": "#555555",
          "checkbox-bg": "#1e1e1e",
          "checkbox-checked-bg": "#4a9eff",
          "checkbox-label-text": "#cccccc",
          
          // Downbar
          "downbar-bg": "#252526",
          "downbar-border": "#1e1e1e",
          "downbar-active-icon": "#4a9eff",
          "downbar-icon-hover-filter": "brightness(1.5)",
          "downbar-icon-active-filter": "invert(48%) sepia(80%) saturate(2476%) hue-rotate(190deg) brightness(90%) contrast(95%)",
          
          // Icons
          "icon-filter": "invert(0.8)", // Invert for dark theme to make black icons white
          "icon-hover-filter": "invert(0.8) brightness(1.5)",
          "filetree-icon-filter": "invert(0.8) brightness(1.2)",
          
          // Command palette
          "command-palette-bg": "#252526",
          "command-palette-shadow": "rgba(0, 0, 0, 0.3)",
          "command-palette-input-border": "#333333",
          "command-palette-input-bg": "#3c3c3c",
          "command-item-hover-bg": "#2a2d2e",
          
          // Reorganize dialog
          "dialog-bg": "#252526",
          "dialog-shadow": "rgba(0, 0, 0, 0.3)",
          "dialog-header-bg": "#252526",
          "dialog-header-border": "#333333",
          "dialog-footer-bg": "#252526",
          "dialog-footer-border": "#333333",
          
          // Reorganize buttons
          "reorganize-button-bg": "#2d2d2d",
          "reorganize-button-border": "#3c3c3c",
          "reorganize-button-hover-bg": "#3c3c3c",
          "reorganize-button-active-bg": "#4a4a4a",
          
          // Overlay
          "overlay-bg": "rgba(0, 0, 0, 0.5)",
          
          // Recent projects
          "recent-projects-header-text": "#999999",
          "recent-project-item-text": "#cccccc",
          "recent-project-item-hover-bg": "rgba(255, 255, 255, 0.1)",
          "recent-project-item-active-bg": "rgba(255, 255, 255, 0.15)",
          
          // File tree
          "file-tree-item-hover-bg": "rgba(255, 255, 255, 0.1)",
          "file-tree-item-active-bg": "rgba(255, 255, 255, 0.15)",
          
          // JavaScript Dynamic Styles
          "git-branch-text": "#999999",
          "tab-arrow-inactive-opacity": "0.5",
          "tab-arrow-active-opacity": "1"
        }
      };
      
      fs.writeFileSync(darkThemePath, JSON.stringify(darkTheme, null, 2), 'utf8');
    }
  }
  
  /**
   * Set up file watchers for theme files
   * @private
   */
  _setupWatchers() {
    // Watch the themes directory for changes
    this.themeWatcher.watch(this.themesPath, (event) => {
      if (event.eventType === WatchEventType.MODIFY || event.eventType === WatchEventType.CREATE) {
        const themeFilePath = event.path;
        const themeFileName = path.basename(themeFilePath);
        
        // Get current theme path
        const currentThemePath = this._getCurrentThemePath();
        const currentThemeFileName = path.basename(currentThemePath);
        
        // Only reload if the current theme was modified
        if (themeFileName === currentThemeFileName) {
          this._loadTheme();
        }
      }
    }, { recursive: true });
  }
  
  /**
   * Gets the current theme path from settings
   * @private
   * @returns {string} Path to current theme file
   */
  _getCurrentThemePath() {
    const themeSettings = this.settings.get('theme');
    if (!themeSettings || !themeSettings.path) {
      // Default to light theme if not set
      this._initializeDefaultThemeSettings();
      return path.join(this.themesPath, 'light.json');
    }
    
    // Handle relative paths
    if (!path.isAbsolute(themeSettings.path)) {
      return path.join(this.themesPath, path.basename(themeSettings.path));
    }
    
    return themeSettings.path;
  }
  
  /**
   * Initializes default theme settings
   * @private
   */
  _initializeDefaultThemeSettings() {
    this.settings.set('theme', {
      name: 'light',
      path: 'themes/light.json'
    });
  }
  
  /**
   * Load and apply the current theme
   * @private
   */
  _loadTheme() {
    try {
      const themePath = this._getCurrentThemePath();
      
      if (!fs.existsSync(themePath)) {
        console.warn(`Theme file not found: ${themePath}, using default light theme`);
        this._createLightTheme();
        this.settings.set('theme', {
          name: 'light',
          path: 'themes/light.json'
        });
        return this._loadTheme();
      }
      
      const themeContent = fs.readFileSync(themePath, 'utf8');
      const theme = JSON.parse(themeContent);
      
      // Validate theme structure
      if (!theme.manifest || !theme.manifest.name || !theme.variables) {
        throw new Error('Invalid theme format: missing manifest or variables');
      }
      
      // Store the current theme
      this.currentTheme = theme;
      
      // Apply the theme
      this._applyTheme(theme);
      
      // Emit theme changed event
      this.emit('theme-changed', theme);
      
      return theme;
    } catch (error) {
      console.error('Error loading theme:', error);
      return null;
    }
  }
  
  /**
   * Apply theme by updating CSS variables
   * @private
   * @param {Object} theme - Theme object with variables
   */
  _applyTheme(theme) {
    // Send theme to renderer process to update CSS variables
    if (global.mainWindow && global.mainWindow.webContents) {
      global.mainWindow.webContents.send('apply-theme', theme.variables);
    }
  }
  
  /**
   * Switch to a different theme
   * @param {string} themeName - Name of the theme to switch to
   * @returns {boolean} - Success status
   */
  switchTheme(themeName) {
    try {
      // Find the theme file
      const themeFiles = fs.readdirSync(this.themesPath)
        .filter(file => file.endsWith('.json'));
      
      for (const file of themeFiles) {
        try {
          const filePath = path.join(this.themesPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const theme = JSON.parse(content);
          
          if (theme.manifest && theme.manifest.name === themeName) {
            // Update settings
            this.settings.set('theme', {
              name: themeName,
              path: `themes/${file}`
            });
            
            return true;
          }
        } catch (err) {
          // Skip invalid files
          console.warn(`Invalid theme file: ${file}`, err);
        }
      }
      
      console.warn(`Theme not found: ${themeName}`);
      return false;
    } catch (error) {
      console.error('Error switching theme:', error);
      return false;
    }
  }
  
  /**
   * Get list of available themes
   * @returns {Array} - List of available themes with metadata
   */
  getAvailableThemes() {
    try {
      const themeFiles = fs.readdirSync(this.themesPath)
        .filter(file => file.endsWith('.json'));
      
      const themes = [];
      
      for (const file of themeFiles) {
        try {
          const filePath = path.join(this.themesPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const theme = JSON.parse(content);
          
          if (theme.manifest) {
            themes.push({
              name: theme.manifest.name,
              author: theme.manifest.author,
              version: theme.manifest.version,
              description: theme.manifest.description,
              filename: file
            });
          }
        } catch (err) {
          // Skip invalid files
          console.warn(`Invalid theme file: ${file}`, err);
        }
      }
      
      return themes;
    } catch (error) {
      console.error('Error getting available themes:', error);
      return [];
    }
  }
  
  /**
   * Get the current theme
   * @returns {Object} - Current theme object
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
}

module.exports = new ThemeManager(); 