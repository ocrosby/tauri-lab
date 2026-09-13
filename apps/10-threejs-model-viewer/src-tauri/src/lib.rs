// Plugins do all the work — the frontend calls dialog::open and fs::readFile,
// then feeds the bytes to Three.js's GLTFLoader.parseAsync.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
