const form = document.querySelector("#searchForm");
const input = document.querySelector("#query");
const statusBox = document.querySelector("#status");
const resultsBox = document.querySelector("#results");
const lucky = document.querySelector("#lucky");
const pet = document.querySelector("#codexPet");
const petSprite = document.querySelector("#petSprite");
const petFace = document.querySelector("#petFace");
const petBubble = document.querySelector("#petBubble");
const petToggle = document.querySelector("#petToggle");
const petMoodLabel = document.querySelector("#petMoodLabel");
const petEnergy = document.querySelector("#petEnergy");
const petFocus = document.querySelector("#petFocus");
const petBond = document.querySelector("#petBond");
const browserStatusText = document.querySelector("#browserStatusText");
const startButton = document.querySelector("#startButton");
const startMenu = document.querySelector("#startMenu");
const doodleBadge = document.querySelector("#doodleBadge");
const doodleButtons = document.querySelectorAll("[data-doodle]");
const apiKeyButton = document.querySelector("#apiKeyButton");
const clearApiKeyButton = document.querySelector("#clearApiKeyButton");
const apiKeyStatus = document.querySelector("#apiKeyStatus");
const apiKeyDialog = document.querySelector("#apiKeyDialog");
const apiKeyInput = document.querySelector("#apiKeyInput");
const apiKeySave = document.querySelector("#apiKeySave");

let activeEvents;
let petTimer;
if (localStorage.getItem("oldooleActualPetApplied") !== "true") {
  localStorage.setItem("oldoolePetEnabled", "true");
  localStorage.setItem("oldooleActualPetApplied", "true");
}
let petEnabled = localStorage.getItem("oldoolePetEnabled") !== "false";
let petState = loadPetState();
let currentDoodle = localStorage.getItem("oldoodleDoodle") || autoDoodle();
let apifyApiKey = localStorage.getItem("oldoodleApifyApiKey") || "";
const apiBase = ["chrome-extension:", "moz-extension:", "file:"].includes(location.protocol)
  ? "http://localhost:3000"
  : "";

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function loadPetState() {
  const fallback = {
    energy: 72,
    focus: 64,
    bond: 58,
    mood: "idle",
    lastSeen: Date.now()
  };

  try {
    const saved = JSON.parse(localStorage.getItem("oldoolePetState") || "null");
    if (!saved) return fallback;
    const hoursAway = Math.min(18, Math.max(0, (Date.now() - (saved.lastSeen || Date.now())) / 3600000));
    return {
      energy: clamp((saved.energy ?? fallback.energy) - hoursAway * 2),
      focus: clamp((saved.focus ?? fallback.focus) - hoursAway),
      bond: clamp((saved.bond ?? fallback.bond) + hoursAway * .5),
      mood: saved.mood || fallback.mood,
      lastSeen: Date.now()
    };
  } catch {
    return fallback;
  }
}

function savePetState() {
  localStorage.setItem("oldoolePetState", JSON.stringify({
    ...petState,
    lastSeen: Date.now()
  }));
}

function updatePetPanel(mood = petState.mood) {
  petState.mood = mood;
  if (pet) pet.dataset.mood = mood;
  if (petMoodLabel) petMoodLabel.textContent = mood;
  if (petEnergy) {
    petEnergy.value = Math.round(petState.energy);
    petEnergy.setAttribute("value", String(Math.round(petState.energy)));
  }
  if (petFocus) {
    petFocus.value = Math.round(petState.focus);
    petFocus.setAttribute("value", String(Math.round(petState.focus)));
  }
  if (petBond) {
    petBond.value = Math.round(petState.bond);
    petBond.setAttribute("value", String(Math.round(petState.bond)));
  }
  savePetState();
}

function nudgePet(delta) {
  petState.energy = clamp(petState.energy + (delta.energy || 0));
  petState.focus = clamp(petState.focus + (delta.focus || 0));
  petState.bond = clamp(petState.bond + (delta.bond || 0));
  updatePetPanel(delta.mood || petState.mood);
}

