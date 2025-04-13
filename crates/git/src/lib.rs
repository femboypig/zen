#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;
extern crate git2;

use git2::{Repository, Oid, Signature, BranchType, StatusOptions, Status as GitStatus};
use napi::{Error, Result, Status};
use std::path::Path;
use std::collections::HashMap;

#[napi]
pub struct GitRepo {
  repo: Repository,
}

#[napi]
#[derive(Debug)]
pub struct FileStatus {
  pub path: String,
  pub is_new: bool,
  pub is_modified: bool,
  pub is_deleted: bool,
  pub is_renamed: bool,
  pub is_ignored: bool,
}

#[napi]
#[derive(Debug)]
pub struct FileMetadata {
  pub path: String,
  pub last_commit_hash: String,
  pub last_commit_message: String,
  pub last_author_name: String,
  pub last_author_email: String,
  pub last_commit_time: i64,
  pub added_lines: i32,
  pub deleted_lines: i32,
}

#[napi]
#[derive(Debug)]
pub struct CommitInfo {
  pub commit_hash: String,
  pub commit_message: String,
  pub author_name: String,
  pub author_email: String,
  pub commit_time: i64,
  pub added_lines: i32,
  pub deleted_lines: i32,
}

#[napi]
#[derive(Debug)]
pub struct TagInfo {
  pub name: String,
  pub target_commit: String,
  pub message: String,
  pub tagger_name: String,
  pub tagger_email: String,
  pub tag_time: i64,
}

#[napi]
impl GitRepo {
  #[napi(constructor)]
  pub fn new(path: String) -> Result<Self> {
    match Repository::open(path) {
      Ok(repo) => Ok(GitRepo { repo }),
      Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to open repository: {}", e))),
    }
  }

  #[napi]
  pub fn get_head_commit_hash(&self) -> Result<String> {
    match self.repo.head() {
      Ok(head) => {
        let commit = head.peel_to_commit()
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get commit: {}", e)))?;
        Ok(commit.id().to_string())
      },
      Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to get HEAD: {}", e))),
    }
  }

  #[napi]
  pub fn get_current_branch(&self) -> Result<String> {
    match self.repo.head() {
      Ok(head) => {
        if head.is_branch() {
          let branch_name = head.shorthand()
            .ok_or_else(|| Error::new(Status::GenericFailure, "Failed to get branch name".to_string()))?;
          Ok(branch_name.to_string())
        } else {
          Err(Error::new(Status::GenericFailure, "HEAD is not a branch".to_string()))
        }
      },
      Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to get HEAD: {}", e))),
    }
  }

  #[napi]
  pub fn get_remote_url(&self, name: String) -> Result<String> {
    match self.repo.find_remote(&name) {
      Ok(remote) => {
        let url = remote.url()
          .ok_or_else(|| Error::new(Status::GenericFailure, format!("No URL found for remote {}", name)))?;
        Ok(url.to_string())
      },
      Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to find remote {}: {}", name, e))),
    }
  }

  #[napi]
  pub fn create_branch(&self, name: String, target_commit: Option<String>) -> Result<()> {
    let target = match target_commit {
      Some(commit_id) => {
        let oid = Oid::from_str(&commit_id)
          .map_err(|e| Error::new(Status::GenericFailure, format!("Invalid commit ID: {}", e)))?;
        self.repo.find_commit(oid)
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find commit: {}", e)))?
      },
      None => {
        let head = self.repo.head()
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get HEAD: {}", e)))?;
        head.peel_to_commit()
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get commit: {}", e)))?
      }
    };

    self.repo.branch(&name, &target, false)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create branch: {}", e)))?;

    Ok(())
  }

  #[napi]
  pub fn checkout_branch(&self, name: String) -> Result<()> {
    let branch = self.repo.find_branch(&name, BranchType::Local)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find branch {}: {}", name, e)))?;
    
    let obj = branch.get().peel(git2::ObjectType::Commit)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to peel to commit: {}", e)))?;
    
    self.repo.checkout_tree(&obj, None)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to checkout tree: {}", e)))?;
    
    self.repo.set_head(&format!("refs/heads/{}", name))
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to set HEAD: {}", e)))?;
    
    Ok(())
  }

