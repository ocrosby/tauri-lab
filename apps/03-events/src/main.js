const { invoke } = window.__TAURI__.core;
const { listen, emit } = window.__TAURI__.event;

const barFill = document.getElementById("bar-fill");
const pct = document.getElementById("pct");
const startBtn = document.getElementById("start");
const cancelBtn = document.getElementById("cancel");
const statusEl = document.getElementById("status");

// Rust emits `download-progress` events between 0 and 100.
await listen("download-progress", (event) => {
  const n = event.payload;
  barFill.style.width = `${n}%`;
  pct.textContent = n;
});

// Emitted once when the download finishes normally.
await listen("download-done", () => {
  statusEl.textContent = "done";
  startBtn.disabled = false;
  cancelBtn.disabled = true;
});

// Emitted if the user cancels.
await listen("download-cancelled", () => {
  statusEl.textContent = "cancelled";
  startBtn.disabled = false;
  cancelBtn.disabled = true;
});

startBtn.addEventListener("click", async () => {
  barFill.style.width = "0%";
  pct.textContent = "0";
  statusEl.textContent = "downloading…";
  startBtn.disabled = true;
  cancelBtn.disabled = false;
  await invoke("start_download");
});

cancelBtn.addEventListener("click", async () => {
  await emit("cancel-download", null);
});

// --- background clock ---

const ticksEl = document.getElementById("ticks");
const latestTickEl = document.getElementById("latest-tick");
let count = 0;

await listen("tick", (event) => {
  count += 1;
  ticksEl.textContent = count;
  latestTickEl.textContent = event.payload; // ISO timestamp
});
