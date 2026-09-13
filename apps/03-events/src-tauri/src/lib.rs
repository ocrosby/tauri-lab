use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Listener, Manager, State};

// Shared cancel flag. AtomicBool is Sync without wrapping in a Mutex.
struct Cancel(Arc<AtomicBool>);

#[tauri::command]
async fn start_download(app: AppHandle, state: State<'_, Cancel>) -> Result<(), String> {
    let flag = state.0.clone();
    flag.store(false, Ordering::Relaxed);

    // Spawn on Tauri's async runtime so the command returns immediately.
    tauri::async_runtime::spawn(async move {
        for i in 0..=100u8 {
            if flag.load(Ordering::Relaxed) {
                let _ = app.emit("download-cancelled", ());
                return;
            }
            let _ = app.emit("download-progress", i);
            tokio::time::sleep(Duration::from_millis(20)).await;
        }
        let _ = app.emit("download-done", ());
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cancel = Cancel(Arc::new(AtomicBool::new(false)));
    let cancel_flag = cancel.0.clone();

    tauri::Builder::default()
        .manage(cancel)
        .invoke_handler(tauri::generate_handler![start_download])
        .setup(move |app| {
            // Listen for the JS-emitted cancel event.
            let flag = cancel_flag.clone();
            app.listen("cancel-download", move |_event| {
                flag.store(true, Ordering::Relaxed);
            });

            // Background clock: emit `tick` every second forever.
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_secs(1));
                loop {
                    interval.tick().await;
                    let ts = chrono::Local::now().format("%H:%M:%S").to_string();
                    let _ = handle.emit("tick", ts);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
