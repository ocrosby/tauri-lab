# 07 — http-plugin

**Teaches**: making HTTP requests from Rust via `tauri-plugin-http`. Replaces the deprecated v1 `allowlist.http` pattern with a scoped-permission model.

## What it does

- **Fetch quote** — GET request to `https://api.quotable.io/random`, parses JSON, shows the quote and author.
- **Fetch weather (rejected)** — attempts to hit `https://wttr.in/`, which is **not** in the allowed scope; you'll see a permission error. This shows that even the http plugin obeys the scope on every URL.

Both requests are issued **from JS** via the plugin — but the request is dispatched through the Rust process, so it doesn't hit CORS or webview restrictions.

## Run

```bash
cargo tauri dev
```

Requires internet.

## Read the code in this order

1. **`src-tauri/capabilities/default.json`** — note the URL scope. Only hosts matching `https://api.quotable.io/*` are reachable. Everything else fails at the permission layer, before the network call is even attempted.
2. **`src/main.js`** — `window.__TAURI__.http.fetch(url, options)`. Same shape as the browser `fetch()`, minus CORS restrictions.
3. **`src-tauri/src/lib.rs`** — just registers the plugin; no custom commands needed.

## Key patterns

### Registering the plugin

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
```

### Frontend usage

```js
const { fetch } = window.__TAURI__.http;
const res = await fetch("https://api.quotable.io/random");
if (res.ok) {
  const data = await res.json();
  console.log(data.content);
}
```

### Scoping allowed URLs

`capabilities/default.json`:

```json
{
  "permissions": [
    "http:default",
    {
      "identifier": "http:allow-fetch",
      "allow": [{ "url": "https://api.quotable.io/*" }]
    }
  ]
}
```

Wildcards use URL-pattern syntax (`*`, `**`). Requests to any URL not matching an `allow` entry are rejected.

## Rust-side alternative

Instead of calling from JS, you can also issue the request from a Rust command:

```rust
use tauri_plugin_http::reqwest;

#[tauri::command]
async fn fetch_quote() -> Result<String, String> {
    let body = reqwest::get("https://api.quotable.io/random")
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    Ok(body)
}
```

Both paths honor the same scope config.

## Try changing

- Add `https://wttr.in/*` to the allow list and retry the weather button.
- Send a POST request with a JSON body:
  ```js
  await fetch("https://httpbin.org/post", {
    method: "POST",
    body: JSON.stringify({ hello: "world" }),
    headers: { "content-type": "application/json" },
  });
  ```
  (You'll need to add `https://httpbin.org/*` to the scope first.)
- Move the fetch to a Rust command (see the "Rust-side alternative" above) — the frontend can then just `invoke("fetch_quote")` with no direct network access at all.
