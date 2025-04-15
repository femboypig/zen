/* Element references */
const openProjectBtn = document.getElementById('open-project');
const newFileBtn = document.getElementById('new-file');
const cloneRepoBtn = document.getElementById('clone-repo');
const tabs = document.querySelectorAll('.tab');

const minimizeBtn = document.getElementById('minimize-button');
const maximizeBtn = document.getElementById('maximize-button');
const closeBtn = document.getElementById('close-button');
const menuBtn = document.getElementById('menu-button');

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const titlebarTitle = document.querySelector('.titlebar-title');

const commandPalette = document.getElementById('command-palette');
const commandPaletteInput = document.getElementById('command-palette-input');
const commandPaletteList = document.getElementById('command-palette-list');
const cmdReorganize = document.getElementById('cmd-reorganize');

const reorganizeDialog = document.getElementById('reorganize-dialog');
const sidebarLeftBtn = document.getElementById('sidebar-left');
const sidebarRightBtn = document.getElementById('sidebar-right');
const reorganizeCancel = document.getElementById('reorganize-cancel');
const reorganizeApply = document.getElementById('reorganize-apply');

const overlay = document.getElementById('overlay');

const enableVimCheck = document.getElementById('enable-vim');

const downbarLeft = document.getElementById('downbar-left');
const downbarRight = document.getElementById('downbar-right');

const resizeHandle = document.getElementById('resize-handle');

// Track current project and file tree elements
let currentProjectPath = null;
let fileTreeContainer = null;
const welcomeContainer = document.querySelector('.welcome-container');

// File system change listener
window.api.onFileSystemChange(handleFileChange);

// Project opened listener
window.api.onProjectOpened(handleProjectOpened);

/* Load settings on startup */
window.api.getSettings();

/* Restore sidebar width if saved */
window.api.storeGet('sidebarWidth', '15rem').then(width => {
  sidebar.style.width = width;
});

/* Command definitions */
const commands = [
  { id: 'cmd-reorganize', text: 'Reorganize UI', action: openReorganizeDialog },
  { id: 'cmd-open-project', text: 'Open Project', action: delayedOpenProject }
];

/* Delayed project opening function */
async function delayedOpenProject() {
  // Close command palette first
  closeCommandPalette();
  
  // Wait for 250ms before opening the project
  await new Promise(resolve => setTimeout(resolve, 250));
  
  try {
    const result = await window.api.openProject();
    if (result) {

    }
  } catch (err) {
    console.error('Error opening project:', err);
  }
}

/* File Tree Functionality */
// Initialize file tree from project data
function initializeFileTree(fileTree) {
  // Create file tree container if it doesn't exist
  if (!fileTreeContainer) {
    fileTreeContainer = document.createElement('div');
    fileTreeContainer.className = 'file-tree';
    sidebar.appendChild(fileTreeContainer);
  } else {
    // Clear existing file tree
    fileTreeContainer.innerHTML = '';
  }
  
  // Add file tree root element
  const rootElement = createFileTreeElement(fileTree);
  fileTreeContainer.appendChild(rootElement);
  
  // Add CSS for file tree if not already added
  addFileTreeStyles();
}

// Handle project opened event
function handleProjectOpened(result) {
  if (!result) return;
  
  console.log('Project opened:', result.path);
  
  // Save the current project path
  currentProjectPath = result.path;
  
  // Show the sidebar and ensure it's not hidden
  sidebar.classList.remove('hidden');
  sidebarToggle.classList.add('active');
  
  // Initialize file tree
  initializeFileTree(result.fileTree);
  
  // Update title bar with project name and git branch if available
  const folderName = result.path.split('/').pop();
  let titleText = folderName || 'Project';
  
  // If project is a Git repository, add branch name
  if (result.gitInfo && result.gitInfo.isGitRepo && result.gitInfo.branchName) {
    titlebarTitle.innerHTML = `${titleText} <span style="color: #888;">${result.gitInfo.branchName}</span>`;
  } else {
    titlebarTitle.textContent = titleText;
  }
  
  // Listen for Git branch changes
  window.api.onGitBranchChanged(handleGitBranchChanged);
}

// Handle Git branch changed event
function handleGitBranchChanged(data) {
  if (!data || !data.branchName || !currentProjectPath) return;
  
  // Update title bar with project name and new branch
  const folderName = currentProjectPath.split('/').pop();
  titlebarTitle.innerHTML = `${folderName} <span style="color: #888;">${data.branchName}</span>`;
}

