const { invoke } = window.__TAURI__.core;
const { getCurrentWindow } = window.__TAURI__.window;

const win = getCurrentWindow();

// --- custom titlebar ---
document.getElementById("min").addEventListener("click", () => win.minimize());
document.getElementById("max").addEventListener("click", async () => {
  const maximized = await win.isMaximized();
  if (maximized) win.unmaximize();
  else win.maximize();
});
document.getElementById("close").addEventListener("click", () => win.close());

// --- child window ---
document
  .getElementById("open-child")
  .addEventListener("click", () => invoke("open_child"));
document
  .getElementById("close-child")
  .addEventListener("click", () => invoke("close_child"));
document
  .getElementById("ping-child")
  .addEventListener("click", () => invoke("ping_child", { message: "hello!" }));

// --- move main window ---
document
  .getElementById("move-top-left")
  .addEventListener("click", () => invoke("move_top_left"));
document
  .getElementById("center")
  .addEventListener("click", () => invoke("center_window"));
