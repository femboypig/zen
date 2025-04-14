# Zen Editor

A minimalistic code editor focused on distraction-free writing and coding.

## Development

### Requirements

- Node.js 14+
- npm && yarn (yarn only for building / creating rust modules)
- Rust toolchain (for building native modules)
- Corepack enabled (`sudo corepack enable`)

### Setup

```bash
# Install dependencies
npm install

# Build native modules (required before first run)
cd crates/fs && yarn build
cd ../git && yarn build
cd ../..

# Start the application
npm start
```

### Troubleshooting

If you encounter module not found errors like `Cannot find module 'fs-linux-x64-gnu'`, you need to build the corresponding native module:

# Enable corepack (if not already enabled)
sudo corepack enable

# Navigate to the project root and install dependencies
yarn install

# Build the specific native module 
cd crates/fs && yarn build  # For fs module
cd ../git && yarn build     # For git module

The application requires native Rust modules that need to be compiled for your specific platform. Make sure all native modules are built before running the application.