  #[napi]
  pub fn get_file_status(&self) -> Result<Vec<FileStatus>> {
    let mut status_options = StatusOptions::new();
    status_options.include_untracked(true);
    
    let statuses = self.repo.statuses(Some(&mut status_options))
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get status: {}", e)))?;
    
    let mut result = Vec::new();
    for entry in statuses.iter() {
      let path = entry.path().unwrap_or("").to_string();
      let status = entry.status();
      
      result.push(FileStatus {
        path,
        is_new: status.contains(GitStatus::WT_NEW) || status.contains(GitStatus::INDEX_NEW),
        is_modified: status.contains(GitStatus::WT_MODIFIED) || status.contains(GitStatus::INDEX_MODIFIED),
        is_deleted: status.contains(GitStatus::WT_DELETED) || status.contains(GitStatus::INDEX_DELETED),
        is_renamed: status.contains(GitStatus::WT_RENAMED) || status.contains(GitStatus::INDEX_RENAMED),
        is_ignored: status.contains(GitStatus::IGNORED),
      });
    }
    
    Ok(result)
  }

  #[napi]
  pub fn commit(&self, message: String, author_name: String, author_email: String) -> Result<String> {
    let signature = Signature::now(&author_name, &author_email)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create signature: {}", e)))?;
    
    let head = self.repo.head()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get HEAD: {}", e)))?;
    
    let head_commit = head.peel_to_commit()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get head commit: {}", e)))?;
    
    let tree_id = self.repo.index()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get index: {}", e)))?
      .write_tree()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to write tree: {}", e)))?;
    
    let tree = self.repo.find_tree(tree_id)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find tree: {}", e)))?;
    
    let commit_id = self.repo.commit(
      Some("HEAD"),
      &signature,
      &signature,
      &message,
      &tree,
      &[&head_commit]
    ).map_err(|e| Error::new(Status::GenericFailure, format!("Failed to commit: {}", e)))?;
    
    Ok(commit_id.to_string())
  }

  #[napi]
  pub fn add_all(&self) -> Result<()> {
    let mut index = self.repo.index()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get index: {}", e)))?;
    
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to add files: {}", e)))?;
    
    index.write()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to write index: {}", e)))?;
    
    Ok(())
  }

  #[napi]
  pub fn push(&self, remote_name: String, branch_name: String) -> Result<()> {
    let mut remote = self.repo.find_remote(&remote_name)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find remote {}: {}", remote_name, e)))?;
    
    // For a real implementation, we would need to handle authentication
    // This is a simplified version that assumes SSH keys are set up
    remote.push(&[&format!("refs/heads/{0}:refs/heads/{0}", branch_name)], None)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to push: {}", e)))?;
    
    Ok(())
  }

  #[napi]
  pub fn get_file_metadata(&self, file_path: String) -> Result<FileMetadata> {
    // Create a revwalk to iterate through the repository's commits
    let mut revwalk = self.repo.revwalk()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create revwalk: {}", e)))?;

    // Configure revwalk to start from HEAD and go backwards
    revwalk.push_head()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to push HEAD to revwalk: {}", e)))?;

    // Iterate through commits to find the last one that modified the file
    for oid_result in revwalk {
      let oid = oid_result
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get commit oid: {}", e)))?;
      
      let commit = self.repo.find_commit(oid)
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find commit: {}", e)))?;
      
      if let Ok(diff) = self.get_commit_diff(&commit) {
        // Check if this commit touches our file
        let mut file_changed = false;
        let mut added_lines = 0;
        let mut deleted_lines = 0;
        
        diff.foreach(
          &mut |_delta, _progress| true,
          None,
          None,
          Some(&mut |delta, _hunk, line| {
            let old_path = delta.old_file().path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
            let new_path = delta.new_file().path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
            
            if old_path == file_path || new_path == file_path {
              file_changed = true;
              match line.origin() {
                '+' => added_lines += 1,
                '-' => deleted_lines += 1,
                _ => {}
              }
            }
            true
          }),
        ).unwrap_or(());
        
        if file_changed {
          // This commit changed the file, return metadata
          let author = commit.author();
          let time = commit.time();
          let timestamp = time.seconds();
          
          return Ok(FileMetadata {
            path: file_path.clone(),
            last_commit_hash: commit.id().to_string(),
            last_commit_message: commit.message().unwrap_or("").to_string(),
            last_author_name: author.name().unwrap_or("").to_string(),
            last_author_email: author.email().unwrap_or("").to_string(),
            last_commit_time: timestamp,
            added_lines,
            deleted_lines,
          });
        }
      }
    }
    
    // If we got here, no commit was found that modified the file
    Err(Error::new(Status::GenericFailure, format!("Could not find commits for file: {}", file_path)))
  }

