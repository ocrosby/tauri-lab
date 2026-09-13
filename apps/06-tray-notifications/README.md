# 06 — tray-notifications

**Teaches**: system tray icon + menu, and native OS notifications via `tauri-plugin-notification`.

## What it does

- Puts an icon in the system tray (menu bar on macOS, notification area on Windows, tray on Linux desktops that support it).
- Clicking the tray icon toggles the main window visible/hidden.
- The tray menu has `Show`, `Hide`, `Notify`, and `Quit` items.
- The **Notify** button in the window (and menu item) sends an OS-native notification. On first run, the user is prompted for permission; the JS handles that.
- Closing the main window **hides it** rather than quitting — the app stays alive in the tray.

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src-tauri/src/lib.rs`**:
   - `setup(...)` hook — builds the tray icon and menu, wires click handlers
   - `TrayIconBuilder`, `MenuBuilder`, `MenuItemBuilder` — the tray/menu APIs
   - `on_window_event` — intercepts the close event and hides instead
2. **`src-tauri/capabilities/default.json`** — permissions for the notification plugin
3. **`src/main.js`** — requesting notification permission and sending a notification

## Key patterns

### Tray icon + menu

```rust
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
};

let show = MenuItemBuilder::with_id("show", "Show").build(app)?;
let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
let menu = MenuBuilder::new(app).items(&[&show, &quit]).build()?;

TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .on_menu_event(|app, event| match event.id().as_ref() {
        "show" => { /* show window */ }
        "quit" => { app.exit(0); }
        _ => {}
    })
    .build(app)?;
```

### Hide instead of quit on window close

```rust
tauri::Builder::default()
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            window.hide().unwrap();
            api.prevent_close();
        }
    })
```

### Native notification (frontend)

```js
const {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} = window.__TAURI__.notification;

if (!(await isPermissionGranted())) {
  await requestPermission();
}
sendNotification({ title: "hello", body: "from Tauri" });
```

## Try changing

- Add a menu item with a keyboard accelerator (`.accelerator("Cmd+K")`).
- Send a notification from **Rust** using the plugin's Rust API instead of JS — `app.notification().builder().title("...").body("...").show()`.
- Make the tray icon reflect app state — swap the icon via `tray.set_icon(...)` when a background task completes.
