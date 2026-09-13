# IPC: commands, events, state

The three primitives you'll use for almost all JS↔Rust communication.

## Commands

**Use when**: JS needs a value from Rust in response to a specific request.

### Simplest form

```rust
// src-tauri/src/lib.rs
#[tauri::command]
fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![add])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```js
// src/main.js
const { invoke } = window.__TAURI__.core;
const sum = await invoke('add', { a: 2, b: 3 });   // 5
```

Argument names on the JS side must match the Rust parameter names. Tauri deserializes them via `serde` automatically.

### Async commands

Mark the function `async`. Everything else is the same.

```rust
#[tauri::command]
async fn slow_add(a: i32, b: i32) -> i32 {
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    a + b
}
```

`invoke()` returns a Promise either way. The async version doesn't block the main-process event loop while it waits.

### Returning errors

Any command can return `Result<T, E>` where `E` is `Serialize`. The JS Promise rejects with the serialized error.

```rust
#[derive(Debug, thiserror::Error, serde::Serialize)]
enum MyError {
    #[error("division by zero")]
    DivByZero,
}

#[tauri::command]
fn divide(a: f64, b: f64) -> Result<f64, MyError> {
    if b == 0.0 { Err(MyError::DivByZero) } else { Ok(a / b) }
}
```

```js
try {
    const q = await invoke('divide', { a: 1, b: 0 });
} catch (err) {
    console.error(err); // "division by zero"
}
```

### Custom argument/return types

Any `serde::Deserialize` type works for arguments; any `serde::Serialize` type works for returns.

```rust
#[derive(serde::Deserialize)]
struct Point { x: f64, y: f64 }

#[derive(serde::Serialize)]
struct Vector { dx: f64, dy: f64 }

#[tauri::command]
fn subtract(a: Point, b: Point) -> Vector {
    Vector { dx: a.x - b.x, dy: a.y - b.y }
}
```

## Managed state

**Use when**: Rust needs to remember something between commands.

Register the state with `.manage()`:

```rust
struct Counter(std::sync::Mutex<i64>);

pub fn run() {
    tauri::Builder::default()
        .manage(Counter(std::sync::Mutex::new(0)))
        .invoke_handler(tauri::generate_handler![increment, current])
        .run(tauri::generate_context!())
        .unwrap();
}
```

Access it inside any command via `tauri::State<T>`:

```rust
#[tauri::command]
fn increment(state: tauri::State<Counter>) -> i64 {
    let mut n = state.0.lock().unwrap();
    *n += 1;
    *n
}

#[tauri::command]
fn current(state: tauri::State<Counter>) -> i64 {
    *state.0.lock().unwrap()
}
```

State is keyed by type — you can `.manage(T)` once per type. If you need multiple state objects, wrap them in a container struct.

**Async caveat**: `std::sync::Mutex` blocks the current thread. For async commands that hold the lock across `.await`, use `tokio::sync::Mutex` instead.

## Events

**Use when**:

- Rust needs to push data to JS (no request)
- Multiple listeners want the same signal
- Long-running operation that reports progress

### Backend → frontend

```rust
use tauri::Emitter;

#[tauri::command]
async fn work(app: tauri::AppHandle) {
    for i in 0..=100 {
        app.emit("progress", i).unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
    app.emit("done", "all finished").unwrap();
}
```

```js
const { listen } = window.__TAURI__.event;

const unlisten = await listen('progress', (event) => {
    document.getElementById('bar').style.width = `${event.payload}%`;
});

// Later:
unlisten();
```

The `event.payload` is whatever the Rust side passed to `.emit()`, deserialized to a JS value.

### Frontend → backend

```js
const { emit } = window.__TAURI__.event;
await emit('user-cancelled', { reason: 'esc-key' });
```

```rust
use tauri::Listener;

app.listen("user-cancelled", |event| {
    let payload = event.payload(); // &str, raw JSON
    println!("cancelled: {payload}");
});
```

### Emit to a specific window

`app.emit()` broadcasts to every window. To target one, use `window.emit()` or `emit_to()`.

```rust
app.emit_to("main", "focus", ()).unwrap();
```

## Choosing between commands and events

| Question | Answer |
|---|---|
| Does JS need a value in response? | Command |
| Does Rust push data on its own schedule? | Event |
| Is there a natural request/response shape? | Command |
| Do multiple listeners care? | Event |
| Is the operation "fire and forget"? | Either works; event is lighter |

## Patterns

### Long-running command with progress

Combine both: run the work asynchronously, emit progress events, return when done.

```rust
#[tauri::command]
async fn download(url: String, app: tauri::AppHandle) -> Result<String, String> {
    for i in 0..=100 {
        app.emit("download-progress", i).map_err(|e| e.to_string())?;
        tokio::time::sleep(std::time::Duration::from_millis(20)).await;
    }
    Ok(format!("saved: {url}"))
}
```

### Cancellation

Emit an event from JS; Rust checks a shared flag between iterations.

```rust
struct Cancel(std::sync::atomic::AtomicBool);

#[tauri::command]
async fn work(state: tauri::State<'_, Cancel>) -> Result<(), String> {
    for _ in 0..100 {
        if state.0.load(std::sync::atomic::Ordering::Relaxed) {
            return Err("cancelled".into());
        }
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
    Ok(())
}
```

See `apps/02-ipc-commands` and `apps/03-events` for runnable versions.