// Handle file system change events
function handleFileChange(event) {
  console.log('File system change detected:', event);
  
  // If no file tree exists, nothing to update
  if (!fileTreeContainer) return;
  
  const {path, kind} = event;
  
  if (kind === 'remove') {
    // Find the element that corresponds to the removed file/directory
    const removedElement = document.querySelector(`.file-tree-item[data-path="${path}"]`);
    if (removedElement) {
      // Remove the element from the tree
      removedElement.parentNode.removeChild(removedElement);
    }
  } else if (kind === 'create') {
    // Find the parent directory of the created file
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    const parentElement = document.querySelector(`.file-tree-item[data-path="${parentPath}"]`);
    
    if (parentElement) {
      // Only update if the parent directory is expanded
      const childrenContainer = parentElement.querySelector('.file-tree-children');
      if (childrenContainer && childrenContainer.style.display !== 'none') {
        // Refresh the parent directory contents
        window.api.expandDirectory(parentPath).then(contents => {
          // Clear existing children
          childrenContainer.innerHTML = '';
          
          // Add updated children
          contents.forEach(child => {
            const childElement = createFileTreeElement(child);
            childrenContainer.appendChild(childElement);
          });
        }).catch(err => {
          console.error('Error refreshing directory after file creation:', err);
        });
      }
    }
  } else if (kind === 'modify') {
    // For modifications, we don't need to update the tree structure
    // unless this is a file we're currently viewing
    // If file viewer is implemented, this would refresh the content
  }
}

// Create a file tree element from a file entry
function createFileTreeElement(entry) {
  const element = document.createElement('div');
  element.className = 'file-tree-item';
  element.dataset.path = entry.path;
  element.dataset.isDir = entry.isDir;
  
  const itemContent = document.createElement('div');
  itemContent.className = 'file-tree-item-content';
  
  // Add appropriate icon based on file type
  if (entry.isDir) {
    // Add folder icon
    const folderIcon = document.createElement('img');
    folderIcon.className = 'file-icon folder-icon';
    folderIcon.src = '../../assets/icons/file_icons/folder.svg';
    folderIcon.alt = 'Folder';
    folderIcon.dataset.openIcon = '../../assets/icons/file_icons/folder_open.svg';
    folderIcon.dataset.closedIcon = '../../assets/icons/file_icons/folder.svg';
    itemContent.appendChild(folderIcon);
    
    // Add click handler for directory expansion
    itemContent.addEventListener('click', toggleDirectory);
  } else {
    // Add file icon based on extension
    const fileIcon = document.createElement('img');
    fileIcon.className = 'file-icon';
    fileIcon.src = getFileIcon(entry.name);
    fileIcon.alt = 'File';
    itemContent.appendChild(fileIcon);
    
    // Add click handler for opening files
    itemContent.addEventListener('click', openFile);
  }
  
  const nameSpan = document.createElement('span');
  nameSpan.textContent = entry.name;
  nameSpan.className = 'file-tree-name';
  itemContent.appendChild(nameSpan);
  
  element.appendChild(itemContent);
  
  // If it's a directory with children, render them too
  if (entry.isDir && entry.children && entry.children.length > 0) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'file-tree-children';
    childrenContainer.style.display = 'none'; // Initially collapsed
    
    entry.children.forEach(child => {
      const childElement = createFileTreeElement(child);
      childrenContainer.appendChild(childElement);
    });
    
    element.appendChild(childrenContainer);
  }
  
  return element;
}

