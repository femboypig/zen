# API Reference

## Global Functions

### `cloneRepository(url: string, path: string): GitRepo`

Clones a git repository from the specified URL to the local path.

```javascript
const { cloneRepository } = require('git-module');
const repo = cloneRepository('https://github.com/username/repo.git', './my-repo');
```

### `initRepository(path: string): GitRepo`

Initializes a new git repository at the specified path.

```javascript
const { initRepository } = require('git-module');
const repo = initRepository('./new-project');
```

### `findRepository(startPath: string): GitRepo`

Finds the nearest git repository by traversing up from the specified path. This is useful for automatically locating the repository that contains a specific file or directory.

```javascript
const { findRepository } = require('git-module');
// Start from current directory and find repository
const repo = findRepository(process.cwd());
```

## GitRepo Class

### Constructor

#### `new GitRepo(path: string)`

Opens an existing git repository at the specified path.

```javascript
const { GitRepo } = require('git-module');
const repo = new GitRepo('./my-repo');
```

### Repository Information

#### `getHeadCommitHash(): string`

Returns the hash of the current HEAD commit.

```javascript
const headCommit = repo.getHeadCommitHash();
console.log(`Current HEAD: ${headCommit}`);
```

#### `getCurrentBranch(): string`

Returns the name of the current branch.

```javascript
const branch = repo.getCurrentBranch();
console.log(`Current branch: ${branch}`);
```

#### `getRemoteUrl(name: string): string`

Returns the URL of the specified remote.

```javascript
const url = repo.getRemoteUrl('origin');
console.log(`Remote URL: ${url}`);
```

### Branch Operations

#### `createBranch(name: string, targetCommit: string | null): void`

Creates a new branch with the specified name. If `targetCommit` is provided, the branch points to that commit. Otherwise, it points to HEAD.

```javascript
// Create branch from HEAD
repo.createBranch('feature-branch', null);

// Create branch from specific commit
repo.createBranch('bugfix-branch', 'a1b2c3d4e5f6...');
```

#### `checkoutBranch(name: string): void`

Checks out the specified branch.

```javascript
repo.checkoutBranch('feature-branch');
```

### File Operations

#### `getFileStatus(): FileStatus[]`

Returns the status of all files in the repository.

```javascript
const statuses = repo.getFileStatus();
statuses.forEach(status => {
  console.log(`${status.path} - ${status.isModified ? 'Modified' : 'Not modified'}`);
});
```

#### `getFileMetadata(filePath: string): FileMetadata`

Returns metadata for the specified file, including its last commit information.

```javascript
const metadata = repo.getFileMetadata('src/index.js');
console.log(`Last commit: ${metadata.lastCommitHash}`);
console.log(`Author: ${metadata.lastAuthorName} <${metadata.lastAuthorEmail}>`);
console.log(`Changes: +${metadata.addedLines}, -${metadata.deletedLines}`);
```

#### `listFilesWithMetadata(directoryPath?: string | null): FileMetadata[]`

Returns metadata for all files in the repository or the specified directory.

```javascript
// All files in repository
const allFiles = repo.listFilesWithMetadata(null);
console.log(`Total files: ${allFiles.length}`);

// Files in specific directory
const srcFiles = repo.listFilesWithMetadata('src');
console.log(`Files in src: ${srcFiles.length}`);
```

#### `getFileHistory(filePath: string): CommitInfo[]`

Returns the complete commit history for the specified file.

```javascript
const history = repo.getFileHistory('src/index.js');
history.forEach(commit => {
  console.log(`Commit: ${commit.commitHash.substr(0, 8)}`);
  console.log(`Author: ${commit.authorName}`);
  console.log(`Message: ${commit.commitMessage.split('\n')[0]}`);
});
```

### Commit Operations

#### `commit(message: string, authorName: string, authorEmail: string): string`

Commits staged changes with the specified message and author information. Returns the commit hash.

```javascript
const commitHash = repo.commit(
  'Fix bug in login form', 
  'John Doe', 
  'john@example.com'
);
console.log(`New commit: ${commitHash}`);
```

#### `addAll(): void`

Stages all modified, new, and deleted files for commit.

```javascript
repo.addAll();
```

#### `push(remoteName: string, branchName: string): void`

Pushes the specified branch to the remote repository.

```javascript
repo.push('origin', 'main');
```

### Tag Operations

#### `listTags(): TagInfo[]`

Returns all tags in the repository.

```javascript
const tags = repo.listTags();
tags.forEach(tag => {
  console.log(`Tag: ${tag.name}`);
  console.log(`Target: ${tag.targetCommit.substr(0, 8)}`);
});
```

#### `createTag(tagName: string, message?: string | null, targetCommit?: string | null): string`

Creates a new tag. If `message` is provided, creates an annotated tag. If `targetCommit` is provided, tag points to that commit; otherwise, it points to HEAD.

```javascript
// Lightweight tag at HEAD
const tagId1 = repo.createTag('v1.0.0-rc1', null, null);

// Annotated tag at HEAD
const tagId2 = repo.createTag('v1.0.0', 'Version 1.0.0 release', null);

// Annotated tag at specific commit
const tagId3 = repo.createTag('v0.9.0', 'Version 0.9.0', 'a1b2c3d4e5f6...');
```

#### `deleteTag(tagName: string): void`

Deletes the specified tag.

```javascript
repo.deleteTag('v1.0.0-rc1');
```

#### `checkoutTag(tagName: string): void`

Checks out the specified tag (detached HEAD).

```javascript
repo.checkoutTag('v1.0.0');
```

### Commit Checkout

#### `checkoutCommit(commitHash: string): void`

Checks out the specified commit (detached HEAD).

```javascript
repo.checkoutCommit('a1b2c3d4e5f6...');
```

## Data Structures

### FileStatus

```typescript
interface FileStatus {
  path: string;       // File path
  isNew: boolean;     // Whether file is new
  isModified: boolean; // Whether file is modified
  isDeleted: boolean; // Whether file is deleted
  isRenamed: boolean; // Whether file is renamed
  isIgnored: boolean; // Whether file is ignored
}
```

### FileMetadata

```typescript
interface FileMetadata {
  path: string;           // File path
  lastCommitHash: string; // Hash of last commit that modified the file
  lastCommitMessage: string; // Commit message
  lastAuthorName: string; // Author name
  lastAuthorEmail: string; // Author email
  lastCommitTime: number; // Unix timestamp of commit
  addedLines: number;     // Number of lines added
  deletedLines: number;   // Number of lines deleted
}
```

### CommitInfo

```typescript
interface CommitInfo {
  commitHash: string;     // Commit hash
  commitMessage: string;  // Commit message
  authorName: string;     // Author name
  authorEmail: string;    // Author email
  commitTime: number;     // Unix timestamp of commit
  addedLines: number;     // Number of lines added
  deletedLines: number;   // Number of lines deleted
}
```

### TagInfo

```typescript
interface TagInfo {
  name: string;         // Tag name
  targetCommit: string; // Hash of target commit
  message: string;      // Tag message (empty for lightweight tags)
  taggerName: string;   // Tagger name
  taggerEmail: string;  // Tagger email
  tagTime: number;      // Unix timestamp of tag creation
}
``` 