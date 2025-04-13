// Basic usage example for git native module
const { initRepository, cloneRepository, GitRepo } = require('..');
const path = require('path');
const fs = require('fs');

// Helper to clean directory
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

async function runExample() {
  try {
    const repoPath = path.join(__dirname, 'example-repo');
    cleanDir(repoPath);
    
    console.log('Initializing repository...');
    const repo = initRepository(repoPath);
    console.log('Repository initialized at:', repoPath);
    
    // Check if .git directory was created
    const gitDirExists = fs.existsSync(path.join(repoPath, '.git'));
    console.log('.git directory exists:', gitDirExists);
    
    // Create a test file
    console.log('\nCreating test file...');
    fs.writeFileSync(path.join(repoPath, 'README.md'), '# Git Example\n\nThis is a test repository created with our native git module.');
    
    // Check status
    console.log('\nFile status:');
    const status = repo.getFileStatus();
    status.forEach(file => {
      console.log(`  - ${file.path} (new: ${file.isNew}, modified: ${file.isModified})`);
    });
    
    console.log('\nModule seems to be working!');
    console.log('Now you can use this native module in your application.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runExample(); 