// Get appropriate icon for a file based on its extension
function getFileIcon(fileName) {
  const defaultIcon = '../../assets/icons/file_icons/file.svg';
  const extension = fileName.split('.').pop().toLowerCase();
  
  // Map of file extensions to icon paths
  const iconMap = {
    // Programming languages
    'js': 'javascript.svg',
    'jsx': 'react.svg',
    'ts': 'typescript.svg',
    'tsx': 'react.svg',
    'py': 'python.svg',
    'html': 'html.svg',
    'css': 'css.svg',
    'json': 'code.svg',
    'rs': 'rust.svg',
    'go': 'go.svg',
    'c': 'c.svg',
    'cpp': 'cpp.svg',
    'java': 'java.svg',
    'kt': 'kotlin.svg',
    'swift': 'swift.svg',
    'rb': 'ruby.svg',
    'php': 'php.svg',
    'scala': 'scala.svg',
    'elm': 'elm.svg',
    'lua': 'lua.svg',
    'r': 'r.svg',
    'dart': 'dart.svg',
    'ex': 'elixir.svg',
    'exs': 'elixir.svg',
    'fs': 'fsharp.svg',
    'fsx': 'fsharp.svg',
    'hs': 'haskell.svg',
    'nim': 'nim.svg',
    'vue': 'vue.svg',
    'svelte': 'file.svg',
    'astro': 'astro.svg',
    
    // Data formats
    'toml': 'toml.svg',
    'yaml': 'file.svg',
    'yml': 'file.svg',
    'xml': 'file.svg',
    'csv': 'file.svg',
    'sql': 'database.svg',
    'graphql': 'graphql.svg',
    'prisma': 'prisma.svg',
    
    // Config files
    'gitignore': 'git.svg',
    'dockerignore': 'docker.svg',
    'eslintrc': 'eslint.svg',
    'prettierrc': 'prettier.svg',
    
    // Media
    'jpg': 'image.svg',
    'jpeg': 'image.svg',
    'png': 'image.svg',
    'gif': 'image.svg',
    'webp': 'image.svg',
    'svg': 'image.svg',
    'mp3': 'audio.svg',
    'wav': 'audio.svg',
    'mp4': 'video.svg',
    'mov': 'video.svg',
    'webm': 'video.svg',
    
    // Documents
    'md': 'code.svg',
    'pdf': 'file.svg',
    'txt': 'file.svg',
    'rtf': 'file.svg',
    'ipynb': 'notebook.svg',
    
    // Package management
    'lock': 'lock.svg',
    'package': 'package.svg',
    'cargo': 'rust.svg',
  };
  
  // Check for exact filename matches
  const exactFileMatches = {
    'package.json': 'package.svg',
    'tsconfig.json': 'typescript.svg',
    'docker-compose.yml': 'docker.svg',
    'docker-compose.yaml': 'docker.svg',
    'dockerfile': 'docker.svg',
    '.gitignore': 'git.svg',
    '.eslintrc.js': 'eslint.svg',
    '.eslintrc.json': 'eslint.svg',
    '.prettierrc': 'prettier.svg',
    'cargo.toml': 'rust.svg',
  };
  
  // Check for exact filename match
  if (exactFileMatches[fileName.toLowerCase()]) {
    return `../../assets/icons/file_icons/${exactFileMatches[fileName.toLowerCase()]}`;
  }
  
  // Check for file extension match
  if (iconMap[extension]) {
    return `../../assets/icons/file_icons/${iconMap[extension]}`;
  }
  
  return defaultIcon;
}

// Toggle directory expanded/collapsed state
async function toggleDirectory(event) {
  const itemContent = event.currentTarget;
  const item = itemContent.parentElement;
  const isDir = item.dataset.isDir === 'true';
  
  if (!isDir) return;
  
  const childrenContainer = item.querySelector('.file-tree-children');
  const folderIcon = itemContent.querySelector('.folder-icon');
  
  // If this directory has not been expanded, or was previously expanded and collapsed
  if (!childrenContainer || childrenContainer.children.length === 0) {
    try {
      // Fetch directory contents
      const contents = await window.api.expandDirectory(item.dataset.path);
      
      // Create children container if it doesn't exist
      const newChildrenContainer = childrenContainer || document.createElement('div');
      
      if (!childrenContainer) {
        newChildrenContainer.className = 'file-tree-children';
        item.appendChild(newChildrenContainer);
      } else {
        // Clear any existing children
        newChildrenContainer.innerHTML = '';
      }
      
      // Add child elements
      contents.forEach(child => {
        const childElement = createFileTreeElement(child);
        newChildrenContainer.appendChild(childElement);
      });
      
      // Show children and change folder icon
      newChildrenContainer.style.display = 'block';
      if (folderIcon && folderIcon.dataset.openIcon) {
        folderIcon.src = folderIcon.dataset.openIcon;
      }
    } catch (err) {
      console.error('Error expanding directory:', err);
    }
  } else {
    // Toggle visibility of existing children
    const isVisible = childrenContainer.style.display !== 'none';
    childrenContainer.style.display = isVisible ? 'none' : 'block';
    
    // Toggle folder icon
    if (isVisible) {
      if (folderIcon && folderIcon.dataset.closedIcon) {
        folderIcon.src = folderIcon.dataset.closedIcon;
      }
    } else {
      if (folderIcon && folderIcon.dataset.openIcon) {
        folderIcon.src = folderIcon.dataset.openIcon;
      }
    }
  }
}

// Open a file when clicked
async function openFile(event) {
  /*
   * TODO: after making rust module for editor, and making workable tabs, make this
   */
  

}

