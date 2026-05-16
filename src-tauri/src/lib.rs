mod sync;
use tauri::State;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn trigger_sync(worker: State<'_, sync::SyncWorker>) -> Result<(), String> {
    worker.run_sync(vec![]).await.map(|_| ())
}

#[tauri::command]
async fn sync_notebooks(
    worker: State<'_, sync::SyncWorker>,
    notebooks: Vec<sync::NotebookData>,
) -> Result<sync::SyncPayload, String> {
    worker.run_sync(notebooks).await
}

#[tauri::command]
fn get_sync_status(worker: State<'_, sync::SyncWorker>) -> Result<sync::SyncStatus, String> {
    worker.status()
}

#[tauri::command]
async fn connect_onenote_account(
    worker: State<'_, sync::SyncWorker>,
    access_token: String,
) -> Result<sync::SyncPayload, String> {
    worker.import_from_onenote(access_token).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(sync::SyncWorker::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_stronghold::Builder::new(|_password| {
            // TODO: Implementation of master password derivation
            // For now, we return a dummy key to avoid panic in prototype
            vec![0u8; 32]
        }).build())
        .invoke_handler(tauri::generate_handler![
            greet,
            trigger_sync,
            sync_notebooks,
            get_sync_status,
            connect_onenote_account
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