function applyPetEnabled() {
  pet?.classList.toggle("is-hidden", !petEnabled);
  if (petToggle) {
    petToggle.textContent = petEnabled ? "404 Pet: on" : "404 Pet: off";
    petToggle.setAttribute("aria-pressed", String(petEnabled));
  }
}

function setPet(mood, face, message, hold = 2400) {
  if (!pet || !petEnabled) return;

  window.clearTimeout(petTimer);
  pet.dataset.mood = mood;
  pet.classList.add("is-speaking");
  petFace.textContent = face;
  petBubble.textContent = message;
  updatePetPanel(mood);

  petTimer = window.setTimeout(() => {
    pet.classList.remove("is-speaking");
    if (mood !== "searching") {
      pet.dataset.mood = "idle";
      petFace.textContent = "404";
      updatePetPanel("idle");
    }
  }, hold);
}

function setStatus(message) {
  statusBox.textContent = message || "";
  if (browserStatusText) browserStatusText.textContent = message || "Done";
}

function updateApiKeyStatus() {
  if (!apiKeyStatus) return;
  apiKeyStatus.textContent = apifyApiKey ? "Using Apify API key" : "Using default search";
  apiKeyStatus.classList.toggle("has-key", Boolean(apifyApiKey));
}

function openApiKeyDialog() {
  if (!apiKeyDialog || !apiKeyInput) return;
  apiKeyInput.value = apifyApiKey;
  if (typeof apiKeyDialog.showModal === "function") {
    apiKeyDialog.showModal();
  } else {
    const value = window.prompt("Apify API key", apifyApiKey);
    if (value !== null) saveApiKey(value);
  }
}

function saveApiKey(value) {
  apifyApiKey = String(value || "").trim();
  if (apifyApiKey) {
    localStorage.setItem("oldoodleApifyApiKey", apifyApiKey);
    localStorage.setItem("oldoodleApifyPromptSeen", "true");
    setStatus("Apify API key saved.");
    setPet("happy", "KEY", "apify enabled");
  } else {
    localStorage.removeItem("oldoodleApifyApiKey");
    setStatus("Apify API key cleared.");
    setPet("idle", "404", "default search");
  }
  updateApiKeyStatus();
}

function autoDoodle() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 4 && day === 1) return "april-fools";
  if (month === 9 && day === 27) return "birthday";
  if (month === 12 || month === 1) return "winter";
  return "classic";
}

function doodleLabel(doodle) {
  return {
    "classic": "Classic",
    "april-fools": "April Fools",
    "birthday": "Birthday",
    "winter": "Winter"
  }[doodle] || "Classic";
}

function setDoodle(doodle, persist = true) {
  const available = ["classic", "april-fools", "birthday", "winter"];
  const next = doodle === "random"
    ? available[Math.floor(Math.random() * available.length)]
    : doodle;

  currentDoodle = available.includes(next) ? next : "classic";
  document.body.dataset.doodle = currentDoodle;
  if (doodleBadge) doodleBadge.textContent = `${doodleLabel(currentDoodle)} Doodle`;
  doodleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.doodle === currentDoodle);
  });
  if (persist) localStorage.setItem("oldoodleDoodle", currentDoodle);
  setPet("happy", "ART", `${doodleLabel(currentDoodle).toLowerCase()} doodle`);
}

function setStartMenu(open) {
  if (!startMenu || !startButton) return;

  startMenu.classList.toggle("is-open", open);
  startMenu.setAttribute("aria-hidden", String(!open));
  startButton.classList.toggle("is-active", open);
  startButton.setAttribute("aria-expanded", String(open));
}

function closeStartMenu() {
  setStartMenu(false);
}

