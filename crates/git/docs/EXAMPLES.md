# Examples

This document contains code examples for common use cases of the Git module. These examples demonstrate how to use the module effectively in real-world scenarios.

## Table of Contents

1. [Repository Management](#repository-management)
2. [File Operations](#file-operations)
3. [Commits and History](#commits-and-history)
4. [Branch Operations](#branch-operations)
5. [Tag Management](#tag-management)
6. [Advanced Examples](#advanced-examples)

## Repository Management

### Find the Nearest Repository

This example demonstrates how to find a Git repository starting from a specific path:

```javascript
const { findRepository } = require('git-module');

// Find repository from current directory
try {
  const repo = findRepository(process.cwd());
  console.log('Repository found!');
  
  // Now you can use the repository
  const headCommit = repo.getHeadCommitHash();
  console.log(`HEAD commit: ${headCommit}`);
  
  const branch = repo.getCurrentBranch();
  console.log(`Current branch: ${branch}`);
} catch (error) {
  console.error('No repository found:', error.message);
}
```

### Clone a Repository

This example shows how to clone a remote repository:

```javascript
const { cloneRepository } = require('git-module');
const path = require('path');

// Clone repository
const repoUrl = 'https://github.com/username/repo.git';
const targetDir = path.join(__dirname, 'cloned-repo');

try {
  const repo = cloneRepository(repoUrl, targetDir);
  console.log('Repository cloned successfully');
  
  // Get the remote URL to verify
  const remoteUrl = repo.getRemoteUrl('origin');
  console.log(`Remote URL: ${remoteUrl}`);
} catch (error) {
  console.error('Failed to clone repository:', error.message);
}
```

### Initialize a New Repository

This example demonstrates how to initialize a new Git repository:

```javascript
const { initRepository } = require('git-module');
const path = require('path');
const fs = require('fs');

// Create directory for new repository
const repoDir = path.join(__dirname, 'new-repo');
if (!fs.existsSync(repoDir)) {
  fs.mkdirSync(repoDir, { recursive: true });
}

// Initialize repository
try {
  const repo = initRepository(repoDir);
  console.log('Repository initialized successfully');
  
  // Create a file
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# New Repository\n\nThis is a new repository.');
  
  // Add and commit the file
  repo.addAll();
  const commitHash = repo.commit('Initial commit', 'Author Name', 'author@example.com');
  console.log(`Created initial commit: ${commitHash}`);
} catch (error) {
  console.error('Failed to initialize repository:', error.message);
}
```

## File Operations

### Get File Metadata

This example shows how to get metadata for a specific file:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Get metadata for a specific file
  const filePath = 'src/index.js'; // Path relative to repository root
  const metadata = repo.getFileMetadata(filePath);
  
  console.log(`File: ${metadata.path}`);
  console.log(`Last commit: ${metadata.lastCommitHash.substr(0, 8)}`);
  console.log(`Author: ${metadata.lastAuthorName} <${metadata.lastAuthorEmail}>`);
  console.log(`Date: ${new Date(metadata.lastCommitTime * 1000).toLocaleString()}`);
  console.log(`Message: ${metadata.lastCommitMessage.split('\n')[0]}`);
  console.log(`Changes: +${metadata.addedLines}, -${metadata.deletedLines}`);
} catch (error) {
  console.error('Error:', error.message);
}
```

### List Files with Metadata

This example demonstrates how to list all files in a repository with their metadata:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Get metadata for all files in the repository
  const files = repo.listFilesWithMetadata(null);
  
  console.log(`Found ${files.length} files:`);
  
  // Filter out .git files
  const nonGitFiles = files.filter(file => !file.path.startsWith('.git/'));
  
  // Sort by last commit time, newest first
  nonGitFiles.sort((a, b) => b.lastCommitTime - a.lastCommitTime);
  
  // Display the 10 most recently modified files
  nonGitFiles.slice(0, 10).forEach(file => {
    const date = new Date(file.lastCommitTime * 1000).toLocaleString();
    console.log(`${file.path} - last modified ${date} by ${file.lastAuthorName}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}
```

### Get File Status

This example shows how to get the status of files in a repository:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Get status of all files
  const statuses = repo.getFileStatus();
  
  // Group files by status
  const newFiles = statuses.filter(s => s.isNew);
  const modifiedFiles = statuses.filter(s => s.isModified);
  const deletedFiles = statuses.filter(s => s.isDeleted);
  
  console.log(`New files (${newFiles.length}):`);
  newFiles.forEach(file => console.log(` - ${file.path}`));
  
  console.log(`\nModified files (${modifiedFiles.length}):`);
  modifiedFiles.forEach(file => console.log(` - ${file.path}`));
  
  console.log(`\nDeleted files (${deletedFiles.length}):`);
  deletedFiles.forEach(file => console.log(` - ${file.path}`));
} catch (error) {
  console.error('Error:', error.message);
}
```

## Commits and History

### Get File History

This example demonstrates how to get the complete history of a file:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Get history for a specific file
  const filePath = 'src/index.js';
  const history = repo.getFileHistory(filePath);
  
  console.log(`Found ${history.length} commits for ${filePath}:`);
  
  history.forEach((commit, index) => {
    const date = new Date(commit.commitTime * 1000).toLocaleString();
    console.log(`\n[${index + 1}] Commit: ${commit.commitHash.substr(0, 8)}`);
    console.log(`Date: ${date}`);
    console.log(`Author: ${commit.authorName} <${commit.authorEmail}>`);
    console.log(`Changes: +${commit.addedLines}, -${commit.deletedLines}`);
    console.log(`Message: ${commit.commitMessage.split('\n')[0]}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}
```

### Create a Commit

This example shows how to create a new commit:

```javascript
const { findRepository } = require('git-module');
const fs = require('fs');
const path = require('path');

try {
  const repo = findRepository(process.cwd());
  
  // Create or modify a file
  const filePath = path.join(process.cwd(), 'README.md');
  fs.appendFileSync(filePath, '\n\nUpdated: ' + new Date().toISOString());
  
  // Stage all changes
  repo.addAll();
  
  // Create a commit
  const commitHash = repo.commit(
    'Update README.md', 
    'John Doe',
    'john@example.com'
  );
  
  console.log(`Created commit: ${commitHash}`);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Branch Operations

### Create and Checkout a Branch

This example demonstrates how to create and checkout a new branch:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Get current branch
  const currentBranch = repo.getCurrentBranch();
  console.log(`Current branch: ${currentBranch}`);
  
  // Create a new branch from HEAD
  const newBranchName = 'feature/new-feature';
  repo.createBranch(newBranchName, null);
  console.log(`Created branch: ${newBranchName}`);
  
  // Checkout the new branch
  repo.checkoutBranch(newBranchName);
  
  // Verify the checkout
  const newCurrentBranch = repo.getCurrentBranch();
  console.log(`New current branch: ${newCurrentBranch}`);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Tag Management

### Create and List Tags

This example shows how to create and list tags:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Get existing tags
  let tags = repo.listTags();
  console.log(`Found ${tags.length} existing tags:`);
  tags.forEach(tag => {
    console.log(`- ${tag.name} (${tag.targetCommit.substr(0, 8)})`);
  });
  
  // Create a new annotated tag
  const tagName = `v1.0.0-${Date.now()}`;
  const tagId = repo.createTag(
    tagName,
    'Version 1.0.0 release',
    null // Use HEAD
  );
  
  console.log(`\nCreated tag ${tagName} with ID ${tagId}`);
  
  // List tags again
  tags = repo.listTags();
  console.log(`\nNow have ${tags.length} tags:`);
  tags.forEach(tag => {
    console.log(`- ${tag.name} (${tag.targetCommit.substr(0, 8)}) - ${tag.message}`);
  });
  
  // Delete the tag
  repo.deleteTag(tagName);
  console.log(`\nDeleted tag ${tagName}`);
  
  // Verify deletion
  tags = repo.listTags();
  console.log(`Now have ${tags.length} tags`);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Advanced Examples

### File History with Diffs

This example shows how to get the history of a file and display statistics about each commit:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  const targetFile = 'src/index.js';
  console.log(`Getting history for ${targetFile}`);
  
  // Get file history
  const history = repo.getFileHistory(targetFile);
  
  if (history.length === 0) {
    console.log('No history found for this file');
    return;
  }
  
  console.log(`Found ${history.length} commits:`);
  
  // Track file growth over time
  let totalLines = 0;
  
  // Display history in reverse chronological order (oldest first)
  history.reverse().forEach((commit, index) => {
    const date = new Date(commit.commitTime * 1000).toLocaleString();
    
    // Update line count
    totalLines += commit.addedLines - commit.deletedLines;
    
    console.log(`\n[${index + 1}] ${date} - ${commit.commitHash.substr(0, 8)}`);
    console.log(`Author: ${commit.authorName}`);
    console.log(`Message: ${commit.commitMessage.split('\n')[0]}`);
    console.log(`Changes: +${commit.addedLines}, -${commit.deletedLines}`);
    console.log(`File size: ~${totalLines} lines`);
  });
} catch (error) {
  console.error('Error:', error.message);
}
```

### Find Most Active Contributors

This example identifies the most active contributors to a repository:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Get all files and their metadata
  const files = repo.listFilesWithMetadata(null)
    .filter(file => !file.path.startsWith('.git/'));
  
  // Count contributions by author
  const authors = {};
  
  files.forEach(file => {
    const author = file.lastAuthorName;
    if (!author) return;
    
    if (!authors[author]) {
      authors[author] = {
        name: author,
        email: file.lastAuthorEmail,
        files: 0,
        additions: 0,
        deletions: 0
      };
    }
    
    authors[author].files++;
    authors[author].additions += file.addedLines;
    authors[author].deletions += file.deletedLines;
  });
  
  // Convert to array and sort by file count
  const contributorsList = Object.values(authors)
    .sort((a, b) => b.files - a.files);
  
  console.log('Top contributors:');
  contributorsList.slice(0, 5).forEach((contributor, index) => {
    console.log(`\n${index + 1}. ${contributor.name} <${contributor.email}>`);
    console.log(`   Files: ${contributor.files}`);
    console.log(`   Additions: ${contributor.additions}`);
    console.log(`   Deletions: ${contributor.deletions}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}
```

### Directory-specific Analysis

This example analyzes files in a specific directory:

```javascript
const { findRepository } = require('git-module');

try {
  const repo = findRepository(process.cwd());
  
  // Specify the directory to analyze
  const targetDir = 'src/components';
  
  // Get files in the target directory
  const files = repo.listFilesWithMetadata(targetDir);
  
  console.log(`Found ${files.length} files in ${targetDir}`);
  
  // Find the most recently modified file
  if (files.length > 0) {
    const mostRecent = files.sort((a, b) => b.lastCommitTime - a.lastCommitTime)[0];
    const date = new Date(mostRecent.lastCommitTime * 1000).toLocaleString();
    
    console.log('\nMost recently modified file:');
    console.log(`File: ${mostRecent.path}`);
    console.log(`Last modified: ${date}`);
    console.log(`By: ${mostRecent.lastAuthorName}`);
    console.log(`Commit message: ${mostRecent.lastCommitMessage.split('\n')[0]}`);
  }
  
  // Find the file with the most changes
  if (files.length > 0) {
    const mostChanges = files.sort((a, b) => 
      (b.addedLines + b.deletedLines) - (a.addedLines + a.deletedLines)
    )[0];
    
    console.log('\nFile with most changes:');
    console.log(`File: ${mostChanges.path}`);
    console.log(`Changes: +${mostChanges.addedLines}, -${mostChanges.deletedLines}`);
    console.log(`Last commit: ${mostChanges.lastCommitHash.substr(0, 8)}`);
  }
} catch (error) {
  console.error('Error:', error.message);
}
``` 