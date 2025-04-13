const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * @class Store
 * @description Lightweight, on-demand state storage module for Zen Editor
 * Only loads data when explicitly called to minimize memory usage
 */
class Store {
  constructor() {
    this.storePath = this._getStorePath();
    this._ensureStoreDirectoryExists();
  }

  /**
   * Returns the path to store.json file (same directory as settings.json)
   * @private
   * @returns {string} Path to store.json file
   */
  _getStorePath() {
    const platform = process.platform;
    let storePath;
    
    if (platform === 'linux') {
      storePath = path.join(os.homedir(), '.local', 'share', 'zeneditor', 'store.json');
    } else if (platform === 'darwin') {
      storePath = path.join(os.homedir(), 'Library', 'Application Support', 'zeneditor', 'store.json');
    } else if (platform === 'win32') {
      storePath = path.join(os.homedir(), 'AppData', 'Roaming', 'zeneditor', 'store.json');
    } else {
      storePath = path.join(os.homedir(), '.zeneditor', 'store.json');
    }
    
    return storePath;
  }

  /**
   * Creates store directory if it doesn't exist
   * @private
   */
  _ensureStoreDirectoryExists() {
    const storeDir = path.dirname(this.storePath);
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    }
  }

  /**
   * Gets a value from the store (loads from disk on demand)
   * @param {string} key - The key to get
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} The stored value or defaultValue
   */
  get(key, defaultValue = null) {
    const data = this._loadData();
    return data.hasOwnProperty(key) ? data[key] : defaultValue;
  }

  /**
   * Sets a value in the store
   * @param {string} key - The key to set
   * @param {*} value - The value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      const data = this._loadData();
      data[key] = value;
      this._saveData(data);
      return true;
    } catch (error) {
      console.error('Error setting store value:', error);
      return false;
    }
  }

  /**
   * Removes a key from the store
   * @param {string} key - The key to remove
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      const data = this._loadData();
      if (data.hasOwnProperty(key)) {
        delete data[key];
        this._saveData(data);
      }
      return true;
    } catch (error) {
      console.error('Error removing store value:', error);
      return false;
    }
  }

  /**
   * Checks if a key exists in the store
   * @param {string} key - The key to check
   * @returns {boolean} Whether the key exists
   */
  has(key) {
    const data = this._loadData();
    return data.hasOwnProperty(key);
  }

  /**
   * Loads data from disk only when needed
   * @private
   * @returns {Object} The stored data
   */
  _loadData() {
    try {
      if (fs.existsSync(this.storePath)) {
        const fileContent = fs.readFileSync(this.storePath, 'utf8');
        return JSON.parse(fileContent);
      }
      return {};
    } catch (error) {
      console.error('Error loading store data:', error);
      return {};
    }
  }

  /**
   * Saves data to disk
   * @private
   * @param {Object} data - The data to save
   */
  _saveData(data) {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving store data:', error);
    }
  }
}

// Export a singleton instance
module.exports = new Store();
