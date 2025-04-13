/**
 * Git utilities module
 * 
 * This module provides utility functions for working with Git repositories
 * using our Rust-based git module.
 */

const gitModule = require('../git');
const path = require('path');
const fs = require('fs');
const events = require('events');

/**
 * @class GitUtils
 * @description Module for Git integration with Zen Editor
 */
class GitUtils extends events.EventEmitter {
  constructor() {
    super();
    this.currentProjectPath = null;
    this.isGitRepo = false;
    this.currentBranch = null;
    this.watchInterval = null;
  }

  /**
   * Initializes Git tracking for a project
   * @param {string} projectPath - Path to the project directory
   * @returns {Object} - Git information { isGitRepo, branchName }
   */
  initProject(projectPath) {
    if (!projectPath) {
      return { isGitRepo: false, branchName: null };
    }

    this.currentProjectPath = projectPath;
    
    // Check if the project is a Git repository
    this.isGitRepo = gitModule.isGitRepository(projectPath);
    
    if (this.isGitRepo) {
      try {
        this.currentBranch = gitModule.getBranchName(projectPath);
      } catch (error) {
        console.error('Error getting branch name:', error);
        this.currentBranch = null;
      }

      // Start watching for Git changes
      this.startWatching();
    } else {
      this.currentBranch = null;
    }

    return {
      isGitRepo: this.isGitRepo,
      branchName: this.currentBranch
    };
  }

  /**
   * Starts watching for changes in Git (like branch changes)
   */
  startWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }

    // Watch for Git changes every 5 seconds
    this.watchInterval = setInterval(() => {
      this.checkForChanges();
    }, 5000);
  }

  /**
   * Stops watching for Git changes
   */
  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  /**
   * Checks for Git changes (like branch switching)
   */
  checkForChanges() {
    if (!this.isGitRepo || !this.currentProjectPath) {
      return;
    }

    try {
      const newBranch = gitModule.getBranchName(this.currentProjectPath);
      
      if (newBranch !== this.currentBranch) {
        const oldBranch = this.currentBranch;
        this.currentBranch = newBranch;
        this.emit('branch-changed', { oldBranch, newBranch });
      }
    } catch (error) {
      console.error('Error checking for Git changes:', error);
    }
  }

  /**
   * Gets current Git information
   * @returns {Object} - Git information { isGitRepo, branchName }
   */
  getCurrentInfo() {
    return {
      isGitRepo: this.isGitRepo,
      branchName: this.currentBranch
    };
  }
}

module.exports = new GitUtils(); 