/* Add file tree CSS styles */
function addFileTreeStyles() {
  // Check if styles are already added
  if (document.getElementById('file-tree-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'file-tree-styles';
  
  styleElement.textContent = `
    .file-tree {
      overflow-y: auto;
      height: 100%;
      overflow-x: hidden;
    }
    
    /* Custom scrollbar for file tree and sidebar */
    .file-tree::-webkit-scrollbar {
      width: 4px;
    }
    
    .file-tree::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .file-tree::-webkit-scrollbar-thumb {
      background-color: #cdcdcd;
    }
    
    .sidebar::-webkit-scrollbar {
      width: 4px;
    }
    
    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .sidebar::-webkit-scrollbar-thumb {
      background-color: #cdcdcd;
    }
    
    .file-tree-item {
      margin: 0;
      padding: 0;
      position: relative;
    }
    
    .file-tree-item-content {
      display: flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      border-radius: 0.125rem;
      position: relative;
      z-index: 1;
    }
    
    .file-tree-item-content:hover {
      background-color: transparent;
    }
    
    .file-tree-item-content:hover:after {
      content: "";
      position: absolute;
      left: -100px;
      right: -100px;
      top: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.05);
      z-index: -1;
    }
    
    .file-tree-item-content.active {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .file-tree-name {
      margin-left: 0.5rem;
      font-size: 0.9375rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .file-tree-children {
      padding-left: 1rem;
    }
    
    .file-icon {
      width: 1.125em;
      height: 1.125em;
      flex-shrink: 0;
    }
    
    .recent-project-icon {
      width: 1.125em;
      height: 1.125em;
      flex-shrink: 0;
    }
  `;
  
  document.head.appendChild(styleElement);
}

/* Populate command palette */
function populateCommandPalette() {
  const list = document.getElementById('command-palette-list');
  list.innerHTML = '';
  
  commands.forEach(cmd => {
    const item = document.createElement('div');
    item.className = 'command-item';
    item.id = cmd.id;
    item.dataset.searchText = cmd.text.toLowerCase();
    
    const text = document.createElement('div');
    text.className = 'command-item-text';
    text.textContent = cmd.text;
    
    item.appendChild(text);
    item.addEventListener('click', () => {
      closeCommandPalette();
      cmd.action();
    });
    
    list.appendChild(item);
  });
}

/* Filter command palette items */
function filterCommandItems(query) {
  const items = document.querySelectorAll('.command-item');
  const lowerQuery = query.toLowerCase();
  let visibleItems = [];
  
  items.forEach(item => {
    if (lowerQuery === '' || item.dataset.searchText.includes(lowerQuery)) {
      item.classList.remove('hidden');
      visibleItems.push(item);
    } else {
      item.classList.add('hidden');
    }
  });
  
  // Reset selection
  clearCommandSelection();
  selectedCommandIndex = visibleItems.length > 0 ? 0 : -1;
  updateCommandSelection();
}

/* Clear selection highlight from all command items */
function clearCommandSelection() {
  const items = document.querySelectorAll('.command-item');
  items.forEach(item => item.classList.remove('selected'));
}

/* Update command selection based on selectedCommandIndex */
function updateCommandSelection() {
  const visibleItems = Array.from(document.querySelectorAll('.command-item:not(.hidden)'));
  
  if (selectedCommandIndex >= 0 && selectedCommandIndex < visibleItems.length) {
    clearCommandSelection();
    visibleItems[selectedCommandIndex].classList.add('selected');
    
    // Ensure the selected item is visible
    visibleItems[selectedCommandIndex].scrollIntoView({ block: 'nearest' });
  }
}

/* Navigate command palette with keys */
function handleCommandPaletteKeys(event) {
  const visibleItems = Array.from(document.querySelectorAll('.command-item:not(.hidden)'));
  
  switch(event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (visibleItems.length > 0) {
        selectedCommandIndex = (selectedCommandIndex + 1) % visibleItems.length;
        updateCommandSelection();
      }
      break;
    
    case 'ArrowUp':
      event.preventDefault();
      if (visibleItems.length > 0) {
        selectedCommandIndex = (selectedCommandIndex - 1 + visibleItems.length) % visibleItems.length;
        updateCommandSelection();
      }
      break;
    
    case 'Enter':
      event.preventDefault();
      if (selectedCommandIndex >= 0 && selectedCommandIndex < visibleItems.length) {
        visibleItems[selectedCommandIndex].click();
      }
      break;
    
    case 'Escape':
      event.preventDefault();
      closeCommandPalette();
      break;
  }
}

/* Command palette input handler */
commandPaletteInput.addEventListener('input', () => {
  filterCommandItems(commandPaletteInput.value);
});

/* Command palette keyboard handler */
commandPaletteInput.addEventListener('keydown', handleCommandPaletteKeys);

/* Move sidebar toggle button to match sidebar position */
function updateSidebarTogglePosition(position) {
  // Remove from current parent
  if (sidebarToggle.parentNode) {
    sidebarToggle.parentNode.removeChild(sidebarToggle);
  }
  
  // Add to correct side
  if (position === 'left') {
    downbarLeft.appendChild(sidebarToggle);
    sidebarToggle.querySelector('.downbar-icon').classList.remove('flip-horizontal');
    if (resizeHandle) {
      resizeHandle.classList.remove('left');
      resizeHandle.classList.add('right');
    }
  } else {
    downbarRight.appendChild(sidebarToggle);
    sidebarToggle.querySelector('.downbar-icon').classList.add('flip-horizontal');
    if (resizeHandle) {
      resizeHandle.classList.remove('right');
      resizeHandle.classList.add('left');
    }
  }
}

/* Restore file tree toggle state from persistent store */
window.api.storeGet('fileTreeActive', true).then(isActive => {
  if (!isActive) {
    sidebarToggle.classList.remove('active');
    sidebar.classList.add('hidden');
  } else {
    sidebarToggle.classList.add('active');
  }
});

/* Restore sidebar position */
window.api.storeGet('sidebarPosition', 'right').then(position => {
  if (position === 'left') {
    setSidebarPosition('left');
    updateSidebarTogglePosition('left');
    sidebarLeftBtn.classList.add('active');
    sidebarRightBtn.classList.remove('active');
  } else {
    setSidebarPosition('right');
    updateSidebarTogglePosition('right');
    sidebarLeftBtn.classList.remove('active');
    sidebarRightBtn.classList.add('active');
  }
});

/* Sidebar resize functionality */
let isResizing = false;
let lastDownX = 0;

// Setup resize handle
if (resizeHandle) {
  resizeHandle.addEventListener('mousedown', function(e) {
    isResizing = true;
    lastDownX = e.clientX;
    e.preventDefault();
  });
}

// Handle mouse move for resizing
document.addEventListener('mousemove', function(e) {
  if (!isResizing) return;
  
  const sidebarPosition = sidebarRightBtn.classList.contains('active') ? 'right' : 'left';
  const container = document.querySelector('.container');
  const containerWidth = container.offsetWidth;
  
  let newWidth;
  if (sidebarPosition === 'right') {
    // Sidebar on right, drag left to increase width
    const dx = lastDownX - e.clientX;
    newWidth = parseInt(getComputedStyle(sidebar).width, 10) + dx;
  } else {
    // Sidebar on left, drag right to increase width
    const dx = e.clientX - lastDownX;
    newWidth = parseInt(getComputedStyle(sidebar).width, 10) + dx;
  }
  
  // Constrain width between min and max values
  newWidth = Math.max(100, Math.min(newWidth, containerWidth * 0.5));
  
  sidebar.style.width = `${newWidth}px`;
  lastDownX = e.clientX;
  
  // Store new width in persistent storage
  window.api.storeSet('sidebarWidth', `${newWidth}px`);
});

// Stop resizing on mouse up
document.addEventListener('mouseup', function() {
  isResizing = false;
});

function setSidebarPosition(position) {
  if (position === 'left') {
    // Move sidebar to left
    const container = document.querySelector('.container');
    container.insertBefore(sidebar, container.firstChild);
    sidebar.style.borderRight = '1px solid #e1e1e1';
    sidebar.style.borderLeft = 'none';
  } else {
    // Move sidebar to right
    const container = document.querySelector('.container');
    container.appendChild(sidebar);
    sidebar.style.borderLeft = '1px solid #e1e1e1';
    sidebar.style.borderRight = 'none';
  }
}

/* Window control handlers */
minimizeBtn.addEventListener('click', () => {
  window.api.minimizeWindow();
});

maximizeBtn.addEventListener('click', () => {
  window.api.maximizeWindow();
});

closeBtn.addEventListener('click', () => {
  window.api.closeWindow();
});

/* Project actions */
openProjectBtn.addEventListener('click', async () => {
  try {
    const result = await window.api.openProject();
    if (result) {
      console.log('Selected directory:', result.path);
      
      // The project opening and UI update will be handled by the
      // onProjectOpened handler
    }
  } catch (err) {
    console.error('Error opening project:', err);
  }
});

newFileBtn.addEventListener('click', () => {
  window.api.newFile().then(path => {
    // File created
  });
});

cloneRepoBtn.addEventListener('click', () => {
  window.api.cloneRepo();
});

/* Toggle sidebar */
sidebarToggle.addEventListener('click', () => {
  sidebarToggle.classList.toggle('active');
  sidebar.classList.toggle('hidden');
  window.api.storeSet('fileTreeActive', sidebarToggle.classList.contains('active'));
});

/* Command palette */
function openCommandPalette() {
  // Generate command list only when opened
  populateCommandPalette();
  
  commandPalette.classList.add('visible');
  overlay.classList.add('visible');
  commandPaletteInput.value = '';
  commandPaletteInput.focus();
  
  // Start with empty results - only show commands when user types
  filterCommandItems('');
  
  // Reset the selected item
  selectedCommandIndex = -1;
}

function closeCommandPalette() {
  commandPalette.classList.remove('visible');
  overlay.classList.remove('visible');
}

/* Reorganize dialog */
function openReorganizeDialog() {
  reorganizeDialog.classList.add('visible');
  overlay.classList.add('visible');
}

function closeReorganizeDialog() {
  reorganizeDialog.classList.remove('visible');
  overlay.classList.remove('visible');
}

/* Reorganize UI actions */
sidebarLeftBtn.addEventListener('click', () => {
  sidebarLeftBtn.classList.add('active');
  sidebarRightBtn.classList.remove('active');
});

sidebarRightBtn.addEventListener('click', () => {
  sidebarRightBtn.classList.add('active');
  sidebarLeftBtn.classList.remove('active');
});

reorganizeCancel.addEventListener('click', () => {
  closeReorganizeDialog();
});

reorganizeApply.addEventListener('click', () => {
  const newPosition = sidebarLeftBtn.classList.contains('active') ? 'left' : 'right';
  setSidebarPosition(newPosition);
  updateSidebarTogglePosition(newPosition);
  window.api.storeSet('sidebarPosition', newPosition);
  closeReorganizeDialog();
});

/* Keyboard handling - multiple approaches for best compatibility */

// Approach 1: Direct key handler (most reliable)
window.addEventListener('keydown', function(e) {
  // Check for Ctrl+Shift+P
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p' || e.keyCode === 80)) {
    e.preventDefault();
    e.stopPropagation();
    openCommandPalette();
    return false;
  }
  
  // Check for 'v' key
  if (e.key === 'v' || e.keyCode === 86) {
    // Only trigger if not in an input field
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();
      openCommandPalette();
      return false;
    }
  }
}, true); // Use capture phase

