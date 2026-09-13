// This demo has no Rust-side commands — Three.js runs entirely in the webview.
// The Tauri shell just hosts the canvas as a native window.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
