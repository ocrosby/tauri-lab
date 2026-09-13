use tauri::{AppHandle, Emitter, LogicalPosition, Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn open_child(app: AppHandle) -> Result<(), String> {
    // If it already exists, focus it instead of creating a duplicate.
    if let Some(existing) = app.get_webview_window("child") {
        return existing.set_focus().map_err(|e| e.to_string());
    }

    WebviewWindowBuilder::new(&app, "child", WebviewUrl::App("child.html".into()))
        .title("Child window")
        .inner_size(400.0, 300.0)
        .position(120.0, 120.0)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn close_child(app: AppHandle) -> Result<(), String> {
    if let Some(child) = app.get_webview_window("child") {
        child.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn ping_child(app: AppHandle, message: String) -> Result<(), String> {
    app.emit_to("child", "ping-from-parent", message)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn move_top_left(app: AppHandle) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("main window missing")?;
    main.set_position(LogicalPosition::new(0.0, 0.0))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn center_window(app: AppHandle) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("main window missing")?;
    main.center().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_child,
            close_child,
            ping_child,
            move_top_left,
            center_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