// Approach 2: Traditional onkeydown
document.onkeydown = function(e) {
  e = e || window.event;
  
  // Check for Ctrl+Shift+P
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p' || e.keyCode === 80)) {
    e.preventDefault();
    openCommandPalette();
    return false;
  }
  
  // Check for 'v' key
  if ((e.key === 'v' || e.keyCode === 86) && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    // Only trigger if not in an input field
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openCommandPalette();
      return false;
    }
  }
  
  // Escape key
  if (e.key === 'Escape' || e.keyCode === 27) {
    if (commandPalette.classList.contains('visible')) {
      closeCommandPalette();
    }
    if (reorganizeDialog.classList.contains('visible')) {
      closeReorganizeDialog();
    }
  }
};

// Approach 3: Standard event listener
document.addEventListener('keydown', function(event) {
  // Command palette with Ctrl+Shift+P
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'P' || event.key === 'p' || event.keyCode === 80)) {
    event.preventDefault();
    openCommandPalette();
  }
  
  // Command palette with 'v' key
  if ((event.key === 'v' || event.keyCode === 86) && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
    // Only trigger if not in an input field
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      event.preventDefault();
      openCommandPalette();
    }
  }
});

/* Overlay click handler */
overlay.addEventListener('click', () => {
  closeCommandPalette();
  closeReorganizeDialog();
});

