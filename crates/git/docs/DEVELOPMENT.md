# Development Guide

This document provides information for developers who want to understand the internals of the Git module or contribute to its development.

## Project Architecture

The Git module is built using a combination of Rust and JavaScript:

- **Rust Core**: The core functionality is implemented in Rust using the libgit2 library.
- **Node.js Bindings**: The Rust code is exposed to Node.js using napi-rs.
- **JavaScript Interface**: A thin JavaScript layer provides a clean API for Node.js applications.

## Directory Structure

```
git/
├── .cargo/            # Rust cargo configuration
├── __test__/          # Test files
├── docs/              # Documentation
├── examples/          # Example JavaScript files
├── src/               # Rust source code
│   └── lib.rs         # Main Rust implementation
├── build.rs           # Rust build configuration
├── Cargo.toml         # Rust dependencies and configuration
├── index.d.ts         # TypeScript definitions
├── index.js           # JavaScript entry point
└── package.json       # npm package configuration
```

## Building the Project

The project uses yarn for package management and cargo for Rust compilation. To build the project:

```bash
yarn install  # Install dependencies
yarn build    # Build the Rust code
```

The build process compiles the Rust code into a native Node.js module that can be loaded by Node.js.

## Implementation Details

### Rust Core (`src/lib.rs`)

The main Rust file defines several structures and implements methods that use libgit2 to interact with Git repositories:

1. **Data Structures**:
   - `GitRepo`: Wraps a libgit2 Repository
   - `FileStatus`: Status of a file in the repository
   - `FileMetadata`: Metadata about a file
   - `CommitInfo`: Information about a commit
   - `TagInfo`: Information about a tag

2. **Key Implementations**:
   - Repository management (open, clone, init)
   - File status and metadata queries
   - Commit operations
   - Branch and tag operations

3. **Error Handling**:
   - libgit2 errors are converted to napi errors with descriptive messages

### Key Implementation Details

#### Finding Repositories (`findRepository`)

The `findRepository` function traverses up the directory tree from a given path, looking for a `.git` directory. This allows applications to automatically discover the Git repository that contains a specific file.

```rust
pub fn find_repository(start_path: String) -> Result<GitRepo> {
  let mut current_path = Path::new(&start_path).to_path_buf();
  
  loop {
    let git_dir = current_path.join(".git");
    if git_dir.exists() && git_dir.is_dir() {
      match Repository::open(&current_path) {
        Ok(repo) => return Ok(GitRepo { repo }),
        Err(e) => return Err(Error::new(Status::GenericFailure, 
                         format!("Found .git directory but failed to open repository: {}", e))),
      }
    }
    
    if !current_path.pop() {
      return Err(Error::new(Status::GenericFailure, 
                  format!("Could not find a git repository in '{}' or any parent directory", start_path)));
    }
  }
}
```

#### File Metadata (`get_file_metadata`)

The `get_file_metadata` function uses libgit2 to traverse the commit history and find information about a specific file. For each commit, it checks if the commit modified the file and collects statistics about the changes.

```rust
pub fn get_file_metadata(&self, file_path: String) -> Result<FileMetadata> {
  // Create a revwalk to iterate through commits
  let mut revwalk = self.repo.revwalk()?;
  revwalk.push_head()?;

  // Iterate through commits to find file changes
  for oid_result in revwalk {
    let oid = oid_result?;
    let commit = self.repo.find_commit(oid)?;
    
    if let Ok(diff) = self.get_commit_diff(&commit) {
      // Check if this commit touches our file
      let mut file_changed = false;
      let mut added_lines = 0;
      let mut deleted_lines = 0;
      
      // Process diff and count lines
      diff.foreach(...)?;
      
      if file_changed {
        // Return metadata for the file
        return Ok(FileMetadata { ... });
      }
    }
  }
  
  Err(Error::new(Status::GenericFailure, 
      format!("Could not find commits for file: {}", file_path)))
}
```

## JavaScript Interface

The JavaScript interface is minimal, mainly defined in `index.js` and `index.d.ts`. It imports the native module and re-exports its functions and classes.

## Adding New Features

When adding new features, follow these guidelines:

1. **Implement in Rust**: Add the core functionality in `src/lib.rs`
2. **Expose via napi-rs**: Use the `#[napi]` attribute to expose functions and classes
3. **Update TypeScript definitions**: Add proper type definitions in `index.d.ts`
4. **Add examples**: Create example files in the `examples/` directory
5. **Update documentation**: Update the relevant documentation files

## Testing

Tests are located in the `__test__/` directory. To run tests:

```bash
yarn test
```

## Common Issues and Solutions

### Cannot find libgit2

Ensure libgit2 is installed on your system. On most systems, this can be installed via package managers:

```bash
# Ubuntu/Debian
apt-get install libgit2-dev

# Arch
pacman -S libgit2

# macOS
brew install libgit2

# Windows (via vcpkg)
vcpkg install libgit2
```

### Compilation Errors

If you encounter compilation errors, check:

1. **Rust version**: Ensure you're using a compatible Rust version
2. **Cargo.toml**: Check dependency versions
3. **build.rs**: Ensure build configuration is correct for your platform

## Performance Considerations

1. **Large Repositories**: When working with large repositories, the `listFilesWithMetadata` function may be slow. Consider using it selectively.
2. **File History**: The `getFileHistory` function traverses the entire commit history and may be slow for files with a long history.
3. **Memory Usage**: Be aware that loaded repositories consume memory. Close repositories when done with them.

## Rust Dependencies

The module depends on several Rust crates:

- **libgit2-sys**: Low-level bindings to libgit2
- **git2**: High-level Rust interface to libgit2
- **napi**: Node.js API bindings
- **napi-derive**: Procedural macros for napi

## Future Development

Planned features and improvements include:

1. **Improved error handling**: More specific error types
2. **Authentication support**: Better support for different authentication methods
3. **Performance optimizations**: Especially for large repositories
4. **Expanded API**: Additional Git functionality 