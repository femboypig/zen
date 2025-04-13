// Elements
const openProjectBtn = document.getElementById('open-project');
const newFileBtn = document.getElementById('new-file');
const cloneRepoBtn = document.getElementById('clone-repo');

const minimizeBtn = document.getElementById('minimize-button');
const maximizeBtn = document.getElementById('maximize-button');
const closeBtn = document.getElementById('close-button');
const menuBtn = document.getElementById('menu-button');

// Sidebar and file tree elements
const sidebarElement = document.querySelector('.sidebar');
const welcomeContainer = document.querySelector('.welcome-container');
let fileTreeContainer = null;

// Checkboxes
const enableVimCheck = document.getElementById('enable-vim');
const sendUsageCheck = document.getElementById('send-usage');
const sendReportsCheck = document.getElementById('send-reports');

// Track current project
let currentProjectPath = null;

// Event Listeners
openProjectBtn.addEventListener('click', openProject);
newFileBtn.addEventListener('click', newFile);
cloneRepoBtn.addEventListener('click', cloneRepo);

minimizeBtn.addEventListener('click', minimizeWindow);
maximizeBtn.addEventListener('click', maximizeWindow);
closeBtn.addEventListener('click', closeWindow);
menuBtn.addEventListener('click', toggleMenu);

// Checkbox event listeners
enableVimCheck.addEventListener('click', toggleCheckbox);
sendUsageCheck.addEventListener('click', toggleCheckbox);
sendReportsCheck.addEventListener('click', toggleCheckbox);

// File system change listener
window.api.onFileSystemChange(handleFileChange);

// Functions
async function openProject() {
  try {
    const result = await window.api.openProject();
    if (result) {
      console.log('Selected directory:', result.path);
      
      // Save the current project path
      currentProjectPath = result.path;
      
      // Show the sidebar
      sidebarElement.classList.remove('hidden');
      
      // Hide welcome screen
      welcomeContainer.style.display = 'none';
      
      // Initialize file tree
      initializeFileTree(result.fileTree);
      
      // Save project path to store for recent projects
      window.api.storeSet('lastProject', result.path);
    }
  } catch (err) {
    console.error('Error opening project:', err);
  }
}

