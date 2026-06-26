const defaultEndpoint = "http://localhost:3000";
const api = browser;
const tabs = document.querySelectorAll("[data-tab]");
const panes = document.querySelectorAll("[data-pane]");
const form = document.querySelector("#searchForm");
const endpointInput = document.querySelector("#endpoint");
const queryInput = document.querySelector("#query");
const statusText = document.querySelector("#status");
const resultsBox = document.querySelector("#results");
const openFull = document.querySelector("#openFull");
const timerFace = document.querySelector("#timerFace");
const qrForm = document.querySelector("#qrForm");
const qrText = document.querySelector("#qrText");
const qrImage = document.querySelector("#qrImage");
const notes = document.querySelector("#notes");
const copyNote = document.querySelector("#copyNote");
const speedRun = document.querySelector("#speedRun");
const speedLog = document.querySelector("#speedLog");
let timerSeconds = 300;
let timerHandle = null;

function cleanEndpoint(value) {
  return (value || defaultEndpoint).replace(/\/+$/, "");
}

function setStatus(message) {
  statusText.textContent = message;
}

function showTab(name) {
  tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === name));
  panes.forEach((pane) => pane.classList.toggle("is-active", pane.dataset.pane === name));
}

function formatTimer() {
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");
  timerFace.textContent = `${minutes}:${seconds}`;
}

function tickTimer() {
  timerSeconds = Math.max(0, timerSeconds - 1);
  formatTimer();
  if (timerSeconds === 0) {
    clearInterval(timerHandle);
    timerHandle = null;
    timerFace.textContent = "DONE";
  }
}

function resultTemplate(item) {
  const article = document.createElement("article");
  article.className = "result";
  const link = document.createElement("a");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = item.title || item.url;
  const url = document.createElement("p");
  url.className = "url";
  url.textContent = item.type || item.url;
  const snippet = document.createElement("p");
  snippet.className = "snippet";
  snippet.textContent = item.description || "";
  article.append(link, url, snippet);
  return article;
}

async function loadSettings() {
  const saved = await api.storage.local.get(["oldoodleWidgetEndpoint", "oldoodleWidgetQuery", "oldoodleWidgetNote", "oldoodleWidgetQr"]);
  endpointInput.value = saved.oldoodleWidgetEndpoint || defaultEndpoint;
  queryInput.value = saved.oldoodleWidgetQuery || "";
  notes.value = saved.oldoodleWidgetNote || "";
  qrText.value = saved.oldoodleWidgetQr || "https://Aki2457.github.io/oldoodle/";
  makeQr();
}

async function saveSettings() {
  await api.storage.local.set({
    oldoodleWidgetEndpoint: cleanEndpoint(endpointInput.value),
    oldoodleWidgetQuery: queryInput.value.trim(),
    oldoodleWidgetNote: notes.value,
    oldoodleWidgetQr: qrText.value
  });
}

async function search() {
  const endpoint = cleanEndpoint(endpointInput.value);
  const query = queryInput.value.trim() || "windows xp internet explorer";
  const url = new URL("/api/search.json", endpoint);
  url.searchParams.set("q", query);
  setStatus("Searching...");
  resultsBox.innerHTML = "";
  await saveSettings();
  const started = performance.now();
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || !Array.isArray(data.items)) throw new Error(data.error || `HTTP ${response.status}`);
  setStatus(`${data.count} ${data.provider || "search"} results in ${Math.round(performance.now() - started)} ms`);
  data.items.forEach((item) => resultsBox.append(resultTemplate(item)));
}

function makeQr() {
  const value = qrText.value.trim() || "https://Aki2457.github.io/oldoodle/";
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(value)}`;
}

tabs.forEach((button) => button.addEventListener("click", () => showTab(button.dataset.tab)));
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try { await search(); } catch (error) { setStatus(`Error: ${error.message}`); }
});
openFull.addEventListener("click", () => api.tabs.create({ url: api.runtime.getURL("index.html") }));
document.querySelectorAll("[data-minutes]").forEach((button) => {
  button.addEventListener("click", () => {
    timerSeconds = Number(button.dataset.minutes) * 60;
    formatTimer();
  });
});
document.querySelector("#timerStart").addEventListener("click", () => {
  if (!timerHandle) timerHandle = setInterval(tickTimer, 1000);
});
document.querySelector("#timerPause").addEventListener("click", () => {
  clearInterval(timerHandle);
  timerHandle = null;
});
document.querySelector("#timerReset").addEventListener("click", () => {
  clearInterval(timerHandle);
  timerHandle = null;
  timerSeconds = 300;
  formatTimer();
});
qrForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  makeQr();
  await saveSettings();
});
notes.addEventListener("input", saveSettings);
copyNote.addEventListener("click", async () => navigator.clipboard.writeText(notes.value));
speedRun.addEventListener("click", async () => {
  const item = document.createElement("li");
  item.textContent = "Pinging...";
  speedLog.prepend(item);
  const started = performance.now();
  try {
    const response = await fetch(`${cleanEndpoint(endpointInput.value)}/api/health`);
    item.textContent = `${response.ok ? "OK" : "HTTP " + response.status} in ${Math.round(performance.now() - started)} ms`;
  } catch (error) {
    item.textContent = `Failed: ${error.message}`;
  }
});
loadSettings();
formatTimer();
