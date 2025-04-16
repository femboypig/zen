#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { FileWatcherManager, WatchEventType } = require('../mod/file_watcher');

// System for tracking tests
const testSuite = {
  totalTests: 7,
  passedTests: 0,
  failedTests: 0,
  currentTest: null,
  
  startTest(name) {
    this.currentTest = name;
    console.log(`\n${name}`);
    console.log('-'.repeat(name.length));
  },
  
  passTest() {
    this.passedTests++;
    console.log(`✅ Test "${this.currentTest}" passed successfully`);
  },
  
  failTest(error) {
    this.failedTests++;
    console.log(`❌ Test "${this.currentTest}" failed: ${error}`);
  },
  
  printResults() {
    console.log('\n===== TEST RESULTS =====');
    console.log(`Total tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
    
    if (this.passedTests === this.totalTests) {
      console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY!');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }
  }
};

// Create test directory structure
const TEST_DIR = path.join(__dirname, 'watch_test');
const SUB_DIR = path.join(TEST_DIR, 'subdir');
const IGNORE_DIR = path.join(TEST_DIR, 'ignore_me');

// Clean up test directory if it exists
console.log('Setting up test environment...');
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

// Create test directories
fs.mkdirSync(TEST_DIR, { recursive: true });
fs.mkdirSync(SUB_DIR, { recursive: true });
fs.mkdirSync(IGNORE_DIR, { recursive: true });

// Initialize the watcher
const watcher = new FileWatcherManager();

console.log('Starting watcher tests...');

// Set up event handler
let eventCount = 0;
let eventsReceived = [];

function handleWatchEvent(event) {
  eventCount++;
  eventsReceived.push(event);
  console.log(`[EVENT ${eventCount}] ${event.eventType}: ${event.relativePath}`);
}

// Test 1: Basic watching (directory)
testSuite.startTest('TEST 1: Basic watching (directory)');
try {
  let test1Success = watcher.watch(TEST_DIR, handleWatchEvent, {
    recursive: true,
    ignorePaths: [IGNORE_DIR]
  });
  
  if (!test1Success) throw new Error('Failed to set up watching');
  
  console.log(`Watching directory: ${TEST_DIR}`);
  console.log(`Ignoring: ${IGNORE_DIR}`);
  
  // Reset events before new files
  eventsReceived = [];
  
  // Create test files
  console.log('\nCreating test files...');
  const testFile1 = path.join(TEST_DIR, 'test1.txt');
  fs.writeFileSync(testFile1, 'Test content 1');
  
  const testFile2 = path.join(SUB_DIR, 'test2.txt');
  fs.writeFileSync(testFile2, 'Test content 2');
  
  const ignoredFile = path.join(IGNORE_DIR, 'ignored.txt');
  fs.writeFileSync(ignoredFile, 'This file should be ignored');
  
  // Test will be marked as passed in setTimeout
  
} catch (error) {
  testSuite.failTest(error.message);
}

// Wait a bit to see the events for file creation
setTimeout(() => {
  // Check results of test 1
  try {
    if (eventsReceived.length === 0) throw new Error('No events received');
    
    const hasIgnoredEvents = eventsReceived.some(e => 
      e.path.includes(IGNORE_DIR) || e.relativePath.includes('ignore_me')
    );
    
    if (hasIgnoredEvents) throw new Error('Events received from ignored directory');
    
    // Check that events from watched directory were received
    const hasWatchedEvents = eventsReceived.some(e => 
      e.path.includes(TEST_DIR) && !e.path.includes(IGNORE_DIR)
    );
    
    if (!hasWatchedEvents) throw new Error('No events from watched directory');
    
    testSuite.passTest();
  } catch (error) {
    testSuite.failTest(error.message);
  }
  
  console.log('\nModifying files...');
  fs.appendFileSync(path.join(TEST_DIR, 'test1.txt'), '\nAdditional content');
  fs.appendFileSync(path.join(SUB_DIR, 'test2.txt'), '\nMore content');
  fs.appendFileSync(path.join(IGNORE_DIR, 'ignored.txt'), '\nThis should be ignored');
  
  // Wait a bit more to see the events for file modifications
  setTimeout(() => {
    // Test 2: Get watched paths
    testSuite.startTest('TEST 2: Get watched paths');
    try {
      const watchedPaths = watcher.getWatchedPaths();
      console.log('Watched paths:', watchedPaths);
      
      if (!watchedPaths || !Array.isArray(watchedPaths)) {
        throw new Error('getWatchedPaths did not return an array of paths');
      }
      
      if (watchedPaths.length !== 1) {
        throw new Error(`Incorrect number of paths: ${watchedPaths.length}, should be 1`);
      }
      
      if (!watchedPaths.includes(TEST_DIR)) {
        throw new Error(`Path ${TEST_DIR} is missing from the list of watched paths`);
      }
      
      testSuite.passTest();
    } catch (error) {
      testSuite.failTest(error.message);
    }
    
    // Test 3: Check if a path is being watched
    testSuite.startTest('TEST 3: Check if a path is being watched');
    try {
      console.log(`Is ${TEST_DIR} watched? ${watcher.isWatching(TEST_DIR)}`);
      console.log(`Is ${__dirname} watched? ${watcher.isWatching(__dirname)}`);
      
      if (!watcher.isWatching(TEST_DIR)) {
        throw new Error(`Path ${TEST_DIR} should be watched`);
      }
      
      if (watcher.isWatching(__dirname)) {
        throw new Error(`Path ${__dirname} should not be watched`);
      }
      
      testSuite.passTest();
    } catch (error) {
      testSuite.failTest(error.message);
    }
    
    // Test 4: Unwatch specific path
    testSuite.startTest('TEST 4: Unwatch specific path');
    try {
      console.log(`Unwatching ${TEST_DIR}: ${watcher.unwatch(TEST_DIR)}`);
      
      if (watcher.isWatching(TEST_DIR)) {
        throw new Error(`Path ${TEST_DIR} is still being watched after unwatch`);
      }
      
      // Create more files to confirm it's not watching anymore
      console.log('\nCreating more files after unwatching...');
      eventsReceived = [];
      fs.writeFileSync(path.join(TEST_DIR, 'after_unwatch.txt'), 'This should not trigger events');
      
      // Short delay to make sure events are not coming
      setTimeout(() => {
        if (eventsReceived.length > 0) {
          testSuite.failTest('Events continue to arrive after unwatching');
        } else {
          testSuite.passTest();
        }
        
        // Test 5: Watch a specific file (not a directory)
        testSuite.startTest('TEST 5: Watch specific file (not directory)');
        try {
          const singleFile = path.join(TEST_DIR, 'single_watch_file.txt');
          fs.writeFileSync(singleFile, 'This is a single file to watch');
          
          eventsReceived = [];
          const watchResult = watcher.watch(singleFile, handleWatchEvent);
          
          if (!watchResult) {
            throw new Error('Failed to set up watching for file');
          }
          
          console.log(`Watching specific file: ${singleFile}`);
          
          // Wait a bit and then modify the single watched file
          setTimeout(() => {
            console.log('\nModifying the watched file...');
            fs.appendFileSync(singleFile, '\nUpdated content for single file watch test');
            
            // Create another file in same dir (should not trigger events)
            const anotherFile = path.join(TEST_DIR, 'not_watched.txt');
            console.log('Creating another file in same dir (should not trigger events)...');
            fs.writeFileSync(anotherFile, 'This file is not being watched');
            
            // Check results of test 5 after short delay
            setTimeout(() => {
              try {
                // Check that events were received only for the watched file
                const fileEvents = eventsReceived.filter(e => 
                  e.path === singleFile
                );
                
                if (fileEvents.length === 0) {
                  throw new Error('No events received for the watched file');
                }
                
                // Check that events for neighboring file were not received
                const unwatchedEvents = eventsReceived.filter(e => 
                  e.path === anotherFile
                );
                
                if (unwatchedEvents.length > 0) {
                  throw new Error('Events received for unwatched file');
                }
                
                testSuite.passTest();
              } catch (error) {
                testSuite.failTest(error.message);
              }
              
              // Test 6: Setup watchers for multiple paths
              testSuite.startTest('TEST 6: Setup watchers for multiple paths');
              try {
                eventsReceived = [];
                
                const watchDir = watcher.watch(TEST_DIR, handleWatchEvent);
                const watchSubDir = watcher.watch(SUB_DIR, handleWatchEvent);
                
                if (!watchDir || !watchSubDir) {
                  throw new Error('Failed to set up watching for multiple paths');
                }
                
                console.log('Watching multiple paths...');
                const watchedPaths = watcher.getWatchedPaths();
                console.log('Watched paths:', watchedPaths);
                
                if (watchedPaths.length !== 3) { // single_file + TEST_DIR + SUB_DIR
                  throw new Error(`Incorrect number of watched paths: ${watchedPaths.length}`);
                }
                
                // Create files to see events from multiple watchers
                console.log('\nCreating files to test multiple watchers...');
                fs.writeFileSync(path.join(TEST_DIR, 'multi1.txt'), 'Multi-watcher test 1');
                fs.writeFileSync(path.join(SUB_DIR, 'multi2.txt'), 'Multi-watcher test 2');
                
                // Check will be in next setTimeout
              } catch (error) {
                testSuite.failTest(error.message);
              }
              
              // Test 7: Unwatch all
              setTimeout(() => {
                try {
                  // Check results of test 6
                  const rootEvents = eventsReceived.filter(e => 
                    e.path.includes(path.join(TEST_DIR, 'multi1.txt'))
                  );
                  
                  const subDirEvents = eventsReceived.filter(e => 
                    e.path.includes(path.join(SUB_DIR, 'multi2.txt'))
                  );
                  
                  if (rootEvents.length === 0 || subDirEvents.length === 0) {
                    testSuite.failTest('Events not received from all watched paths');
                  } else {
                    testSuite.passTest(); // Test 6 passed
                  }
                  
                  // Now test 7
                  testSuite.startTest('TEST 7: Unwatch all');
                  
                  console.log(`Unwatching all paths: ${watcher.unwatchAll()}`);
                  const remainingPaths = watcher.getWatchedPaths();
                  console.log('Watched paths after unwatching all:', remainingPaths);
                  
                  if (remainingPaths.length !== 0) {
                    throw new Error('There are still watched paths after unwatchAll');
                  }
                  
                  // Create files to confirm it's not watching anymore
                  console.log('\nCreating files after unwatching all...');
                  eventsReceived = [];
                  fs.writeFileSync(path.join(TEST_DIR, 'after_unwatch_all.txt'), 'This should not trigger events');
                  
                  // Final check of test 7 and print results
                  setTimeout(() => {
                    if (eventsReceived.length > 0) {
                      testSuite.failTest('Events continue to arrive after unwatchAll');
                    } else {
                      testSuite.passTest();
                    }
                    
                    // Clean up test directory and print test results
                    console.log('\nCleaning up test environment...');
                    fs.rmSync(TEST_DIR, { recursive: true, force: true });
                    
                    // Print test results
                    testSuite.printResults();
                  }, 1000);
                } catch (error) {
                  testSuite.failTest(error.message);
                  
                  // Clean up test directory and print test results even if there's an error
                  console.log('\nCleaning up test environment...');
                  fs.rmSync(TEST_DIR, { recursive: true, force: true });
                  
                  // Print test results
                  testSuite.printResults();
                }
              }, 1000);
            }, 1000);
          }, 1000);
        } catch (error) {
          testSuite.failTest(error.message);
        }
      }, 500);
    } catch (error) {
      testSuite.failTest(error.message);
    }
  }, 1000);
}, 1000); 