# 02 — ipc-commands

**Teaches**: Tauri's IPC command surface — sync commands, async commands, arguments, `Result` returns, and managed state.

## What it does

A small counter and calculator UI:

- **Counter** — increment / decrement / reset a value stored in Rust-owned state. Persists across button clicks because Rust holds the `Mutex<i64>`.
- **Calculator** — divide two numbers via an async command. Returns `Result<f64, String>`; dividing by zero shows the error in the UI.
- **Slow greet** — an async command that sleeps a second before returning, to show that async commands don't block the UI.

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src-tauri/src/lib.rs`** — every concept in one file:
   - `Counter` struct wrapping a `Mutex<i64>` — the managed state
   - `.manage(Counter(...))` in the builder — registers it
   - `tauri::State<'_, Counter>` parameter — how a command borrows the state
   - `async fn slow_greet(...)` — async command
   - `Result<f64, String>` — error propagation
2. **`src/main.js`** — matching JS calls. Note that arguments are passed as an object keyed by parameter name in **camelCase** — see the `divide({ dividend, divisor })` call.

## Key patterns

### Managed state

```rust
struct Counter(std::sync::Mutex<i64>);

tauri::Builder::default()
    .manage(Counter(std::sync::Mutex::new(0)))
    // ...
```

Any command can borrow it:

```rust
#[tauri::command]
fn increment(state: tauri::State<Counter>) -> i64 {
    let mut n = state.0.lock().unwrap();
    *n += 1;
    *n
}
```

### Errors that reach JS

```rust
#[tauri::command]
async fn divide(dividend: f64, divisor: f64) -> Result<f64, String> {
    if divisor == 0.0 {
        Err("division by zero".into())
    } else {
        Ok(dividend / divisor)
    }
}
```

```js
try {
  const quotient = await invoke("divide", { dividend: 10, divisor: 0 });
} catch (err) {
  console.error(err); // "division by zero"
}
```

## Try changing

- Swap `std::sync::Mutex` for `tokio::sync::Mutex` and hold the lock across a `.await` inside an async command. You'll need to add `tokio` as a dep and possibly `.await` the lock.
- Replace `Counter(Mutex<i64>)` with a `Counter { value: Mutex<i64>, log: Mutex<Vec<String>> }` — see how a single `.manage()` call can hold richer state.
- Make `divide` return a custom error type using `thiserror` + `#[derive(serde::Serialize)]`.
