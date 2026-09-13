const { fetch } = window.__TAURI__.http;

const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const weatherEl = document.getElementById("weather");

document.getElementById("fetch-quote").addEventListener("click", async () => {
  quoteEl.textContent = "…";
  authorEl.textContent = "";
  try {
    const res = await fetch("https://api.quotable.io/random");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    quoteEl.textContent = `"${data.content}"`;
    authorEl.textContent = `— ${data.author}`;
  } catch (err) {
    quoteEl.textContent = `error: ${err}`;
  }
});

document.getElementById("fetch-weather").addEventListener("click", async () => {
  weatherEl.textContent = "…";
  try {
    const res = await fetch("https://wttr.in/?format=3");
    weatherEl.textContent = await res.text();
  } catch (err) {
    weatherEl.textContent = `blocked (as expected):\n${err}`;
  }
});