function renderResults(items) {
  resultsBox.innerHTML = "";

  if (!items.length) {
    resultsBox.innerHTML = '<article class="widget"><p>No results came back from the search engine.</p></article>';
    nudgePet({ energy: -4, focus: -2, bond: 1, mood: "worried" });
    setPet("worried", "???", "no signals found");
    return;
  }

  for (const item of items) {
    const widget = document.createElement("article");
    widget.className = "widget";

    const link = document.createElement("a");
    link.href = item.url || "#";
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = item.title;

    const url = document.createElement("div");
    url.className = "url";
    url.textContent = item.url || item.type;

    const description = document.createElement("p");
    description.textContent = item.description || "No preview text available.";

    widget.append(link, url, description);
    resultsBox.append(widget);
  }
}

function runSearch(query) {
  if (activeEvents) activeEvents.close();
  resultsBox.innerHTML = "";
  setStatus("Starting search...");
  nudgePet({ energy: -3, focus: 4, mood: "searching" });
  setPet("searching", "PING", `scanning "${query}"`, 999999);

  const searchUrl = new URL(`${apiBase}/api/search`, location.href);
  searchUrl.searchParams.set("q", query);
  if (apifyApiKey) searchUrl.searchParams.set("apifyToken", apifyApiKey);

  activeEvents = new EventSource(searchUrl.toString());
  activeEvents.addEventListener("status", (event) => {
    const data = JSON.parse(event.data);
    setStatus(data.message);
    setPet("searching", "PING", data.message.toLowerCase(), 999999);
  });

  activeEvents.addEventListener("results", (event) => {
    const data = JSON.parse(event.data);
    setStatus(`Showing ${data.count} live ${data.provider || "search"} results for "${data.query}"`);
    renderResults(data.items);
    nudgePet({ energy: -2, focus: 8, bond: 2, mood: "happy" });
    setPet("happy", "OK", `${data.count} results cached`);
    if (browserStatusText) browserStatusText.textContent = "Done";
  });

  activeEvents.addEventListener("done", () => {
    activeEvents.close();
    activeEvents = null;
  });

  activeEvents.addEventListener("error", (event) => {
    if (event.data) {
      const data = JSON.parse(event.data);
      setStatus(data.message);
      nudgePet({ energy: -5, focus: -4, bond: 1, mood: "error" });
      setPet("error", "ERR", data.message);
    } else {
      setStatus("The live search connection closed.");
      nudgePet({ energy: -3, focus: -2, mood: "worried" });
      setPet("worried", "LOST", "connection closed");
    }
    activeEvents?.close();
    activeEvents = null;
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) runSearch(query);
});

lucky.addEventListener("click", () => {
  const first = resultsBox.querySelector(".widget a[href]:not([href='#'])");
  if (first) {
    setPet("happy", "GO!", "opening first result");
    window.open(first.href, "_blank", "noreferrer");
    return;
  }

  const query = input.value.trim();
  if (query) {
    runSearch(query);
  } else {
    setPet("worried", "TYPE", "give me a query");
  }
});

function runSampleSearch(query) {
  input.value = query;
  input.focus();
  runSearch(query);
}

function handleStartAction(action) {
  closeStartMenu();

  if (action === "focus-search") {
    input.focus();
    setStatus("Ready");
    setPet("happy", "GO", "type a search");
    return;
  }

  if (action === "lucky") {
    lucky.click();
    return;
  }

  if (action === "sample-xp") {
    runSampleSearch("windows xp internet explorer");
    return;
  }

  if (action === "sample-google") {
    runSampleSearch("old google homepage");
    return;
  }

  if (action === "sample-apify") {
    runSampleSearch("apify web scraping widgets");
    return;
  }

  if (action === "doodle-april") {
    setDoodle("april-fools");
    setStatus("April Fools doodle enabled.");
    return;
  }

  if (action === "doodle-random") {
    setDoodle("random");
    setStatus(`${doodleLabel(currentDoodle)} doodle enabled.`);
    return;
  }

  if (action === "home") {
    input.value = "";
    resultsBox.innerHTML = "";
    setStatus("Done");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPet("idle", "404", "home again");
    return;
  }

  if (action === "clear") {
    input.value = "";
    resultsBox.innerHTML = "";
    setStatus("Recent searches cleared");
    setPet("happy", "OK", "history cleared");
    return;
  }

  if (action === "about") {
    setStatus("Oldoodle XP Search: live Apify widgets in a classic shell.");
    setPet("happy", "?", "help loaded");
    return;
  }

  if (action === "settings") {
    setStatus("Control Panel: homepage and extension settings live in the browser package.");
    setPet("idle", "CFG", "settings noted");
    return;
  }

  if (action === "api-key") {
    openApiKeyDialog();
    return;
  }

  if (action === "logoff") {
    setStatus("Logged off Oldoodle User.");
    setPet("worried", "BYE", "session idle");
    return;
  }

  if (action === "shutdown") {
    setStatus("It is now safe to turn off your nostalgia.");
    setPet("idle", "OFF", "good night");
    return;
  }
}

startButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  setStartMenu(!startMenu?.classList.contains("is-open"));
});

startMenu?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-start-action]");
  if (!button) return;
  handleStartAction(button.dataset.startAction);
});

document.addEventListener("click", (event) => {
  if (!startMenu?.classList.contains("is-open")) return;
  if (startMenu.contains(event.target) || startButton?.contains(event.target)) return;
  closeStartMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeStartMenu();
});

doodleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setDoodle(button.dataset.doodle);
    setStatus(`${doodleLabel(currentDoodle)} doodle enabled.`);
  });
});

apiKeyButton?.addEventListener("click", openApiKeyDialog);

clearApiKeyButton?.addEventListener("click", () => saveApiKey(""));

apiKeyDialog?.addEventListener("close", () => {
  if (apiKeyDialog.returnValue === "save") {
    saveApiKey(apiKeyInput?.value || "");
  }
});

apiKeySave?.addEventListener("click", (event) => {
  event.preventDefault();
  saveApiKey(apiKeyInput?.value || "");
  apiKeyDialog?.close();
});

petSprite?.addEventListener("click", () => {
  const quips = [
    ["idle", "404", "still here", { bond: 1 }],
    ["happy", "BEEP", "old web, new tricks", { bond: 2 }],
    ["worried", "404?", "try searching codex pet", { focus: 1 }],
    ["sleepy", "ZZZ", "keeping watch", { energy: 1 }]
  ];
  const [mood, face, message, delta] = quips[Math.floor(Math.random() * quips.length)];
  nudgePet({ ...delta, mood });
  setPet(mood, face, message);
});

pet?.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-pet-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.petAction;
  if (action === "snack") {
    nudgePet({ energy: 12, bond: 5, focus: -2, mood: "happy" });
    setPet("happy", "YUM", "packet crumbs acquired");
    return;
  }

  if (action === "nap") {
    nudgePet({ energy: 24, focus: 4, mood: "sleepy" });
    setPet("sleepy", "ZZZ", "defrag nap started");
    return;
  }

  if (action === "play") {
    nudgePet({ energy: -9, bond: 12, focus: 2, mood: "happy" });
    setPet("happy", "WHEE", "window chase mode");
    return;
  }

  if (action === "debug") {
    nudgePet({ energy: -8, focus: 16, bond: 3, mood: "focused" });
    setPet("focused", "FIX", "sniffing stack traces");
  }
});

petToggle?.addEventListener("click", () => {
  petEnabled = !petEnabled;
  localStorage.setItem("oldoolePetEnabled", String(petEnabled));
  applyPetEnabled();
  if (petEnabled) setPet("idle", "404", "back online");
});

window.addEventListener("beforeunload", savePetState);

applyPetEnabled();
updatePetPanel();
setDoodle(currentDoodle, false);
updateApiKeyStatus();
if (!apifyApiKey && localStorage.getItem("oldoodleApifyPromptSeen") !== "true") {
  localStorage.setItem("oldoodleApifyPromptSeen", "true");
  window.setTimeout(openApiKeyDialog, 700);
}
