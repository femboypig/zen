# Git Module Documentation

## Overview

This is a native Node.js module for Git operations built with napi-rs and libgit2. It provides a high-performance interface to Git functionality without spawning git command-line processes. The module is designed to be easy to use while providing powerful Git capabilities.

## Key Features

- Repository operations (clone, init, open)
- File metadata and history tracking
- Commit management
- Branch operations
- Tag management
- File status tracking

## Module Structure

- `src/` - Rust source code that implements the Git functionality using libgit2
- `examples/` - JavaScript example files demonstrating various features
- `docs/` - Documentation files (where you are now)
- `__test__/` - Test files

## Documentation Structure

This documentation is organized into several files:

- [API.md](./API.md) - Detailed API reference
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Information for developers who want to contribute
- [EXAMPLES.md](./EXAMPLES.md) - Code examples and use cases

## Quick Start

```javascript
const { findRepository, cloneRepository } = require('git-module');

// Find existing repository from current directory
const repo = findRepository(process.cwd());

// Get metadata for a file
const metadata = repo.getFileMetadata('path/to/file.js');
console.log(`Last commit: ${metadata.lastCommitHash}`);
console.log(`Author: ${metadata.lastAuthorName}`);

// Or clone a new repository
const newRepo = cloneRepository('https://github.com/username/repo.git', './target-dir');
```

## Design Philosophy

This module was created with the following principles in mind:

1. **Performance** - Use native Rust code and libgit2 for high performance
2. **Simplicity** - Provide a clean JavaScript API that's easy to use
3. **Stability** - Handle edge cases and errors gracefully
4. **Extensibility** - Allow for future additions to the API

## References

- [libgit2 Documentation](https://libgit2.org/docs/)
- [napi-rs Documentation](https://napi.rs/) 