/* Toggle checkbox state */
function setupCheckbox(element) {
  element.addEventListener('click', () => {
    const checkbox = element.querySelector('.checkbox');
    const isChecked = checkbox.classList.contains('checkbox-checked');
    
    if (isChecked) {
      checkbox.classList.remove('checkbox-checked');
    } else {
      checkbox.classList.add('checkbox-checked');
    }
  });
}

setupCheckbox(enableVimCheck);

// Load recent projects
function loadRecentProjects() {
  // Function emptied to remove recent projects functionality
}

/* Tab functionality */
function setupTabs() {
  // Tab navigation history
  const tabHistory = {
    stack: [],
    currentIndex: -1,
    
    // Navigate to a tab and record in history
    navigateTo: function(tabId, updateUI = true) {
      // If we're not at the end of the stack, truncate the forward history
      if (this.currentIndex < this.stack.length - 1) {
        this.stack = this.stack.slice(0, this.currentIndex + 1);
      }
      
      // Only add to history if it's different from current
      if (this.stack.length === 0 || this.currentIndex === -1 || this.stack[this.currentIndex] !== tabId) {
        this.stack.push(tabId);
        this.currentIndex = this.stack.length - 1;
      }
      
      // Update UI if requested
      if (updateUI) {
        this.updateTabUI(tabId);
        this.updateArrowStates();
      }
    },
    
    // Go back in history
    goBack: function() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        const tabId = this.stack[this.currentIndex];
        this.updateTabUI(tabId);
        this.updateArrowStates();
        return true;
      }
      return false;
    },
    
    // Go forward in history
    goForward: function() {
      if (this.currentIndex < this.stack.length - 1) {
        this.currentIndex++;
        const tabId = this.stack[this.currentIndex];
        this.updateTabUI(tabId);
        this.updateArrowStates();
        return true;
      }
      return false;
    },
    
    // Update tab UI without changing history
    updateTabUI: function(tabId) {
      // Find the tab element
      const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
      if (!tab) return;
      
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to selected tab
      tab.classList.add('active');
      
      // Hide all content containers
      const contentContainers = document.querySelectorAll('[data-content-id]');
      contentContainers.forEach(container => {
        container.style.display = 'none';
      });
      
      // Show the content container that matches the tab
      const contentContainer = document.querySelector(`[data-content-id="${tabId}"]`);
      if (contentContainer) {
        contentContainer.style.display = 'flex';
        if (tabId === 'welcome') {
          contentContainer.style.flexDirection = 'column';
          contentContainer.style.justifyContent = 'center';
          contentContainer.style.alignItems = 'center';
          contentContainer.style.height = '100%';
        }
      }
    },
    
    // Update arrow states based on history position
    updateArrowStates: function() {
      const leftArrow = document.getElementById('tab-arrow-left');
      const rightArrow = document.getElementById('tab-arrow-right');
      
      // Left arrow active only if we have history to go back to
      if (this.currentIndex > 0) {
        leftArrow.classList.add('active');
        leftArrow.style.cursor = 'pointer';
        leftArrow.querySelector('img').style.opacity = '1';
      } else {
        leftArrow.classList.remove('active');
        leftArrow.style.cursor = 'not-allowed';
        leftArrow.querySelector('img').style.opacity = '0.5';
      }
      
      // Right arrow active only if we have history to go forward to
      if (this.currentIndex < this.stack.length - 1) {
        rightArrow.classList.add('active');
        rightArrow.style.cursor = 'pointer';
        rightArrow.querySelector('img').style.opacity = '1';
      } else {
        rightArrow.classList.remove('active');
        rightArrow.style.cursor = 'not-allowed';
        rightArrow.querySelector('img').style.opacity = '0.5';
      }
    }
  };
  
  // Setup tab click handlers
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tabId;
      tabHistory.navigateTo(tabId);
    });
  });
  
  // Setup arrow click handlers
  const leftArrow = document.getElementById('tab-arrow-left');
  const rightArrow = document.getElementById('tab-arrow-right');
  
  leftArrow.addEventListener('click', () => {
    tabHistory.goBack();
  });
  
  rightArrow.addEventListener('click', () => {
    tabHistory.goForward();
  });
  
  // Initialize history with active tab
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) {
    tabHistory.navigateTo(activeTab.dataset.tabId, false);
    tabHistory.updateArrowStates();
  }
}

