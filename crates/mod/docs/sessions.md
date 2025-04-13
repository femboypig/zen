# Sessions Module

The Sessions module manages application sessions for the Zen Editor, including recently opened projects and window state.

## Overview

This module provides persistent storage and management of session data with the following features:

- Tracking of most recently opened projects
- Current project persistence
- Window state (position, size, maximized) persistence
- JSON-based storage in the user data directory

## API Reference

### Session Management

#### `saveCurrentProject(projectPath)`

Saves the current project to session data and adds it to the recently opened projects list.

**Parameters:**
- `projectPath` (String): Path to the current project

**Returns:** String - The project path

**Example:**
```javascript
const sessions = require('./sessions');
sessions.saveCurrentProject('/path/to/project');
```

#### `getCurrentProject()`

Gets the current project from session data.

**Returns:** String - Path to the current project, or null if not set

**Example:**
```javascript
const currentProject = sessions.getCurrentProject();
if (currentProject) {
  console.log(`Reopening project: ${currentProject}`);
}
```

#### `getRecentProjects()`

Gets the list of recently opened projects.

**Returns:** Array - List of project paths, sorted by most recently used

**Example:**
```javascript
const recentProjects = sessions.getRecentProjects();
recentProjects.forEach((project, index) => {
  console.log(`${index + 1}: ${project}`);
});
```

#### `getAllSessions()`

Gets all session data.

**Returns:** Object - All session data including:
  - `lastOpenedProjects` (Array): Recently opened projects
  - `currentProject` (String): Current project path
  - `windowState` (Object): Window position and state

**Example:**
```javascript
const allSessions = sessions.getAllSessions();
console.log(JSON.stringify(allSessions, null, 2));
```

### Window State Management

#### `saveWindowState(windowState)`

Saves the window state (position, size, maximized).

**Parameters:**
- `windowState` (Object): Window state object with:
  - `maximized` (Boolean): Whether the window is maximized
  - `bounds` (Object): Window bounds with x, y, width, height

**Example:**
```javascript
sessions.saveWindowState({
  maximized: false,
  bounds: { x: 100, y: 200, width: 800, height: 600 }
});
```

#### `getWindowState()`

Gets the window state from session data.

**Returns:** Object - Window state with:
  - `maximized` (Boolean): Whether the window is maximized
  - `bounds` (Object): Window bounds with x, y, width, height

**Example:**
```javascript
const windowState = sessions.getWindowState();
if (windowState.maximized) {
  window.maximize();
} else {
  window.setBounds(windowState.bounds);
}
```

### Session Reset

#### `clearSessionData()`

Clears all session data and resets to defaults.

**Example:**
```javascript
sessions.clearSessionData();
```

## Data Storage

Session data is stored in a JSON file in the user's application data directory:

```
<user data path>/sessions.json
```

The user data path depends on the platform and is provided by Electron's `app.getPath('userData')`.

### Default Session Data

```javascript
const defaultSessionData = {
  lastOpenedProjects: [],
  currentProject: null,
  windowState: {
    maximized: false,
    bounds: { x: 0, y: 0, width: 1024, height: 768 }
  }
};
```

## Integration with Store Module

The Sessions module uses the Store module for some internal operations:

```javascript
const { getStoreValue, setStoreValue } = require('./store');
```

## Example Usage

```javascript
const sessions = require('./sessions');
const { app, BrowserWindow } = require('electron');

// Create a new window with saved dimensions
function createWindow() {
  const windowState = sessions.getWindowState();
  
  const win = new BrowserWindow({
    x: windowState.bounds.x,
    y: windowState.bounds.y,
    width: windowState.bounds.width,
    height: windowState.bounds.height
  });
  
  if (windowState.maximized) {
    win.maximize();
  }
  
  // Save current window state when closing
  win.on('close', () => {
    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? windowState.bounds : win.getBounds();
    
    sessions.saveWindowState({
      maximized: isMaximized,
      bounds: bounds
    });
  });
  
  // Open most recent project if available
  const currentProject = sessions.getCurrentProject();
  if (currentProject) {
    openProject(win, currentProject);
  }
}

// Add a recently opened project to the list
function openProject(win, projectPath) {
  sessions.saveCurrentProject(projectPath);
  // Load project...
}

app.on('ready', createWindow);
``` 