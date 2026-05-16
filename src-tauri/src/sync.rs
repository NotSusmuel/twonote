use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncStatus {
    pub is_syncing: bool,
    pub last_sync_at: Option<String>,
    pub error: Option<String>,
}

pub struct SyncWorker {
    // TODO: Add Graph client and database pool
}

impl SyncWorker {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn run_sync(&self) -> Result<(), String> {
        println!("Starting sync...");
        // TODO: Implement OAuth check
        // TODO: Implement pull logic
        // TODO: Implement push logic
        Ok(())
    }
}
