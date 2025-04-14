# Zen Editor

A minimalistic code editor focused on distraction-free writing and coding.

## Development

### Requirements

- Node.js 14+
- npm for package management
- Rust toolchain for building native modules
  - Install from https://rustup.rs if not already installed
- Corepack enabled (`sudo corepack enable`)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/zen.git
cd zen

# Install dependencies
npm install

# Build native modules (required before first run)
cd crates/fs && npm run build
cd ../git && npm run build
cd ../..

# Start the application
npm start
```

### Building Native Modules

The application uses two native Rust modules that must be compiled for your specific platform:
```bash
# File System Module:

cd crates/fs && npm run build

# Git Module:

cd crates/git && npm run build
```

### Troubleshooting

#### Module Not Found Errors

If you encounter errors like:
- Cannot find module 'fs-linux-x64-gnu'
- Cannot find module 'git-linux-x64-gnu'

This means the native modules haven't been built for your platform. Follow these steps:
```bash
# For file system module

cd crates/fs && npm run build

# For git module

cd crates/git && npm run build
```
#### Yarn Issues

If you prefer using Yarn or encounter issues with npm:

# Enable corepack if not already enabled
```bash
sudo corepack enable

# Prepare yarn
corepack prepare yarn@4.9.1 --activate

# in root dir: yarn install

# Then build modules
cd crates/fs && yarn build
cd ../git && yarn build
```
#### GPU Errors

If you see GPU or visualization errors, these are usually non-critical when running in development mode or in a virtual environment.

### Building for Production
```bash
# Build for production

npm run build

# Package the application
npm run package
```
## License

GPL
