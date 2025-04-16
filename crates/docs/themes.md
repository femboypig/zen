# Zen Editor Theme System

## Overview

The Zen Editor theme system allows you to customize the look and feel of the editor through JSON theme files. Themes are stored in the same directory as the settings file and can be switched on-the-fly with hot-reload capability. The theme system supports default light and dark themes, as well as custom user-created themes.

## Theme File Structure

Theme files are stored in JSON format with the following structure:

```json
{
  "manifest": {
    "name": "theme_name",      // Unique name for the theme
    "author": "Author Name",   // Theme author
    "version": "1.0.0",        // Theme version
    "description": "Description of the theme"
  },
  "variables": {
    // CSS variables for styling
    "body-bg": "#ffffff",
    "body-text": "#333333",
    // ... other variables
  }
}
```

### Manifest

The `manifest` section contains metadata about the theme:

| Field | Description |
|-------|-------------|
| `name` | Unique identifier for the theme (used when switching themes) |
| `author` | Name of the theme creator |
| `version` | Theme version (semver format recommended) |
| `description` | Brief description of the theme |

### Variables

The `variables` section contains all the CSS variables that define the theme's appearance. These variables are applied directly to the `:root` CSS element.

## Theme Location

Themes are stored in the `themes` directory, which is located in the same directory as the settings file:

