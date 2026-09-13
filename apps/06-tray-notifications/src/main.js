const {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} = window.__TAURI__.notification;

const statusEl = document.getElementById("status");

document.getElementById("notify").addEventListener("click", async () => {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const result = await requestPermission();
      granted = result === "granted";
    }
    if (!granted) {
      statusEl.textContent = "permission denied";
      return;
    }
    sendNotification({
      title: "tauri-lab",
      body: `Hello at ${new Date().toLocaleTimeString()}`,
    });
    statusEl.textContent = "notification sent";
  } catch (err) {
    statusEl.textContent = `error: ${err}`;
  }
});