function initializeFileTree(fileTree) {
  // Create file tree container if it doesn't exist
  if (!fileTreeContainer) {
    fileTreeContainer = document.createElement('div');
    fileTreeContainer.className = 'file-tree';
    sidebarElement.appendChild(fileTreeContainer);
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

function createFileTreeElement(entry) {
  const element = document.createElement('div');
  element.className = 'file-tree-item';
  element.dataset.path = entry.path;
  element.dataset.isDir = entry.isDir;
  
  const itemContent = document.createElement('div');
  itemContent.className = 'file-tree-item-content';
  
  // Add arrow icon for directories
  if (entry.isDir) {
    const arrowIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowIcon.setAttribute('width', '12');
    arrowIcon.setAttribute('height', '12');
    arrowIcon.setAttribute('viewBox', '0 0 12 12');
    arrowIcon.classList.add('directory-arrow');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4 2l4 4-4 4');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    
    arrowIcon.appendChild(path);
    itemContent.appendChild(arrowIcon);
    
    // Add click handler for directory expansion
    itemContent.addEventListener('click', toggleDirectory);
  } else {
    // Add some spacing for files to align with directories
    const spacer = document.createElement('span');
    spacer.className = 'file-spacer';
    spacer.style.width = '12px';
    spacer.style.display = 'inline-block';
    itemContent.appendChild(spacer);
    
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

async function toggleDirectory(event) {
  const itemContent = event.currentTarget;
  const item = itemContent.parentElement;
  const isDir = item.dataset.isDir === 'true';
  
  if (!isDir) return;
  
  const childrenContainer = item.querySelector('.file-tree-children');
  const arrow = itemContent.querySelector('.directory-arrow');
  
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
      
      // Show children and rotate arrow
      newChildrenContainer.style.display = 'block';
      arrow.classList.add('rotated');
    } catch (err) {
      console.error('Error expanding directory:', err);
    }
  } else {
    // Toggle visibility of existing children
    const isVisible = childrenContainer.style.display !== 'none';
    childrenContainer.style.display = isVisible ? 'none' : 'block';
    
    // Toggle arrow direction
    if (isVisible) {
      arrow.classList.remove('rotated');
    } else {
      arrow.classList.add('rotated');
    }
  }
}

async function openFile(event) {
  const itemContent = event.currentTarget;
  const item = itemContent.parentElement;
  const isDir = item.dataset.isDir === 'true';
  
  if (isDir) return;
  
  try {
    const filePath = item.dataset.path;
    const content = await window.api.readFileContents(filePath);
    
    console.log(`File opened: ${filePath}`);
    console.log('Content:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
    
    // TODO: Open file in editor - this would be part of the editor implementation
    // For now, just highlight the selected file
    const allFiles = document.querySelectorAll('.file-tree-item[data-is-dir="false"] .file-tree-item-content');
    allFiles.forEach(file => file.classList.remove('active'));
    itemContent.classList.add('active');
  } catch (err) {
    console.error('Error opening file:', err);
  }
}

function handleFileChange(event) {
  console.log('File system change detected:', event);
  
  // If no file tree exists, nothing to update
  if (!fileTreeContainer) return;
  
  const {path, kind} = event;
  
  // Find the parent directory of the changed file
  const pathParts = path.split('/');
  pathParts.pop(); // Remove the file/directory name
  const parentPath = pathParts.join('/');
  
  // Find the parent directory element
  const parentElement = document.querySelector(`.file-tree-item[data-path="${parentPath}"]`);
  
  if (parentElement) {
    // If the parent has been expanded (has visible children), refresh it
    const childrenContainer = parentElement.querySelector('.file-tree-children');
    if (childrenContainer && childrenContainer.style.display !== 'none') {
      // Reload the directory contents
      window.api.expandDirectory(parentPath).then(contents => {
        // Clear existing children
        childrenContainer.innerHTML = '';
        
        // Add updated children
        contents.forEach(child => {
          const childElement = createFileTreeElement(child);
          childrenContainer.appendChild(childElement);
        });
      }).catch(err => {
        console.error('Error refreshing directory after file change:', err);
      });
    }
  } else {
    // If the parent element isn't found, it might be a change at the project root
    // Refresh the entire file tree
    if (currentProjectPath) {
      window.api.openProject().then(result => {
        if (result) {
          initializeFileTree(result.fileTree);
        }
      }).catch(err => {
        console.error('Error refreshing file tree:', err);
      });
    }
  }
}

function addFileTreeStyles() {
  // Check if styles are already added
  if (document.getElementById('file-tree-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'file-tree-styles';
  
  styleElement.textContent = `
    .file-tree {
      padding: 0.5rem 0;
      overflow-y: auto;
      height: calc(100% - 1rem);
    }
    
    .file-tree-item {
      margin: 0;
      padding: 0;
    }
    
    .file-tree-item-content {
      display: flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      border-radius: 0.125rem;
    }
    
    .file-tree-item-content:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .file-tree-item-content.active {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .file-tree-name {
      margin-left: 0.5rem;
      font-size: 0.8125rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .file-tree-children {
      margin-left: 1rem;
    }
    
    .directory-arrow {
      transition: transform 0.1s ease;
    }
    
    .directory-arrow.rotated {
      transform: rotate(90deg);
    }
  `;
  
  document.head.appendChild(styleElement);
}

async function newFile() {
  try {
    const result = await window.api.newFile();
    if (result) {
      console.log('New file created:', result);
      // Logic to open the new file would go here
    }
  } catch (err) {
    console.error('Error creating file:', err);
  }
}

async function cloneRepo() {
  try {
    const result = await window.api.cloneRepo();
    console.log(result);
    // Logic to handle cloned repository would go here
  } catch (err) {
    console.error('Error cloning repository:', err);
  }
}

// Window control functions
function minimizeWindow() {
  window.api.minimizeWindow();
}

function maximizeWindow() {
  window.api.maximizeWindow();
}

function closeWindow() {
  window.api.closeWindow();
}

function toggleMenu() {
  console.log('Menu toggled');
  // Menu functionality would go here
}

// Toggle checkbox state
function toggleCheckbox(event) {
  const checkbox = event.currentTarget.querySelector('.checkbox');
  
  if (checkbox.classList.contains('checkbox-checked')) {
    checkbox.classList.remove('checkbox-checked');
  } else {
    checkbox.classList.add('checkbox-checked');
  }
  
  const id = event.currentTarget.id;
  const isChecked = checkbox.classList.contains('checkbox-checked');
  
  // Handle specific checkbox behaviors
  switch (id) {
    case 'enable-vim':
      console.log('Vim mode', isChecked ? 'enabled' : 'disabled');
      break;
    case 'send-usage':
      console.log('Send usage data', isChecked ? 'enabled' : 'disabled');
      break;
    case 'send-reports':
      console.log('Send crash reports', isChecked ? 'enabled' : 'disabled');
      break;
  }
} 