- **Linux**: `~/.local/share/zeneditor/themes/`
- **macOS**: `~/Library/Application Support/zeneditor/themes/`
- **Windows**: `%APPDATA%\zeneditor\themes\`
- **Other platforms**: `~/.zeneditor/themes/`

## Default Themes

The editor comes with two default themes:

1. **Light Theme** (`light.json`) - A default light color scheme
2. **Dark Theme** (`dark.json`) - A default dark color scheme

These themes are automatically created in the themes directory if they don't already exist.

## Creating Custom Themes

To create a custom theme:

1. Create a new JSON file in the themes directory (e.g., `my-theme.json`)
2. Follow the theme structure outlined above
3. Customize the CSS variables to your liking
4. Save the file

The new theme will be automatically detected by the editor and will be available in the command palette.

## Theme Variables Reference

Below is a comprehensive list of available theme variables grouped by UI element:

### Base Colors

| Variable | Description |
|----------|-------------|
| `body-bg` | Main background color |
| `body-text` | Default text color |

### Titlebar

| Variable | Description |
|----------|-------------|
| `titlebar-bg` | Titlebar background color |
| `titlebar-border` | Titlebar border color |
| `titlebar-text` | Titlebar text color |
| `window-control-hover-bg` | Background color when hovering window controls |
| `window-control-close-hover-bg` | Background color when hovering the close button |

### Sidebar

| Variable | Description |
|----------|-------------|
| `sidebar-bg` | Sidebar background color |
| `sidebar-border` | Sidebar border color |

### Tabs

| Variable | Description |
|----------|-------------|
| `tabs-container-bg` | Tab container background color |
| `tab-border` | Tab border color |
| `tab-active-bg` | Background color of the active tab |
| `tab-text` | Tab text color |
| `tab-unsaved-indicator` | Color of the unsaved indicator dot |
| `tab-arrow-inactive-opacity` | Opacity of inactive tab arrows |
| `tab-arrow-active-opacity` | Opacity of active tab arrows |

### Scrollbars

| Variable | Description |
|----------|-------------|
| `scrollbar-thumb` | Scrollbar thumb color |
| `scrollbar-thumb-translucent` | Semi-transparent scrollbar thumb color |

### Welcome Screen

| Variable | Description |
|----------|-------------|
| `subtitle-text` | Color of subtitle text on welcome screen |

### Buttons

| Variable | Description |
|----------|-------------|
| `option-button-bg` | Option button background color |
| `option-button-text` | Option button text color |
| `option-button-hover-bg` | Option button background color on hover |
| `option-button-active-bg` | Option button background color when active |

### Settings Panel

| Variable | Description |
|----------|-------------|
| `settings-panel-bg` | Settings panel background color |
| `settings-panel-border` | Settings panel border color |

### Checkbox

| Variable | Description |
|----------|-------------|
| `checkbox-border` | Checkbox border color |
| `checkbox-bg` | Checkbox background color |
| `checkbox-checked-bg` | Checkbox background color when checked |
| `checkbox-label-text` | Checkbox label text color |

### Downbar

| Variable | Description |
|----------|-------------|
| `downbar-bg` | Downbar background color |
| `downbar-border` | Downbar border color |
| `downbar-active-icon` | Downbar icon color when active (reference color) |
| `downbar-icon-hover-filter` | CSS filter applied to downbar icons on hover |
| `downbar-icon-active-filter` | CSS filter applied to active downbar icons |

### Icons

| Variable | Description |
|----------|-------------|
| `icon-filter` | CSS filter applied to all SVG icons |
| `icon-hover-filter` | CSS filter applied to icons on hover |
| `filetree-icon-filter` | CSS filter applied to file tree icons |

### Command Palette

| Variable | Description |
|----------|-------------|
| `command-palette-bg` | Command palette background color |
| `command-palette-shadow` | Command palette shadow color |
| `command-palette-input-border` | Command palette input border color |
| `command-palette-input-bg` | Command palette input background color |
| `command-item-hover-bg` | Command item background color on hover |

### Dialog

| Variable | Description |
|----------|-------------|
| `dialog-bg` | Dialog background color |
| `dialog-shadow` | Dialog shadow color |
| `dialog-header-bg` | Dialog header background color |
| `dialog-header-border` | Dialog header border color |
| `dialog-footer-bg` | Dialog footer background color |
| `dialog-footer-border` | Dialog footer border color |

### Reorganize Buttons

| Variable | Description |
|----------|-------------|
| `reorganize-button-bg` | Reorganize button background color |
| `reorganize-button-border` | Reorganize button border color |
| `reorganize-button-hover-bg` | Reorganize button background color on hover |
| `reorganize-button-active-bg` | Reorganize button background color when active |

### Overlay

| Variable | Description |
|----------|-------------|
| `overlay-bg` | Overlay background color |

### Recent Projects

| Variable | Description |
|----------|-------------|
| `recent-projects-header-text` | Recent projects header text color |
| `recent-project-item-text` | Recent project item text color |
| `recent-project-item-hover-bg` | Recent project item background color on hover |
| `recent-project-item-active-bg` | Recent project item background color when active |

### File Tree

| Variable | Description |
|----------|-------------|
| `file-tree-item-hover-bg` | File tree item background color on hover |
| `file-tree-item-active-bg` | File tree item background color when active |

### Git

| Variable | Description |
|----------|-------------|
| `git-branch-text` | Git branch text color |

## SVG Icon Theming

The theme system has special support for SVG icons to ensure they are correctly colored in both light and dark themes:

- **Light Theme**: No filter is applied by default
- **Dark Theme**: Icons are inverted to make black icons appear white

The following filters are used:

- `icon-filter`: Applied to all SVG icons
- `icon-hover-filter`: Applied to icons on hover
- `filetree-icon-filter`: Applied to file tree icons
- `downbar-icon-hover-filter`: Applied to downbar icons on hover
- `downbar-icon-active-filter`: Applied to active downbar icons

### Special Icons

Some icons are intentionally excluded from theming to preserve their original appearance:

- **Zen Logo**: The Zen Editor logo always maintains its original colors regardless of theme

## Hot-Reload

The theme system features hot-reload capabilities, which means changes to theme files are immediately applied without requiring an application restart. This makes theme development and customization much faster.

To modify a theme:

1. Open the theme JSON file in an editor
2. Make your changes
3. Save the file
4. The changes will be applied instantly

## Switching Themes

Themes can be switched using the command palette:

1. Press `Ctrl+Shift+P` to open the command palette
2. Type the name of the theme you want to switch to
3. Select the corresponding "Switch to <theme_name> Theme" command

The editor will automatically remember your selected theme between sessions.

## Integration with settings.json

The current theme is stored in the `settings.json` file with the following structure:

```json
{
  "theme": {
    "name": "dark",
    "path": "themes/dark.json"
  }
}
```

While it's possible to change this setting directly in the settings file, it's recommended to use the command palette for switching themes.

## Technical Implementation

The theme system is implemented using several components:

1. **ThemeManager** (`theme_manager.js`): Core module that loads and manages themes
2. **CSS Variables**: Themes define CSS variables that are used throughout the UI
3. **FileWatcher**: Native module that watches for theme file changes
4. **Preload Script**: Bridge between the theme manager and the UI

## Troubleshooting

If you experience issues with theming:

1. **Theme not applying properly**: Check that your theme JSON is properly formatted
2. **Icons not coloring correctly**: Ensure SVG filters are defined correctly in your theme
3. **Theme file not detected**: Verify the theme is in the correct directory
4. **Hot-reload not working**: Check file permissions and restart the editor

## Example: Custom Theme

Here's a simple example of a custom purple theme:

```json
{
  "manifest": {
    "name": "purple",
    "author": "Zen User",
    "version": "1.0.0",
    "description": "A purple theme for Zen Editor"
  },
  "variables": {
    "body-bg": "#2d1b4e",
    "body-text": "#e6e6fa",
    "titlebar-bg": "#3c2568",
    "titlebar-border": "#2d1b4e",
    "titlebar-text": "#e6e6fa",
    "window-control-hover-bg": "#4a2e82",
    "window-control-close-hover-bg": "#c41e3a",
    "sidebar-bg": "#3c2568",
    "sidebar-border": "#2d1b4e",
    "tabs-container-bg": "#3c2568",
    "tab-border": "#2d1b4e",
    "tab-active-bg": "#2d1b4e",
    "tab-text": "#e6e6fa",
    "tab-unsaved-indicator": "#9370db",
    "icon-filter": "invert(0.8) hue-rotate(90deg)",
    "icon-hover-filter": "invert(0.8) hue-rotate(90deg) brightness(1.5)",
    "filetree-icon-filter": "invert(0.8) hue-rotate(90deg) brightness(1.2)"
  }
}
``` 