  #[napi]
  pub fn list_files_with_metadata(&self, directory_path: Option<String>) -> Result<Vec<FileMetadata>> {
    let base_path = directory_path.unwrap_or_else(|| ".".to_string());
    let mut result = Vec::new();
    
    // Get all files from the repository, включая неотслеживаемые
    let mut status_options = StatusOptions::new();
    status_options.include_untracked(true); // Включаем неотслеживаемые файлы
    status_options.recurse_untracked_dirs(true);
    status_options.include_ignored(false);
    
    let statuses = self.repo.statuses(Some(&mut status_options))
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get status: {}", e)))?;
    
    // Также получаем список всех файлов в индексе
    let mut all_files = HashMap::new();
    
    // Добавляем файлы из статуса
    for entry in statuses.iter() {
      if let Some(path_str) = entry.path() {
        // Check if file is in requested directory
        let full_path = Path::new(path_str);
        let in_directory = full_path.starts_with(&base_path) || base_path == ".";
        
        if in_directory {
          all_files.insert(path_str.to_string(), true);
        }
      }
    }
    
    // Добавляем файлы из индекса (которые уже коммичены)
    if let Ok(head) = self.repo.head() {
      if let Ok(head_commit) = head.peel_to_commit() {
        if let Ok(tree) = head_commit.tree() {
          tree.walk(git2::TreeWalkMode::PreOrder, |dir, entry| {
            if let Some(name) = entry.name() {
              let path = if dir.is_empty() { name.to_string() } else { format!("{}{}", dir, name) };
              let full_path = Path::new(&path);
              let in_directory = full_path.starts_with(&base_path) || base_path == ".";
              
              if in_directory && entry.kind() == Some(git2::ObjectType::Blob) {
                all_files.insert(path, true);
              }
            }
            0
          }).ok();
        }
      }
    }
    
    // Получаем метаданные для каждого файла
    for path in all_files.keys() {
      // Если это .git директория, пропускаем
      if path.starts_with(".git/") {
        continue;
      }
      
      // Получаем метаданные на основе истории
      if let Ok(metadata) = self.get_file_metadata(path.clone()) {
        result.push(metadata);
      } else {
        // Для новых файлов, которые еще не коммичены
        if let Some(file_stat) = statuses.iter().find(|entry| entry.path() == Some(path)) {
          if file_stat.status().contains(GitStatus::WT_NEW) || file_stat.status().contains(GitStatus::INDEX_NEW) {
            result.push(FileMetadata {
              path: path.clone(),
              last_commit_hash: "".to_string(),
              last_commit_message: "Untracked file".to_string(),
              last_author_name: "".to_string(),
              last_author_email: "".to_string(),
              last_commit_time: 0,
              added_lines: 0,
              deleted_lines: 0,
            });
          }
        }
      }
    }
    
    Ok(result)
  }

  #[napi]
  pub fn get_file_history(&self, file_path: String) -> Result<Vec<CommitInfo>> {
    let mut result = Vec::new();
    
    // Create a revwalk to iterate through the repository's commits
    let mut revwalk = self.repo.revwalk()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create revwalk: {}", e)))?;

    // Configure revwalk to start from HEAD and go backwards
    revwalk.push_head()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to push HEAD to revwalk: {}", e)))?;

    // Iterate through commits
    for oid_result in revwalk {
      let oid = oid_result
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get commit oid: {}", e)))?;
      
      let commit = self.repo.find_commit(oid)
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find commit: {}", e)))?;
      
      if let Ok(diff) = self.get_commit_diff(&commit) {
        // Check if this commit touches our file
        let mut file_changed = false;
        let mut added_lines = 0;
        let mut deleted_lines = 0;
        
        diff.foreach(
          &mut |_delta, _progress| true,
          None,
          None,
          Some(&mut |delta, _hunk, line| {
            let old_path = delta.old_file().path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
            let new_path = delta.new_file().path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
            
            if old_path == file_path || new_path == file_path {
              file_changed = true;
              match line.origin() {
                '+' => added_lines += 1,
                '-' => deleted_lines += 1,
                _ => {}
              }
            }
            true
          }),
        ).unwrap_or(());
        
        if file_changed {
          // This commit changed the file, add to history
          let author = commit.author();
          let time = commit.time();
          
          result.push(CommitInfo {
            commit_hash: commit.id().to_string(),
            commit_message: commit.message().unwrap_or("").to_string(),
            author_name: author.name().unwrap_or("").to_string(),
            author_email: author.email().unwrap_or("").to_string(),
            commit_time: time.seconds(),
            added_lines,
            deleted_lines,
          });
        }
      }
    }
    
    Ok(result)
  }

