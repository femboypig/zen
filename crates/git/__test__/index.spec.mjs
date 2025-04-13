import test from 'ava'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { execSync } from 'child_process'

import { init_repository, clone_repository, GitRepo } from '../index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEST_DIR = join(__dirname, 'test-git-repo')
const CLONE_DIR = join(__dirname, 'test-git-clone')

// Helper function to clean test directories
function cleanTestDirs() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true })
  }
  if (existsSync(CLONE_DIR)) {
    rmSync(CLONE_DIR, { recursive: true, force: true })
  }
}

// Set up test environment
test.beforeEach(() => {
  cleanTestDirs()
  
  // Create test directory
  mkdirSync(TEST_DIR, { recursive: true })
})

// Clean up test environment
test.afterEach(() => {
  cleanTestDirs()
})

// Test: Initialize a repository
test('init_repository should create a new git repository', (t) => {
  const repo = init_repository(TEST_DIR)
  
  t.truthy(repo)
  t.true(existsSync(join(TEST_DIR, '.git')))
})

// Test: Create and commit a file
test('should be able to add and commit files', (t) => {
  const repo = init_repository(TEST_DIR)
  
  // Create a test file
  const testFilePath = join(TEST_DIR, 'test.txt')
  writeFileSync(testFilePath, 'Hello, Git!')
  
  // Add and commit
  repo.add_all()
  const commitId = repo.commit('Initial commit', 'Test User', 'test@example.com')
  
  t.truthy(commitId)
  t.is(typeof commitId, 'string')
  t.is(commitId.length, 40) // SHA-1 hash is 40 characters long
})

// Test: Get file status
test('should be able to get file status', (t) => {
  const repo = init_repository(TEST_DIR)
  
  // Create a test file but don't add it
  const testFilePath = join(TEST_DIR, 'untracked.txt')
  writeFileSync(testFilePath, 'Untracked file')
  
  // Check status
  const status = repo.get_file_status()
  
  t.truthy(status)
  t.true(Array.isArray(status))
  t.true(status.length > 0)
  
  // Find our untracked file
  const untrackedFile = status.find(file => file.path === 'untracked.txt')
  t.truthy(untrackedFile)
  t.true(untrackedFile.is_new)
})

// Test: Create and checkout branch
test('should be able to create and checkout branches', (t) => {
  const repo = init_repository(TEST_DIR)
  
  // Need to have at least one commit to create branches
  const testFilePath = join(TEST_DIR, 'test.txt')
  writeFileSync(testFilePath, 'Hello, Git!')
  repo.add_all()
  repo.commit('Initial commit', 'Test User', 'test@example.com')
  
  // Create a new branch
  repo.create_branch('feature-branch', null)
  
  // Checkout the branch
  repo.checkout_branch('feature-branch')
  
  // Check current branch
  const currentBranch = repo.get_current_branch()
  t.is(currentBranch, 'feature-branch')
})
