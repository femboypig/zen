# Git Utils Module

The Git Utils module provides Git integration for the Zen Editor, allowing it to detect and monitor Git repositories.

## Overview

This module provides Git functionality through a Rust-based Git module with the following features:

- Detection of Git repositories
- Branch name retrieval
- Automatic branch change detection
- Event emission for Git-related changes

## Class: GitUtils

Extends the Node.js EventEmitter class to provide events when Git states change.

### Constructor

```javascript
const gitUtils = require('./git_utils');
```

The module exports a singleton instance, so there's no need to create a new instance.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentProjectPath` | String | Path to the current project being tracked |
| `isGitRepo` | Boolean | Whether the current project is a Git repository |
| `currentBranch` | String | Name of the current Git branch |

### Methods

#### `initProject(projectPath)`

Initializes Git tracking for a project directory.

**Parameters:**
- `projectPath` (String): Path to the project directory

**Returns:** Object with Git information
  - `isGitRepo` (Boolean): Whether the directory is a Git repository
  - `branchName` (String): Current branch name (or null if not a Git repository)

**Example:**
```javascript
const gitInfo = gitUtils.initProject('/path/to/project');
console.log(`Is Git repo: ${gitInfo.isGitRepo}`);
console.log(`Current branch: ${gitInfo.branchName}`);
```

#### `startWatching()`

Starts watching for Git changes (like branch changes). Automatically called by `initProject()` if the project is a Git repository.

**Example:**
```javascript
gitUtils.startWatching();
```

#### `stopWatching()`

Stops watching for Git changes.

**Example:**
```javascript
gitUtils.stopWatching();
```

#### `getCurrentInfo()`

Gets the current Git information.

**Returns:** Object with Git information
  - `isGitRepo` (Boolean): Whether the directory is a Git repository
  - `branchName` (String): Current branch name (or null if not a Git repository)

**Example:**
```javascript
const gitInfo = gitUtils.getCurrentInfo();
console.log(`Current branch: ${gitInfo.branchName}`);
```

### Events

The GitUtils class extends EventEmitter and emits the following events:

#### `branch-changed`

Emitted when the Git branch changes.

**Event Data:**
- `oldBranch` (String): Previous branch name
- `newBranch` (String): New branch name

**Example:**
```javascript
gitUtils.on('branch-changed', ({ oldBranch, newBranch }) => {
  console.log(`Switched from ${oldBranch} to ${newBranch}`);
});
```

## Integration with Rust

This module uses a Rust-based Git implementation for better performance:

```javascript
const gitModule = require('../git');
```

The Rust module provides the following core functionality:
- Checking if a directory is a Git repository
- Getting the current branch name
- Monitoring for branch changes

## Example Usage

```javascript
const gitUtils = require('./git_utils');

// Initialize Git tracking for a project
const gitInfo = gitUtils.initProject('/path/to/project');

if (gitInfo.isGitRepo) {
  console.log(`Working on branch: ${gitInfo.branchName}`);
  
  // Listen for branch changes
  gitUtils.on('branch-changed', ({ oldBranch, newBranch }) => {
    console.log(`Switched from ${oldBranch} to ${newBranch}`);
    // Update UI or perform other actions
  });
}

// Later, when closing the project
gitUtils.stopWatching();
``` 