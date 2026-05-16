mod sync;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn trigger_sync() -> Result<(), String> {
    let worker = sync::SyncWorker::new();
    worker.run_sync().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_stronghold::Builder::new(|_password| {
            // TODO: Implementation of master password derivation
            // For now, we return a dummy key to avoid panic in prototype
            vec![0u8; 32]
        }).build())
        .invoke_handler(tauri::generate_handler![greet, trigger_sync])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