// Setup tabs on page load
setupTabs();

const tabsContainer = document.querySelector('.tabs-container'); // Get the outer container for hover detection
const tabsScrollWrapper = document.getElementById('tabs-scroll-wrapper');
const customScrollbarContainer = document.getElementById('custom-scrollbar-container');
const customScrollbarThumb = document.getElementById('custom-scrollbar-thumb');
const tabArrows = tabsContainer.querySelector('.tab-arrows'); // Cache arrow container lookup

let scrollUpdateQueued = false; // Flag for requestAnimationFrame throttling

/* Update custom scrollbar thumb */
function updateCustomScrollbar() {
  // Reset the flag
  scrollUpdateQueued = false;

  const scrollWidth = tabsScrollWrapper.scrollWidth;
  const clientWidth = tabsScrollWrapper.clientWidth;
  const scrollLeft = tabsScrollWrapper.scrollLeft;

  // Parent container width (where the thumb lives)
  const containerWidth = customScrollbarContainer.clientWidth;
  const arrowContainerWidth = tabArrows ? tabArrows.offsetWidth : 0; // Use cached element

  // Only show scrollbar if content is scrollable
  if (scrollWidth > clientWidth && containerWidth > 0) {
    // Visibility handled by hover

    const maxScrollLeft = scrollWidth - clientWidth;
    const scrollPercentage = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;

    const availableScrollWidth = containerWidth; // Thumb lives in the full container width
    // Calculate thumb width based on visible ratio within the scroll wrapper
    const thumbWidthPercentage = Math.max(1, (clientWidth / scrollWidth) * 100);

    // Adjust thumb width and position to fit within the space *after* the arrows
    const spaceForThumb = availableScrollWidth - arrowContainerWidth;
    let adjustedThumbWidth = Math.max(5, (thumbWidthPercentage / 100) * spaceForThumb); // Min width 5px

    // Ensure thumb width doesn't exceed available space
    adjustedThumbWidth = Math.min(adjustedThumbWidth, spaceForThumb);

    const adjustedMaxThumbLeft = Math.max(0, spaceForThumb - adjustedThumbWidth);
    const adjustedThumbLeft = scrollPercentage * adjustedMaxThumbLeft;

    // Final position includes the offset of the arrows
    customScrollbarThumb.style.left = `${arrowContainerWidth + adjustedThumbLeft}px`;
    customScrollbarThumb.style.width = `${adjustedThumbWidth}px`;

  } else {
    customScrollbarThumb.style.width = '0';
    customScrollbarThumb.style.left = '0';
    // Hide container explicitly if not scrollable, even on hover
    if (!isDraggingThumb) { // Don't hide if user is actively dragging
         customScrollbarContainer.style.display = 'none';
    }
  }
}

