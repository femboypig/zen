const fs = require('fs');
const path = require('path');
const os = require('os');
const events = require('events');

/**
 * @class Settings
 * @description Module for managing Zen Editor application settings
 */
class Settings extends events.EventEmitter {
  constructor() {
    super();
    this.settingsPath = this._getSettingsPath();
    this.defaults = {
      ui_font_size: 16
    };
    this.MIN_FONT_SIZE = 6;
    this.MAX_FONT_SIZE = 32;
    this.settings = null;
    this.watcher = null;
    this._ensureSettingsDirectoryExists();
    this._loadSettings();
    this._setupFileWatcher();
  }

  /**
   * Returns the path to settings file based on platform
   * @private
   * @returns {string} Path to settings file
   */
  _getSettingsPath() {
    const platform = process.platform;
    let settingsPath;
    
    if (platform === 'linux') {
      /* ~/.local/share/zeneditor/settings.json for Linux */
      settingsPath = path.join(os.homedir(), '.local', 'share', 'zeneditor', 'settings.json');
    } else if (platform === 'darwin') {
      /* ~/Library/Application Support/zeneditor/settings.json for macOS */
      settingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'zeneditor', 'settings.json');
    } else if (platform === 'win32') {
      /* %APPDATA%\zeneditor\settings.json for Windows */
      settingsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'zeneditor', 'settings.json');
    } else {
      /* Fallback to home directory */
      settingsPath = path.join(os.homedir(), '.zeneditor', 'settings.json');
    }
    
    return settingsPath;
  }

  /**
   * Creates settings directory if it doesn't exist
   * @private
   */
  _ensureSettingsDirectoryExists() {
    const settingsDir = path.dirname(this.settingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }
  }

  /**
   * Sets up a file watcher to detect external changes to settings.json
   * @private
   */
  _setupFileWatcher() {
    /* Remove existing watcher if it exists */
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    /* Set up new watcher */
    try {
      this.watcher = fs.watch(this.settingsPath, (eventType) => {
        if (eventType === 'change') {
          /* Small delay to ensure file writing is complete */
          setTimeout(() => {
            const oldSettings = { ...this.settings };
            this._loadSettings();
            /* Emit change event with old and new settings */
            this.emit('change', this.settings, oldSettings);
          }, 100);
        }
      });
    } catch (error) {
      console.error('Error setting up settings file watcher:', error);
    }
  }

  /**
   * Loads settings from file
   * @private
   */
  _loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const fileContent = fs.readFileSync(this.settingsPath, 'utf8');
        const cleanedJson = this._stripJsonComments(fileContent);
        
        try {
          this.settings = JSON.parse(cleanedJson);
          
          /* Apply min/max constraints to font size */
          if (this.settings.ui_font_size) {
            this.settings.ui_font_size = this._clampFontSize(this.settings.ui_font_size);
          }
        } catch (parseError) {
          console.error('JSON parsing error, using defaults:', parseError);
          /* If parsing fails, use defaults instead of crashing */
          this.settings = { ...this.defaults };
          /* Create a backup of the corrupted file for debugging */
          const backupPath = `${this.settingsPath}.backup.${Date.now()}`;
          fs.writeFileSync(backupPath, fileContent, 'utf8');
          console.log(`Corrupted settings file backed up to ${backupPath}`);
          /* Rewrite the settings file with the defaults */
          this._saveSettings();
        }
      } else {
        this.settings = { ...this.defaults };
        this._saveSettings();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...this.defaults };
    }
  }

  /**
   * Removes comments from JSON string
   * @private
   * @param {string} jsonString - JSON string with comments
   * @returns {string} JSON string without comments
   */
  _stripJsonComments(jsonString) {
    try {
      /* First remove multi-line comments (/* ... * /) */
      let result = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
      
      /* Then remove single-line comments (//...) */
      result = result.replace(/\/\/.*$/gm, '');
      
      /* Remove any blank lines that might remain */
      result = result.replace(/^\s*[\r\n]/gm, '');
      
      return result;
    } catch (error) {
      console.error('Error stripping JSON comments:', error);
      return jsonString;
    }
  }

  /**
   * Ensures font size is within min-max constraints
   * @private
   * @param {number} size - Font size to clamp
   * @returns {number} Clamped font size
   */
  _clampFontSize(size) {
    return Math.min(Math.max(size, this.MIN_FONT_SIZE), this.MAX_FONT_SIZE);
  }

  /**
   * Saves settings to file
   * @private
   */
  _saveSettings() {
    try {
      /* Temporarily remove file watcher to avoid triggering it */
      if (this.watcher) {
        this.watcher.close();
        this.watcher = null;
      }

      /* Create settings file template with comments */
      const template = `/* Zen Editor Settings
 * This file is automatically created and updated by the application.
 * You can edit it manually, but be careful with JSON formatting.
 * Comments are supported but must be outside of JSON values.
 */

{
  /* UI font size in pixels (Min: ${this.MIN_FONT_SIZE}, Max: ${this.MAX_FONT_SIZE}) */
  "ui_font_size": ${this.settings.ui_font_size}
}`;

      fs.writeFileSync(this.settingsPath, template, 'utf8');
      
      /* Restore file watcher */
      this._setupFileWatcher();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Gets a setting value
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value if setting is not found
   * @returns {*} Setting value
   */
  get(key, defaultValue = null) {
    if (!this.settings) {
      this._loadSettings();
    }
    
    return key in this.settings 
      ? this.settings[key] 
      : (defaultValue !== null ? defaultValue : this.defaults[key]);
  }

  /**
   * Sets a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  set(key, value) {
    if (!this.settings) {
      this._loadSettings();
    }
    
    /* Apply special constraints for specific settings */
    if (key === 'ui_font_size') {
      value = this._clampFontSize(value);
    }
    
    this.settings[key] = value;
    this._saveSettings();
  }

  /**
   * Resets a setting to its default value
   * @param {string} key - Setting key
   */
  reset(key) {
    if (key in this.defaults) {
      this.set(key, this.defaults[key]);
    }
  }

  /**
   * Resets all settings to default values
   */
  resetAll() {
    this.settings = { ...this.defaults };
    this._saveSettings();
  }
}

module.exports = new Settings(); 