  #[napi]
  pub fn list_tags(&self) -> Result<Vec<TagInfo>> {
    let mut result = Vec::new();
    
    let tag_names = self.repo.tag_names(None)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to list tags: {}", e)))?;
    
    for name_opt in tag_names.iter() {
      if let Some(name) = name_opt {
        let obj = self.repo.revparse_single(&format!("refs/tags/{}", name))
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find tag object: {}", e)))?;
        
        if let Ok(tag) = obj.into_tag() {
          let target = tag.target_id().to_string();
          let tagger = tag.tagger().unwrap_or_else(|| Signature::now("", "").unwrap());
          let timestamp = tagger.when().seconds();
          
          result.push(TagInfo {
            name: name.to_string(),
            target_commit: target,
            message: tag.message().unwrap_or("").to_string(),
            tagger_name: tagger.name().unwrap_or("").to_string(),
            tagger_email: tagger.email().unwrap_or("").to_string(),
            tag_time: timestamp,
          });
        } else {
          // Lightweight tag
          let obj = self.repo.revparse_single(name)
            .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find reference: {}", e)))?;
          
          if let Ok(commit) = obj.into_commit() {
            let author = commit.author();
            let timestamp = author.when().seconds();
            
            result.push(TagInfo {
              name: name.to_string(),
              target_commit: commit.id().to_string(),
              message: "".to_string(), // lightweight tags don't have messages
              tagger_name: author.name().unwrap_or("").to_string(),
              tagger_email: author.email().unwrap_or("").to_string(),
              tag_time: timestamp,
            });
          }
        }
      }
    }
    
    Ok(result)
  }

  #[napi]
  pub fn create_tag(&self, tag_name: String, message: Option<String>, target_commit: Option<String>) -> Result<String> {
    let target = match target_commit {
      Some(commit_id) => {
        let oid = Oid::from_str(&commit_id)
          .map_err(|e| Error::new(Status::GenericFailure, format!("Invalid commit ID: {}", e)))?;
        self.repo.find_commit(oid)
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find commit: {}", e)))?
      },
      None => {
        let head = self.repo.head()
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get HEAD: {}", e)))?;
        head.peel_to_commit()
          .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get commit: {}", e)))?
      }
    };

    // Get signature from repo config
    let config = self.repo.config()
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get config: {}", e)))?;
    
    let name = config.get_string("user.name")
        .unwrap_or_else(|_| "Unknown".to_string());
    
    let email = config.get_string("user.email")
        .unwrap_or_else(|_| "unknown@example.com".to_string());
    
    let signature = Signature::now(&name, &email)
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create signature: {}", e)))?;

    // Create tag
    if let Some(msg) = message {
      // Create annotated tag
      let tag_oid = self.repo.tag(&tag_name, &target.into_object(), &signature, &msg, false)
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create tag: {}", e)))?;
      
      Ok(tag_oid.to_string())
    } else {
      // Create lightweight tag
      let ref_name = format!("refs/tags/{}", tag_name);
      let ref_oid = self.repo.reference(&ref_name, target.id(), false, "")
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create reference: {}", e)))?;
      
      Ok(ref_oid.target().unwrap().to_string())
    }
  }

  #[napi]
  pub fn delete_tag(&self, tag_name: String) -> Result<()> {
    self.repo.tag_delete(&tag_name)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to delete tag: {}", e)))?;
    
    Ok(())
  }

  #[napi]
  pub fn checkout_tag(&self, tag_name: String) -> Result<()> {
    let obj = self.repo.revparse_single(&format!("refs/tags/{}", tag_name))
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find tag: {}", e)))?;
    
    let commit = obj.peel_to_commit()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to peel to commit: {}", e)))?;
    
    let commit_id = commit.id(); // Запоминаем id до того как commit будет перемещён
    
    // Checkout tree
    self.repo.checkout_tree(&commit.into_object(), None)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to checkout tree: {}", e)))?;
    
    // Move HEAD to detached state
    self.repo.set_head_detached(commit_id)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to set HEAD: {}", e)))?;
    
    Ok(())
  }

