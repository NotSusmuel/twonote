use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncStatus {
    pub is_syncing: bool,
    pub last_sync_at: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerData {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub title: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageData {
    pub id: String,
    pub title: String,
    pub containers: Vec<ContainerData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionData {
    pub id: String,
    pub name: String,
    pub pages: Vec<PageData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotebookData {
    pub id: String,
    pub name: String,
    pub sections: Vec<SectionData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncPayload {
    pub notebooks: Vec<NotebookData>,
    pub synced_at: String,
}

pub struct SyncWorker {
    status: Mutex<SyncStatus>,
}

impl SyncWorker {
    pub fn new() -> Self {
        Self {
            status: Mutex::new(SyncStatus {
                is_syncing: false,
                last_sync_at: None,
                error: None,
            }),
        }
    }

    pub fn status(&self) -> Result<SyncStatus, String> {
        self.status
            .lock()
            .map(|status| SyncStatus {
                is_syncing: status.is_syncing,
                last_sync_at: status.last_sync_at.clone(),
                error: status.error.clone(),
            })
            .map_err(|_| "Unable to acquire sync status lock".to_string())
    }

    pub async fn run_sync(&self, notebooks: Vec<NotebookData>) -> Result<SyncPayload, String> {
        {
            let mut status = self
                .status
                .lock()
                .map_err(|_| "Unable to acquire sync lock".to_string())?;
            status.is_syncing = true;
            status.error = None;
        }

        let synced_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| "Unable to determine current time".to_string())?
            .as_secs()
            .to_string();

        let normalized_notebooks = notebooks
            .into_iter()
            .map(|notebook| NotebookData {
                id: notebook.id,
                name: notebook.name.trim().to_string(),
                sections: notebook
                    .sections
                    .into_iter()
                    .map(|section| SectionData {
                        id: section.id,
                        name: section.name.trim().to_string(),
                        pages: section
                            .pages
                            .into_iter()
                            .map(|page| PageData {
                                id: page.id,
                                title: page.title.trim().to_string(),
                                containers: page.containers,
                            })
                            .collect(),
                    })
                    .collect(),
            })
            .collect();

        {
            let mut status = self
                .status
                .lock()
                .map_err(|_| "Unable to acquire sync lock".to_string())?;
            status.is_syncing = false;
            status.last_sync_at = Some(synced_at.clone());
            status.error = None;
        }

        Ok(SyncPayload {
            notebooks: normalized_notebooks,
            synced_at,
        })
    }
}
