# UI Scaling Module

The UI Scaling module manages font sizes and UI scaling throughout the Zen Editor application.

## Overview

This module provides control over the UI scaling using a rem-based approach with the following features:

- Window-specific scaling overrides
- Global scaling through settings
- Keyboard shortcuts for zooming
- Persistence across sessions
- Consistent scaling of all UI elements (fonts, spacing, icons)

## Class: UiScaling

### Constructor

```javascript
const uiScaling = require('./ui_scaling');
```

The module exports a singleton instance, so there's no need to create a new instance.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `MIN_REM_SIZE` | Number | Minimum allowed rem size, inherited from settings |
| `MAX_REM_SIZE` | Number | Maximum allowed rem size, inherited from settings |
| `windowRemSizeOverrides` | Map | Current rem size overrides for each window |
| `windows` | Set | List of tracked window IDs |

### Methods

#### `initWindow(window)`

Initializes scaling handling for a window.

**Parameters:**
- `window` (BrowserWindow): Electron window to initialize

**Example:**
```javascript
const win = new BrowserWindow({ width: 800, height: 600 });
uiScaling.initWindow(win);
```

#### `getRemSize(windowOrId)`

Returns the rem size for the specified window.

**Parameters:**
- `windowOrId` (BrowserWindow|Number): Window object or window ID

**Returns:** Number - Current rem size

**Example:**
```javascript
const remSize = uiScaling.getRemSize(win);
console.log(`Current font size: ${remSize}px`);
```

#### `setRemSize(windowOrId, size)`

Sets the rem size for the specified window.

**Parameters:**
- `windowOrId` (BrowserWindow|Number): Window object or window ID
- `size` (Number): New rem size

**Example:**
```javascript
uiScaling.setRemSize(win, 18); // Set to 18px
```

#### `resetRemSize(windowOrId)`

Resets rem size override for a window and reverts to settings.

**Parameters:**
- `windowOrId` (BrowserWindow|Number): Window object or window ID

**Example:**
```javascript
uiScaling.resetRemSize(win);
```

#### `increaseRemSize(windowOrId, increment = 1)`

Increases rem size for a window.

**Parameters:**
- `windowOrId` (BrowserWindow|Number): Window object or window ID
- `increment` (Number, optional): Amount to increase (default 1)

**Example:**
```javascript
uiScaling.increaseRemSize(win, 2); // Increase by 2px
```

#### `decreaseRemSize(windowOrId, decrement = 1)`

Decreases rem size for a window.

**Parameters:**
- `windowOrId` (BrowserWindow|Number): Window object or window ID
- `decrement` (Number, optional): Amount to decrease (default 1)

**Example:**
```javascript
uiScaling.decreaseRemSize(win); // Decrease by 1px
```

#### `saveToSettings(windowOrId)`

Saves current rem size to settings, making it the default for all windows.

**Parameters:**
- `windowOrId` (BrowserWindow|Number): Window object or window ID

**Example:**
```javascript
uiScaling.saveToSettings(win);
```

#### `updateAllWindows()`

Updates UI of all open windows when settings change.

**Example:**
```javascript
uiScaling.updateAllWindows();
```

## Integration with Electron

The module sends UI scaling information to renderer processes using Electron's IPC:

```javascript
window.webContents.send('update-ui-scaling', {
  remSize,
  titleBarHeight,
  svgScaleFactor,
  iconSize,
  baseFontSize,
  smallFontSize,
  // ...other derived values
});
```

The renderer process should listen for the `update-ui-scaling` event and apply the scaling values to the CSS.

## Integration with Settings

The UI Scaling module uses the Settings module for default values and persistence:

```javascript
const settings = require('./settings');
```

Changes to settings are automatically detected and applied to all windows:

```javascript
settings.on('change', (newSettings, oldSettings) => {
  if (newSettings.ui_font_size !== oldSettings.ui_font_size) {
    this.updateAllWindows();
  }
});
```

## Example Usage

### Main Process

```javascript
const { app, BrowserWindow } = require('electron');
const uiScaling = require('./ui_scaling');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  win.loadFile('index.html');
  
  // Initialize UI scaling for this window
  uiScaling.initWindow(win);
  
  // Set up keyboard shortcuts for zooming
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key === '=') {
      uiScaling.increaseRemSize(win);
      event.preventDefault();
    } else if (input.control && input.key === '-') {
      uiScaling.decreaseRemSize(win);
      event.preventDefault();
    } else if (input.control && input.key === '0') {
      uiScaling.resetRemSize(win);
      event.preventDefault();
    }
  });
}

app.whenReady().then(createWindow);
```

### Renderer Process

```javascript
const { ipcRenderer } = require('electron');

// Apply UI scaling when received from main process
ipcRenderer.on('update-ui-scaling', (event, scaling) => {
  document.documentElement.style.fontSize = `${scaling.remSize}px`;
  document.documentElement.style.setProperty('--title-bar-height', `${scaling.titleBarHeight}px`);
  document.documentElement.style.setProperty('--icon-size', `${scaling.iconSize}px`);
  document.documentElement.style.setProperty('--base-spacing', `${scaling.baseSpacing}px`);
  // ... other CSS variables
});
``` 