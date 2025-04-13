#![deny(clippy::all)]

use std::cell::RefCell;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use napi::bindgen_prelude::*;
use napi::{Result, Status};
use napi_derive::napi;
use napi::threadsafe_function::ThreadsafeFunction;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use walkdir::WalkDir;

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};

#[derive(Debug, Error)]
pub enum FsError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Watcher error: {0}")]
    Watcher(#[from] notify::Error),
    
    #[error("Path not found: {0}")]
    PathNotFound(String),
    
    #[error("Invalid path: {0}")]
    InvalidPath(String),
}

impl From<FsError> for napi::Error {
    fn from(error: FsError) -> Self {
        napi::Error::new(Status::GenericFailure, format!("{}", error))
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_file: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileEntry>>,
}

type WatcherCallback = Arc<Mutex<Option<ThreadsafeFunction<FileEvent>>>>;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEvent {
    pub path: String,
    pub kind: String,
}

struct ProjectWatcher {
    watcher: RecommendedWatcher,
    callback: WatcherCallback,
    root_path: PathBuf,
}

impl ProjectWatcher {
    fn new(root_path: PathBuf, callback: ThreadsafeFunction<FileEvent>) -> Result<Self> {
        let callback = Arc::new(Mutex::new(Some(callback)));
        let cb_clone: Arc<Mutex<Option<ThreadsafeFunction<FileEvent>>>> = Arc::clone(&callback);

        let watcher = RecommendedWatcher::new(
            move |result: std::result::Result<Event, notify::Error>| {
                match result {
                    Ok(event) => {
                        if let Some(callback) = cb_clone.lock().unwrap().as_ref() {
                            let kind = match event.kind {
                                EventKind::Create(_) => "create",
                                EventKind::Modify(_) => "modify",
                                EventKind::Remove(_) => "remove",
                                _ => return,
                            };

                            if let Some(path) = event.paths.first() {
                                let path_str = path.to_string_lossy().to_string();
                                let file_event = FileEvent {
                                    path: path_str,
                                    kind: kind.to_string(),
                                };

                                callback.call(Ok(file_event), napi::threadsafe_function::ThreadsafeFunctionCallMode::Blocking);
                            }
                        }
                    }
                    Err(e) => eprintln!("Watch error: {:?}", e),
                }
            },
            Config::default(),
        ).map_err(FsError::Watcher)?;

        Ok(Self {
            watcher,
            callback,
            root_path,
        })
    }

    fn start_watching(&mut self) -> Result<()> {
        self.watcher.watch(&self.root_path, RecursiveMode::Recursive)
            .map_err(|e| napi::Error::new(Status::GenericFailure, format!("Failed to watch directory: {}", e)))
    }
}

thread_local! {
    static PROJECT_WATCHERS: RefCell<HashMap<String, ProjectWatcher>> = RefCell::new(HashMap::new());
}

#[napi]
pub fn open_project(path: String) -> Result<FileEntry> {
    let path = Path::new(&path);
    
    if !path.exists() {
        return Err(napi::Error::new(
            Status::GenericFailure,
            format!("Path does not exist: {}", path.display()),
        ));
    }
    
    if !path.is_dir() {
        return Err(napi::Error::new(
            Status::GenericFailure,
            format!("Path is not a directory: {}", path.display()),
        ));
    }
    
    let tree = build_file_tree(path)?;
    Ok(tree)
}

#[napi]
pub fn watch_project(path: String, callback: ThreadsafeFunction<FileEvent>) -> Result<()> {
    let path_buf = PathBuf::from(&path);
    
    if !path_buf.exists() || !path_buf.is_dir() {
        return Err(napi::Error::new(
            Status::GenericFailure,
            format!("Path is not a valid directory: {}", path),
        ));
    }
    
    PROJECT_WATCHERS.with(|watchers| {
        let mut watchers = watchers.borrow_mut();
        
        // Stop any existing watcher for this path
        if watchers.contains_key(&path) {
            watchers.remove(&path);
        }
        
        // Create a new watcher
        let mut project_watcher = ProjectWatcher::new(path_buf, callback)?;
        project_watcher.start_watching()?;
        
        // Store the watcher
        watchers.insert(path, project_watcher);
        
        Ok(())
    })
}

#[napi]
pub fn stop_watching(path: String) -> Result<bool> {
    PROJECT_WATCHERS.with(|watchers| {
        let mut watchers = watchers.borrow_mut();
        
        if let Some(watcher) = watchers.remove(&path) {
            // Clean up the callback to avoid memory leaks
            let mut callback = watcher.callback.lock().unwrap();
            *callback = None;
            Ok(true)
        } else {
            Ok(false)
        }
    })
}

#[napi]
pub fn get_directory_contents(path: String) -> Result<Vec<FileEntry>> {
    let path = Path::new(&path);
    
    if !path.exists() || !path.is_dir() {
        return Err(napi::Error::new(
            Status::GenericFailure,
            format!("Path is not a valid directory: {}", path.display()),
        ));
    }
    
    let entries = fs::read_dir(path).map_err(|e| {
        napi::Error::new(
            Status::GenericFailure,
            format!("Failed to read directory: {}", e),
        )
    })?;
    
    let mut file_entries = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| {
            napi::Error::new(
                Status::GenericFailure,
                format!("Failed to read directory entry: {}", e),
            )
        })?;
        
