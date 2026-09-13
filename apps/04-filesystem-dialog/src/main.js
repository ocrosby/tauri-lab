const { open, save } = window.__TAURI__.dialog;
const { readTextFile, writeTextFile, BaseDirectory } = window.__TAURI__.fs;

const editor = document.getElementById("editor");
const statusEl = document.getElementById("status");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

document.getElementById("open").addEventListener("click", async () => {
  try {
    const path = await open({
      multiple: false,
      filters: [{ name: "Text", extensions: ["txt", "md", "log"] }],
    });
    if (!path) {
      setStatus("open cancelled");
      return;
    }
    editor.value = await readTextFile(path);
    setStatus(`opened ${path}`);
  } catch (err) {
    setStatus(`open failed: ${err}`, true);
  }
});

document.getElementById("save").addEventListener("click", async () => {
  try {
    const path = await save({
      filters: [{ name: "Text", extensions: ["txt"] }],
      defaultPath: "scratch.txt",
    });
    if (!path) {
      setStatus("save cancelled");
      return;
    }
    await writeTextFile(path, editor.value);
    setStatus(`saved to ${path}`);
  } catch (err) {
    setStatus(`save failed: ${err}`, true);
  }
});

document.getElementById("save-appdata").addEventListener("click", async () => {
  try {
    await writeTextFile("scratch.txt", editor.value, {
      baseDir: BaseDirectory.AppData,
    });
    setStatus("saved to $APPDATA/scratch.txt (no dialog — scope allowed it)");
  } catch (err) {
    setStatus(`app-data save failed: ${err}`, true);
  }
});

document.getElementById("load-appdata").addEventListener("click", async () => {
  try {
    editor.value = await readTextFile("scratch.txt", {
      baseDir: BaseDirectory.AppData,
    });
    setStatus("loaded from $APPDATA/scratch.txt");
  } catch (err) {
    setStatus(`app-data load failed: ${err}`, true);
  }
});
