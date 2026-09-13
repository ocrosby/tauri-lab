const { invoke } = window.__TAURI__.core;

const counter = document.getElementById("counter");

document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const action = btn.dataset.action;
    const value = await invoke(
      action === "inc" ? "increment" : action === "dec" ? "decrement" : "reset",
    );
    counter.textContent = value;
  });
});

// Fetch the initial value on load so a reload preserves the display.
invoke("current").then((v) => (counter.textContent = v));

// --- calculator ---

const dividendEl = document.getElementById("dividend");
const divisorEl = document.getElementById("divisor");
const quotientEl = document.getElementById("quotient");

document.getElementById("divide").addEventListener("click", async () => {
  try {
    const quotient = await invoke("divide", {
      dividend: Number(dividendEl.value),
      divisor: Number(divisorEl.value),
    });
    quotientEl.textContent = quotient;
    quotientEl.className = "";
  } catch (err) {
    quotientEl.textContent = err;
    quotientEl.className = "error";
  }
});

// --- slow greet ---

const slowBtn = document.getElementById("slow");
const slowResult = document.getElementById("slow-result");

slowBtn.addEventListener("click", async () => {
  slowBtn.disabled = true;
  slowResult.textContent = "waiting…";
  slowResult.textContent = await invoke("slow_greet", { name: "Alice" });
  slowBtn.disabled = false;
});
