/**
 * File system utilities module
 * 
 * This module provides utility functions for working with the file system
 * using our Rust-based fs module.
 */

const fsModule = require('../fs');
const path = require('path');

// Cache for project file tree to avoid recalculating on every request
let fileTreeCache = null;
let projectPathCache = null;

// Callback to forward file change events
let fileChangeCallback = null;

/**
 * Open a project directory and return its file tree
 * 
 * @param {string} projectPath - Path to the project directory
 * @returns {Object} Project info with path and file tree
 */
function openProject(projectPath) {
  if (!projectPath) {
    throw new Error('Project path is required');
  }
  
  try {
    // Get file tree from Rust module
    const fileTree = fsModule.openProject(projectPath);
    
    // Update cache
    fileTreeCache = fileTree;
    projectPathCache = projectPath;
    
    // Initialize file watcher
    // We provide the handleFileChange function as the callback
    fsModule.watchProject(projectPath, handleFileChange);
    
    return {
      path: projectPath,
      fileTree
    };
  } catch (error) {
    console.error('Error opening project:', error);
    throw error;
  }
}

/**
 * Set a callback for file system changes
 *
 * @param {Function} callback - Function to call when files change
 */
function setFileChangeCallback(callback) {
  fileChangeCallback = callback;
}

/**
 * Handle file system change events
 * 
 * @param {Error|null} error - Error object if there was an error
 * @param {Object} event - File change event with path and kind
 */
function handleFileChange(error, event) {
  if (error) {
    console.error('File watcher error:', error);
    return;
  }
  
  console.log('File change detected:', event);
  
  // Clear cache for the affected directory
  const dirPath = path.dirname(event.path);
  
  // Invalidate file tree cache entirely for now
  fileTreeCache = null;
  
  // Forward the event to any registered callback
  if (fileChangeCallback) {
    fileChangeCallback(event);
  }
}

/**
 * Watch a project directory for changes
 * 
 * @param {string} projectPath - Path to the project directory
 * @param {Function} callback - Function to call when files change
 */
function watchProject(projectPath, callback) {
  try {
    console.log('Setting up file watcher for:', projectPath);
    
    // Store the callback so file changes from Rust get forwarded properly
    setFileChangeCallback(callback);
    
    // Start watching with our Rust module
    return fsModule.watchProject(projectPath, (error, event) => {
      // This function gets called when a file system event occurs in the Rust module
      if (error) {
        console.error('Error in file watcher:', error);
        return;
      }
      
      console.log('File system event received from Rust:', event);
      
      // Make sure event bubbles up to the main process
      if (callback) {
        callback(event);
      }
    });
  } catch (error) {
    console.error('Error watching project:', error);
    throw error;
  }
}

/**
 * Get the contents of a directory
 * 
 * @param {string} dirPath - Path to the directory
 * @returns {Array} Array of file entries
 */
function getDirectoryContents(dirPath) {
  try {
    return fsModule.getDirectoryContents(dirPath);
  } catch (error) {
    console.error('Error getting directory contents:', error);
    throw error;
  }
}

/**
 * Expand a directory to get its contents
 * 
 * @param {string} dirPath - Path to the directory to expand
 * @returns {Array} Array of file entries in the directory
 */
function expandDirectory(dirPath) {
  try {
    return fsModule.expandDirectory(dirPath);
  } catch (error) {
    console.error('Error expanding directory:', error);
    throw error;
  }
}

/**
 * Read the contents of a file
 * 
 * @param {string} filePath - Path to the file
 * @returns {string} File contents
 */
function readFileContents(filePath) {
  try {
    return fsModule.readFileContents(filePath);
  } catch (error) {
    console.error('Error reading file contents:', error);
    throw error;
  }
}

/**
 * Stop watching a project
 * 
 * @param {string} projectPath - Path to the project to stop watching
 * @returns {boolean} True if stopped successfully, false if not watching
 */
function stopWatching(projectPath) {
  try {
    fileChangeCallback = null;
    return fsModule.stopWatching(projectPath);
  } catch (error) {
    console.error('Error stopping file watcher:', error);
    throw error;
  }
}

/**
 * Get cached file tree if available
 * 
 * @returns {Object|null} Cached file tree or null if not available
 */
function getCachedFileTree() {
  return fileTreeCache;
}

/**
 * Get cached project path if available
 * 
 * @returns {string|null} Cached project path or null if not available
 */
function getCachedProjectPath() {
  return projectPathCache;
}

/**
 * Clear file tree cache
 */
function clearCache() {
  fileTreeCache = null;
  projectPathCache = null;
}

module.exports = {
  openProject,
  getDirectoryContents,
  expandDirectory,
  readFileContents,
  stopWatching,
  getCachedFileTree,
  getCachedProjectPath,
  clearCache,
  watchProject
}; 