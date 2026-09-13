use notify_debouncer_mini::{new_debouncer, notify::RecursiveMode};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Emitter, Manager};

// Resolved at compile time; points inside the source tree during `cargo tauri dev`.
fn shader_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../src/shader.frag")
}

// Current shader source, refreshed every time the file changes.
struct ShaderSource(Mutex<String>);

#[tauri::command]
fn get_shader(state: tauri::State<ShaderSource>) -> String {
    state.0.lock().unwrap().clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let path = shader_path();
    let initial = std::fs::read_to_string(&path).unwrap_or_else(|_| {
        "precision mediump float;\nvoid main() { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); }\n"
            .to_string()
    });

    tauri::Builder::default()
        .manage(ShaderSource(Mutex::new(initial)))
        .invoke_handler(tauri::generate_handler![get_shader])
        .setup(move |app| {
            let handle = app.handle().clone();
            let watched = path.clone();

            std::thread::spawn(move || {
                let (tx, rx) = std::sync::mpsc::channel();
                let mut debouncer =
                    new_debouncer(Duration::from_millis(150), tx).expect("debouncer");

                // Watch the parent directory so we survive editors that
                // rename-on-save (vim, sed -i, etc.).
                let dir = watched
                    .parent()
                    .expect("shader file has a parent")
                    .to_path_buf();
                debouncer
                    .watcher()
                    .watch(&dir, RecursiveMode::NonRecursive)
                    .expect("watch shader dir");

                for events in rx.into_iter().flatten() {
                    for e in events {
                        if e.path == watched {
                            if let Ok(src) = std::fs::read_to_string(&watched) {
                                if let Some(state) = handle.try_state::<ShaderSource>() {
                                    *state.0.lock().unwrap() = src.clone();
                                }
                                let _ = handle.emit("shader-changed", src);
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
