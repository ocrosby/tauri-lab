use std::sync::Mutex;
use tauri::State;

// Managed state — one instance per type is stored on the App.
// Interior mutability via Mutex because commands may run on any thread.
struct Counter(Mutex<i64>);

#[tauri::command]
fn increment(state: State<Counter>) -> i64 {
    let mut n = state.0.lock().unwrap();
    *n += 1;
    *n
}

#[tauri::command]
fn decrement(state: State<Counter>) -> i64 {
    let mut n = state.0.lock().unwrap();
    *n -= 1;
    *n
}

#[tauri::command]
fn reset(state: State<Counter>) -> i64 {
    let mut n = state.0.lock().unwrap();
    *n = 0;
    *n
}

#[tauri::command]
fn current(state: State<Counter>) -> i64 {
    *state.0.lock().unwrap()
}

// Result<T, E> where E: Serialize propagates as a rejected Promise on the JS side.
#[tauri::command]
async fn divide(dividend: f64, divisor: f64) -> Result<f64, String> {
    if divisor == 0.0 {
        Err("division by zero".into())
    } else {
        Ok(dividend / divisor)
    }
}

// Async commands don't block the main-process event loop while they wait.
#[tauri::command]
async fn slow_greet(name: String) -> String {
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    format!("Hello, {name}! (after a 1s nap)")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Counter(Mutex::new(0)))
        .invoke_handler(tauri::generate_handler![
            increment, decrement, reset, current, divide, slow_greet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
