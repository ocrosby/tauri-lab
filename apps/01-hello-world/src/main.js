const { invoke } = window.__TAURI__.core;

const button = document.getElementById("greet");
const message = document.getElementById("message");

button.addEventListener("click", async () => {
  const reply = await invoke("greet");
  message.textContent = reply;
});