        let metadata = entry.metadata().map_err(|e| {
            napi::Error::new(
                Status::GenericFailure,
                format!("Failed to read metadata: {}", e),
            )
        })?;
        
        let name = entry.file_name().to_string_lossy().to_string();
        let path = entry.path().to_string_lossy().to_string();
        
        file_entries.push(FileEntry {
            name,
            path,
            is_dir: metadata.is_dir(),
            is_file: metadata.is_file(),
            size: if metadata.is_file() { Some(metadata.len() as i64) } else { None },
            children: None,
        });
    }
    
    // Sort: directories first, then files, both alphabetically
    file_entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(file_entries)
}

#[napi]
pub fn read_file_contents(path: String) -> Result<String> {
    let path = Path::new(&path);
    
    if !path.exists() || !path.is_file() {
        return Err(napi::Error::new(
            Status::GenericFailure,
            format!("Path is not a valid file: {}", path.display()),
        ));
    }
    
    fs::read_to_string(path).map_err(|e| {
        napi::Error::new(
            Status::GenericFailure,
            format!("Failed to read file: {}", e),
        )
    })
}

fn build_file_tree(path: &Path) -> Result<FileEntry> {
    let metadata = fs::metadata(path).map_err(|e| {
        napi::Error::new(
            Status::GenericFailure, 
            format!("Failed to read metadata: {}", e),
        )
    })?;
    
    let name = path.file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());
    
    let path_str = path.to_string_lossy().to_string();
    
    if metadata.is_file() {
        return Ok(FileEntry {
            name,
            path: path_str,
            is_dir: false,
            is_file: true,
            size: Some(metadata.len() as i64),
            children: None,
        });
    }
    
    // For directories, only get immediate children (don't recursively build the entire tree)
    let mut children = Vec::new();
    let dir_entries = fs::read_dir(path).map_err(|e| {
        napi::Error::new(
            Status::GenericFailure,
            format!("Failed to read directory: {}", e),
        )
    })?;
    
    for entry in dir_entries {
        let entry = entry.map_err(|e| {
            napi::Error::new(
                Status::GenericFailure,
                format!("Failed to read directory entry: {}", e),
            )
        })?;
        
        let child_path = entry.path();
        let child_metadata = entry.metadata().map_err(|e| {
            napi::Error::new(
                Status::GenericFailure,
                format!("Failed to read metadata: {}", e),
            )
        })?;
        
        let child_name = child_path.file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| child_path.to_string_lossy().to_string());
        
        let child_path_str = child_path.to_string_lossy().to_string();
        
        children.push(FileEntry {
            name: child_name,
            path: child_path_str,
            is_dir: child_metadata.is_dir(),
            is_file: child_metadata.is_file(),
            size: if child_metadata.is_file() { Some(child_metadata.len() as i64) } else { None },
            children: None, // Don't expand children for this level
        });
    }
    
    // Sort: directories first, then files, both alphabetically
    children.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(FileEntry {
        name,
        path: path_str,
        is_dir: true,
        is_file: false,
        size: None,
        children: Some(children),
    })
}

#[napi]
pub fn expand_directory(path: String) -> Result<Vec<FileEntry>> {
    let path = Path::new(&path);
    
    if !path.exists() || !path.is_dir() {
        return Err(napi::Error::new(
            Status::GenericFailure,
            format!("Path is not a valid directory: {}", path.display()),
        ));
    }
    
    get_directory_contents(path.to_string_lossy().to_string())
}
