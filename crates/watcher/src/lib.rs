#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use napi::{
  bindgen_prelude::*,
  threadsafe_function::{ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode},
  JsFunction,
};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  path::{Path, PathBuf},
  sync::Arc,
};
use tokio::sync::oneshot;

// Helper function to convert notify errors to napi errors
fn convert_notify_error(error: notify::Error) -> Error {
  Error::new(Status::GenericFailure, error.to_string())
}

#[derive(Serialize, Deserialize)]
#[napi(object)]
pub struct FileEvent {
  pub path: String,
  pub event_type: String,
}

#[napi(object)]
pub struct WatchOptions {
  pub recursive: Option<bool>,
  pub ignore_paths: Option<Vec<String>>,
}

struct WatchContext {
  watchers: HashMap<String, (RecommendedWatcher, oneshot::Sender<()>)>,
  ignore_paths: Vec<PathBuf>,
}

#[napi]
pub struct FileWatcher {
  context: Arc<RwLock<WatchContext>>,
}

#[napi]
impl FileWatcher {
  #[napi(constructor)]
  pub fn new() -> Self {
    FileWatcher {
      context: Arc::new(RwLock::new(WatchContext {
        watchers: HashMap::new(),
        ignore_paths: Vec::new(),
      })),
    }
  }

  #[napi]
  pub fn watch_path(
    &self,
    path: String,
    on_event: JsFunction,
    options: Option<WatchOptions>,
  ) -> Result<()> {
    let options = options.unwrap_or(WatchOptions {
      recursive: Some(true),
      ignore_paths: None,
    });
    
    let recursive = options.recursive.unwrap_or(true);
    let ignore_paths = options.ignore_paths.unwrap_or_default();
    
    let path_clone = path.clone();
    let context = self.context.clone();
    
    // Store ignore paths
    {
      let mut ctx = context.write();
      ctx.ignore_paths = ignore_paths
        .iter()
        .map(|p| PathBuf::from(p))
        .collect();
    }
    
    // Create a threadsafe function to call back into JS
    let tsfn: ThreadsafeFunction<FileEvent, ErrorStrategy::Fatal> = on_event
      .create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))
      .map_err(|e| Error::new(Status::GenericFailure, format!("{}", e)))?;
    
    // Setup the watcher and channel for shutdown
    let (tx, rx) = oneshot::channel();
    let config = Config::default()
      .with_poll_interval(std::time::Duration::from_millis(100));
    
    // Create an event handler that properly handles notify errors
    // We need to clone the context for the event handler
    let handler_context = context.clone();
    let event_handler = move |res: std::result::Result<Event, notify::Error>| {
      match res {
        Ok(event) => {
          // Skip events for ignored paths
          let is_ignored = {
            let ctx = handler_context.read();
            event
              .paths
              .iter()
              .any(|event_path| {
                ctx.ignore_paths.iter().any(|ignore_path| {
                  event_path.starts_with(ignore_path)
                })
              })
          };
          
          if !is_ignored {
            for event_path in &event.paths {
              if let Some(path_str) = event_path.to_str() {
                let event_type = match event.kind {
                  EventKind::Create(_) => "create",
                  EventKind::Modify(_) => "modify",
                  EventKind::Remove(_) => "remove",
                  EventKind::Access(_) => "access",
                  _ => "other",
                };
                
                let file_event = FileEvent {
                  path: path_str.to_string(),
                  event_type: event_type.to_string(),
                };
                
                let _ = tsfn.call(file_event, ThreadsafeFunctionCallMode::Blocking);
              }
            }
          }
        }
        Err(e) => {
          // Just log the error
          eprintln!("Watch error: {}", e);
        }
      }
    };
    
    // Setup the watcher with the event handler
    let mut watcher = RecommendedWatcher::new(event_handler, config)
      .map_err(convert_notify_error)?;
    
    // Start watching
    let watch_path = Path::new(&path);
    let mode = if recursive {
      RecursiveMode::Recursive
    } else {
      RecursiveMode::NonRecursive
    };
    
    watcher.watch(watch_path, mode)
      .map_err(convert_notify_error)?;
    
    // Store the watcher in our context
    {
      let mut ctx = context.write();
      ctx.watchers.insert(path.clone(), (watcher, tx));
    }
    
    // Spawn a thread to clean up the watcher when signaled
    let context_for_task = context.clone();
    std::thread::spawn(move || {
      // Block on the oneshot channel
      let _ = rx.blocking_recv();
      // The watcher will be dropped when removed from the map
      let mut ctx = context_for_task.write();
      ctx.watchers.remove(&path_clone);
    });
    
    Ok(())
  }
  
  #[napi]
  pub fn unwatch_path(&self, path: String) -> bool {
    let mut ctx = self.context.write();
    if let Some((_, tx)) = ctx.watchers.remove(&path) {
      let _ = tx.send(());
      true
    } else {
      false
    }
  }
  
  #[napi]
  pub fn get_watched_paths(&self) -> Vec<String> {
    let ctx = self.context.read();
    ctx.watchers.keys().cloned().collect()
  }
  
  #[napi]
  pub fn is_watching(&self, path: String) -> bool {
    let ctx = self.context.read();
    ctx.watchers.contains_key(&path)
  }
  
  #[napi]
  pub fn unwatch_all(&self) -> bool {
    let mut ctx = self.context.write();
    let paths: Vec<String> = ctx.watchers.keys().cloned().collect();
    
    for (_, (_, tx)) in ctx.watchers.drain() {
      let _ = tx.send(());
    }
    
    !paths.is_empty()
  }
}