  #[napi]
  pub fn checkout_commit(&self, commit_hash: String) -> Result<()> {
    let oid = Oid::from_str(&commit_hash)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Invalid commit ID: {}", e)))?;
    
    let commit = self.repo.find_commit(oid)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to find commit: {}", e)))?;
    
    // Checkout tree
    self.repo.checkout_tree(&commit.into_object(), None)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to checkout tree: {}", e)))?;
    
    // Move HEAD to detached state (используем oid, т.к. commit уже перемещён)
    self.repo.set_head_detached(oid)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to set HEAD: {}", e)))?;
    
    Ok(())
  }
  
  // Helper method to get diff for a commit
  fn get_commit_diff(&self, commit: &git2::Commit) -> Result<git2::Diff> {
    let commit_tree = commit.tree()
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get commit tree: {}", e)))?;
    
    let parent_tree = if commit.parent_count() > 0 {
      let parent = commit.parent(0)
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get parent: {}", e)))?;
      
      parent.tree()
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to get parent tree: {}", e)))?
    } else {
      // For first commit with no parent, create an empty tree
      self.repo.find_tree(Oid::from_str("4b825dc642cb6eb9a060e54bf8d69288fbee4904").unwrap())
        .unwrap_or_else(|_| {
          // If the empty tree doesn't exist, create it
          let empty_tree_id = self.repo.treebuilder(None)
            .and_then(|b| b.write())
            .unwrap_or_else(|_| Oid::zero());
          
          self.repo.find_tree(empty_tree_id).unwrap()
        })
    };
    
    self.repo.diff_tree_to_tree(Some(&parent_tree), Some(&commit_tree), None)
      .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to diff trees: {}", e)))
  }
}

#[napi]
pub fn clone_repository(url: String, path: String) -> Result<GitRepo> {
  match Repository::clone(&url, Path::new(&path)) {
    Ok(repo) => Ok(GitRepo { repo }),
    Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to clone repository: {}", e))),
  }
}

#[napi]
pub fn init_repository(path: String) -> Result<GitRepo> {
  match Repository::init(Path::new(&path)) {
    Ok(repo) => Ok(GitRepo { repo }),
    Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to initialize repository: {}", e))),
  }
}

#[napi]
pub fn find_repository(start_path: String) -> Result<GitRepo> {
  // Начинаем с указанного пути и ищем .git вверх по дереву каталогов
  let mut current_path = Path::new(&start_path).to_path_buf();
  
  loop {
    // Проверяем наличие .git в текущем каталоге
    let git_dir = current_path.join(".git");
    if git_dir.exists() && git_dir.is_dir() {
      // Нашли .git, открываем репозиторий
      match Repository::open(&current_path) {
        Ok(repo) => return Ok(GitRepo { repo }),
        Err(e) => return Err(Error::new(Status::GenericFailure, format!("Found .git directory but failed to open repository: {}", e))),
      }
    }
    
    // Поднимаемся на уровень выше
    if !current_path.pop() {
      // Дошли до корня файловой системы и не нашли .git
      return Err(Error::new(Status::GenericFailure, format!("Could not find a git repository in '{}' or any parent directory", start_path)));
    }
  }
}

#[napi]
pub fn is_git_repository(path: String) -> bool {
  match Repository::open(path) {
    Ok(_) => true,
    Err(_) => false,
  }
}

#[napi]
pub fn get_branch_name(path: String) -> Result<String> {
  match Repository::open(path) {
    Ok(repo) => {
      match repo.head() {
        Ok(head) => {
          if head.is_branch() {
            let branch_name = head.shorthand()
              .ok_or_else(|| Error::new(Status::GenericFailure, "Failed to get branch name".to_string()))?;
            Ok(branch_name.to_string())
          } else {
            Err(Error::new(Status::GenericFailure, "HEAD is not a branch".to_string()))
          }
        },
        Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to get HEAD: {}", e))),
      }
    },
    Err(e) => Err(Error::new(Status::GenericFailure, format!("Failed to open repository: {}", e))),
  }
}
