const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { getStoreValue, setStoreValue } = require('./store');

// Sessions module for managing application sessions
// Handles persistent storage of session data including most recently opened projects

const userDataPath = app.getPath('userData');
const SESSIONS_FILE = path.join(userDataPath, 'sessions.json');

// Default session data
const defaultSessionData = {
  lastOpenedProjects: [],
  currentProject: null,
  windowState: {
    maximized: false,
    bounds: { x: 0, y: 0, width: 1024, height: 768 }
  }
};

// Read session data from file
function readSessionData() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const fileData = fs.readFileSync(SESSIONS_FILE, 'utf8');
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.error('Error reading sessions file:', err);
  }
  
  return defaultSessionData;
}

// Write session data to file
function writeSessionData(data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(SESSIONS_FILE, jsonData, 'utf8');
  } catch (err) {
    console.error('Error writing sessions file:', err);
  }
}

// Get all session data
function getAllSessions() {
  return readSessionData();
}

// Save the current project to session data
function saveCurrentProject(projectPath) {
  const sessionData = readSessionData();
  
  // Update current project
  sessionData.currentProject = projectPath;
  
  // Add to last opened projects list (avoiding duplicates)
  const existingIndex = sessionData.lastOpenedProjects.indexOf(projectPath);
  if (existingIndex !== -1) {
    // Remove from current position
    sessionData.lastOpenedProjects.splice(existingIndex, 1);
  }
  
  // Add to front of list
  sessionData.lastOpenedProjects.unshift(projectPath);
  
  // Limit list to 10 items
  if (sessionData.lastOpenedProjects.length > 10) {
    sessionData.lastOpenedProjects = sessionData.lastOpenedProjects.slice(0, 10);
  }
  
  // Write updated data
  writeSessionData(sessionData);
  
  return projectPath;
}

// Get the current project from session data
function getCurrentProject() {
  const sessionData = readSessionData();
  return sessionData.currentProject;
}

// Get list of recently opened projects
function getRecentProjects() {
  const sessionData = readSessionData();
  return sessionData.lastOpenedProjects;
}

// Save window state (position, size, maximized)
function saveWindowState(windowState) {
  const sessionData = readSessionData();
  sessionData.windowState = windowState;
  writeSessionData(sessionData);
}

// Get window state
function getWindowState() {
  const sessionData = readSessionData();
  return sessionData.windowState || defaultSessionData.windowState;
}

// Clear session data (reset to defaults)
function clearSessionData() {
  writeSessionData(defaultSessionData);
}

module.exports = {
  saveCurrentProject,
  getCurrentProject,
  getRecentProjects,
  saveWindowState,
  getWindowState,
  clearSessionData,
  getAllSessions
}; 