/* Throttled scroll handler */
function handleScroll() {
    if (!scrollUpdateQueued) {
        scrollUpdateQueued = true;
        window.requestAnimationFrame(updateCustomScrollbar);
    }
}

/* Debounced resize handler */
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateCustomScrollbar();
    }, 150); // Adjust debounce delay (ms) as needed
}

/* Show/hide scrollbar on hover */
tabsContainer.addEventListener('mouseenter', () => {
   // Check if actually scrollable before showing
   if (tabsScrollWrapper.scrollWidth > tabsScrollWrapper.clientWidth) {
      customScrollbarContainer.style.display = 'block'; // Show container
      customScrollbarThumb.style.opacity = '1';      // Show thumb
      updateCustomScrollbar(); // Ensure position is correct on hover start
   }
});

tabsContainer.addEventListener('mouseleave', () => {
   customScrollbarContainer.style.display = 'none'; // Hide container
   customScrollbarThumb.style.opacity = '0';     // Hide thumb
});


/* Listen for scroll events on the wrapper */
tabsScrollWrapper.addEventListener('scroll', handleScroll); // Use throttled handler

/* Initial calculation in case content is already scrollable */
/* Needs to run slightly delayed or after layout */
window.addEventListener('load', () => {
    setTimeout(updateCustomScrollbar, 100); // Delay ensures dimensions are correct
});
/* Also recalculate on resize */
 window.addEventListener('resize', handleResize); // Use debounced handler

/* Drag handling for custom scrollbar */
let isDraggingThumb = false;
let startX = 0;
let startScrollLeft = 0;

customScrollbarThumb.addEventListener('mousedown', (e) => {
  isDraggingThumb = true;
  startX = e.clientX; // Record starting mouse position
  startScrollLeft = tabsScrollWrapper.scrollLeft; // Record starting scroll position
  customScrollbarThumb.style.cursor = 'grabbing'; // Change cursor
  document.body.style.userSelect = 'none'; // Prevent text selection during drag

  // Add listeners to the document to capture mouse move/up anywhere
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

function handleMouseMove(e) {
  if (!isDraggingThumb) return;
  e.preventDefault(); // Prevent unwanted drag behaviors

  const currentX = e.clientX;
  const dx = currentX - startX; // How far the mouse moved

  // Calculate the scaling factor: how much content scrolls per pixel of thumb movement
  const scrollWidth = tabsScrollWrapper.scrollWidth;
  const clientWidth = tabsScrollWrapper.clientWidth;
  const maxScrollLeft = scrollWidth - clientWidth;

  const containerWidth = customScrollbarContainer.clientWidth;
  const thumbWidth = customScrollbarThumb.offsetWidth;
  const maxThumbLeft = Math.max(0, containerWidth - thumbWidth);

  // Avoid division by zero if thumb/track has no movable range
  if (maxThumbLeft <= 0) return;

  // Use the available space after arrows for scaling
  const spaceForThumb = containerWidth - (tabArrows ? tabArrows.offsetWidth : 0);
  const maxThumbMovement = Math.max(0, spaceForThumb - thumbWidth);

  if (maxThumbMovement <= 0) return; // Avoid division by zero

  const scrollScale = maxScrollLeft / maxThumbMovement;
  const scrollDelta = dx * scrollScale;

  // Calculate new scroll position and clamp it
  let newScrollLeft = startScrollLeft + scrollDelta;
  newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));

  tabsScrollWrapper.scrollLeft = newScrollLeft;
  // The 'scroll' event listener on tabsScrollWrapper will update the thumb position visually (throttled)
}

function handleMouseUp() {
  if (isDraggingThumb) {
    isDraggingThumb = false;
    customScrollbarThumb.style.cursor = 'grab'; // Restore cursor
    document.body.style.userSelect = ''; // Restore text selection

    // Remove listeners from the document
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
}
