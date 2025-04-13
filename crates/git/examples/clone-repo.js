// Example to clone a git repository
const { cloneRepository } = require('..');
const path = require('path');
const fs = require('fs');

// Helper to clean directory
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// Format timestamp to readable date
function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

async function runExample() {
  try {
    // URL of a public repository to clone
    const repositoryUrl = 'https://github.com/femboypig/test';
    const clonePath = path.join(__dirname, 'cloned-repo');
    
    // Clean the destination directory
    cleanDir(clonePath);
    
    console.log(`Cloning repository: ${repositoryUrl}`);
    console.log(`Into directory: ${clonePath}`);
    
    const startTime = Date.now();
    
    // Clone the repository
    const repo = cloneRepository(repositoryUrl, clonePath);
    
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000; // in seconds
    
    console.log(`\nRepository cloned successfully in ${elapsedTime.toFixed(2)} seconds`);
    
    // Check if it worked by looking for .git directory
    const gitDirExists = fs.existsSync(path.join(clonePath, '.git'));
    console.log('.git directory exists:', gitDirExists);
    
    // List some files from the cloned repository
    console.log('\nFiles in the cloned repository:');
    const files = fs.readdirSync(clonePath).slice(0, 10); // Show first 10 files/dirs
    files.forEach(file => {
      const stats = fs.statSync(path.join(clonePath, file));
      const fileType = stats.isDirectory() ? 'Directory' : 'File';
      console.log(`  - ${file} (${fileType})`);
    });
    
    // Get HEAD commit hash
    const headCommitHash = repo.getHeadCommitHash();
    console.log('\nHEAD commit hash:', headCommitHash);
    
    // Get current branch
    const currentBranch = repo.getCurrentBranch();
    console.log('Current branch:', currentBranch);
    
    // Get files with metadata
    console.log('\nGetting file metadata...');
    try {
      // Get metadata for all files in the repository
      const filesWithMetadata = repo.listFilesWithMetadata(null);
      
      console.log('\nFiles with their last commit metadata:');
      console.log('--------------------------------------');
      
      filesWithMetadata.forEach(file => {
        console.log(`\nFile: ${file.path}`);
        console.log(`  Last commit: ${file.lastCommitHash.substring(0, 8)}`);
        console.log(`  Message: ${file.lastCommitMessage.split('\n')[0]}`); // First line of commit message
        console.log(`  Author: ${file.lastAuthorName} <${file.lastAuthorEmail}>`);
        console.log(`  Date: ${formatDate(file.lastCommitTime)}`);
      });
      
      // If we have specific files we want to examine in more detail
      const specificFiles = files.filter(f => !fs.statSync(path.join(clonePath, f)).isDirectory()).slice(0, 3);
      
      if (specificFiles.length > 0) {
        console.log('\nDetailed metadata for specific files:');
        console.log('-----------------------------------');
        
        for (const file of specificFiles) {
          try {
            const metadata = repo.getFileMetadata(file);
            
            console.log(`\nFile: ${metadata.path}`);
            console.log(`  Last commit: ${metadata.lastCommitHash}`);
            console.log(`  Full message:\n    ${metadata.lastCommitMessage.replace(/\n/g, '\n    ')}`);
            console.log(`  Author: ${metadata.lastAuthorName} <${metadata.lastAuthorEmail}>`);
            console.log(`  Date: ${formatDate(metadata.lastCommitTime)}`);
          } catch (err) {
            console.log(`\nCould not get metadata for ${file}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.log('Error getting file metadata:', err.message);
    }
    
    console.log('\nCloning example completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runExample();