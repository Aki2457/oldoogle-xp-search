const form = document.querySelector("#searchForm");
const input = document.querySelector("#query");
const statusBox = document.querySelector("#status");
const searchProgress = document.querySelector("#searchProgress");
const searchProgressFill = document.querySelector("#searchProgressFill");
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
const startSearchForm = document.querySelector("#startSearchForm");
const startSearchInput = document.querySelector("#startSearchInput");
const startSearchEmpty = document.querySelector("#startSearchEmpty");
const doodleBadge = document.querySelector("#doodleBadge");
const doodleButtons = document.querySelectorAll("[data-doodle]");
const apiKeyButton = document.querySelector("#apiKeyButton");
const clearApiKeyButton = document.querySelector("#clearApiKeyButton");
const apiKeyStatus = document.querySelector("#apiKeyStatus");
const apiKeyDialog = document.querySelector("#apiKeyDialog");
const apiKeyInput = document.querySelector("#apiKeyInput");
const apiKeySave = document.querySelector("#apiKeySave");
const searchProviderSelect = document.querySelector("#searchProviderSelect");
const searchEndpointSelect = document.querySelector("#searchEndpointSelect");
const searchEndpointInput = document.querySelector("#searchEndpointInput");
const customEndpointRow = document.querySelector("#customEndpointRow");
const apiManagerStatus = document.querySelector("#apiManagerStatus");
const apiManagerTest = document.querySelector("#apiManagerTest");
const gameLibrary = document.querySelector("#gameLibrary");
const gameStage = document.querySelector("#gameStage");
const closeGames = document.querySelector("#closeGames");
const gameButtons = document.querySelectorAll("[data-game]");

let activeEvents;
let petTimer;
let gameTimer;
let dinoTimer;
if (localStorage.getItem("oldooleActualPetApplied") !== "true") {
  localStorage.setItem("oldoolePetEnabled", "true");
  localStorage.setItem("oldooleActualPetApplied", "true");
}
let petEnabled = localStorage.getItem("oldoolePetEnabled") !== "false";
let petState = loadPetState();
let currentDoodle = localStorage.getItem("oldoodleDoodle") || autoDoodle();
let apifyApiKey = localStorage.getItem("oldoodleApifyApiKey") || "";
let searchProviderSetting = localStorage.getItem("oldoodleSearchProvider") || "duckduckgo";
let searchEndpointMode = localStorage.getItem("oldoodleSearchEndpointMode") || "auto";
let customSearchEndpoint = localStorage.getItem("oldoodleSearchEndpoint") || "";
const deployedApiBase = normalizeEndpoint(window.OLDOODLE_API_BASE || "");
const apiBase = deployedApiBase || (["chrome-extension:", "moz-extension:", "file:"].includes(location.protocol)
  ? "http://localhost:3000"
  : "");

function setSearchProgress(state, value = 0) {
  if (!searchProgress || !searchProgressFill) return;

  const active = state && state !== "idle";
  searchProgress.className = `search-progress${active ? " is-active" : ""}${state ? ` is-${state}` : ""}`;
  searchProgress.setAttribute("aria-hidden", String(!active));
  searchProgressFill.style.width = `${clamp(value)}%`;
}

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
  const providerLabel = searchProviderSetting === "apify" ? "Apify" : "DuckDuckGo";
  const endpointLabel = searchEndpointMode === "custom" && customSearchEndpoint ? "custom endpoint" : searchEndpointMode === "local" ? "localhost" : "current server";
  apiKeyStatus.textContent = `${providerLabel} via ${endpointLabel}${apifyApiKey ? " with key" : ""}`;
  apiKeyStatus.classList.toggle("has-key", Boolean(apifyApiKey));
}

function openApiKeyDialog() {
  if (!apiKeyDialog || !apiKeyInput) return;
  apiKeyInput.value = apifyApiKey;
  if (searchProviderSelect) searchProviderSelect.value = searchProviderSetting;
  if (searchEndpointSelect) searchEndpointSelect.value = searchEndpointMode;
  if (searchEndpointInput) searchEndpointInput.value = customSearchEndpoint;
  updateEndpointRow();
  if (apiManagerStatus) apiManagerStatus.textContent = "";
  if (typeof apiKeyDialog.showModal === "function") {
    apiKeyDialog.showModal();
  } else {
    const value = window.prompt("Apify API key", apifyApiKey);
    if (value !== null) saveApiKey(value);
  }
}

function updateEndpointRow() {
  if (!customEndpointRow) return;
  customEndpointRow.hidden = searchEndpointSelect?.value !== "custom";
}

function normalizeEndpoint(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getConfiguredApiBase() {
  if (searchEndpointMode === "local") return "http://localhost:3000";
  if (searchEndpointMode === "custom" && customSearchEndpoint) return customSearchEndpoint;
  return apiBase;
}

function saveApiSettings() {
  searchProviderSetting = searchProviderSelect?.value || "duckduckgo";
  searchEndpointMode = searchEndpointSelect?.value || "auto";
  customSearchEndpoint = normalizeEndpoint(searchEndpointInput?.value || "");
  apifyApiKey = String(apiKeyInput?.value || "").trim();

  localStorage.setItem("oldoodleSearchProvider", searchProviderSetting);
  localStorage.setItem("oldoodleSearchEndpointMode", searchEndpointMode);
  if (customSearchEndpoint) localStorage.setItem("oldoodleSearchEndpoint", customSearchEndpoint);
  else localStorage.removeItem("oldoodleSearchEndpoint");

  if (apifyApiKey) localStorage.setItem("oldoodleApifyApiKey", apifyApiKey);
  else localStorage.removeItem("oldoodleApifyApiKey");
  localStorage.setItem("oldoodleApifyPromptSeen", "true");

  updateApiKeyStatus();
  setStatus("Search API settings saved.");
  setPet("happy", "API", "search wired");
}

function resetApiSettings() {
  apifyApiKey = "";
  searchProviderSetting = "duckduckgo";
  searchEndpointMode = "auto";
  customSearchEndpoint = "";
  localStorage.removeItem("oldoodleApifyApiKey");
  localStorage.removeItem("oldoodleSearchProvider");
  localStorage.removeItem("oldoodleSearchEndpointMode");
  localStorage.removeItem("oldoodleSearchEndpoint");
  updateApiKeyStatus();
  setStatus("Search API settings reset.");
  setPet("idle", "404", "default search");
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

async function testApiSettings() {
  if (!apiManagerStatus) return;
  const previousProvider = searchProviderSetting;
  const previousEndpointMode = searchEndpointMode;
  const previousEndpoint = customSearchEndpoint;
  const previousKey = apifyApiKey;

  searchProviderSetting = searchProviderSelect?.value || "duckduckgo";
  searchEndpointMode = searchEndpointSelect?.value || "auto";
  customSearchEndpoint = normalizeEndpoint(searchEndpointInput?.value || "");
  apifyApiKey = String(apiKeyInput?.value || "").trim();

  apiManagerStatus.textContent = "Testing search API...";
  try {
    const url = new URL(`${getConfiguredApiBase()}/api/search.json`, location.href);
    url.searchParams.set("q", "oldoodle test");
    url.searchParams.set("provider", searchProviderSetting);
    if (searchProviderSetting === "apify" && apifyApiKey) url.searchParams.set("apifyToken", apifyApiKey);
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    apiManagerStatus.textContent = `OK: ${data.count} ${data.provider} results.`;
  } catch (error) {
    apiManagerStatus.textContent = `Failed: ${error.message}`;
  } finally {
    searchProviderSetting = previousProvider;
    searchEndpointMode = previousEndpointMode;
    customSearchEndpoint = previousEndpoint;
    apifyApiKey = previousKey;
  }
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
  if (open) {
    filterStartMenu(startSearchInput?.value || "");
    window.setTimeout(() => startSearchInput?.focus(), 40);
  }
}

function closeStartMenu() {
  setStartMenu(false);
}

function filterStartMenu(query) {
  if (!startMenu) return [];
  const clean = query.trim().toLowerCase();
  const items = [...startMenu.querySelectorAll("[data-start-action]")].filter((button) => !button.closest(".start-menu-footer"));
  const matches = [];

  items.forEach((button) => {
    const haystack = `${button.textContent} ${button.dataset.startAction}`.toLowerCase();
    const matched = !clean || haystack.includes(clean);
    button.hidden = !matched;
    if (matched) matches.push(button);
  });

  startMenu.classList.toggle("has-filter", Boolean(clean));
  if (startSearchEmpty) startSearchEmpty.hidden = !clean || matches.length > 0;
  return matches;
}

function runStartSearch(query) {
  const matches = filterStartMenu(query);
  const first = matches.find((button) => button.dataset.startAction !== "close");
  if (first) {
    handleStartAction(first.dataset.startAction);
    return;
  }

  closeStartMenu();
  if (query.trim()) {
    runSampleSearch(query.trim());
  }
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

function makeSearchFallbackItems(query) {
  const encoded = encodeURIComponent(query);
  return [
    {
      title: `DuckDuckGo results for "${query}"`,
      url: `https://duckduckgo.com/?q=${encoded}`,
      description: "Static hosting cannot run Oldoodle's live API, so this opens a normal web search.",
      type: "fallback"
    },
    {
      title: `Google results for "${query}"`,
      url: `https://www.google.com/search?q=${encoded}`,
      description: "Use this while the Zeabur API server is waking up or unavailable.",
      type: "fallback"
    },
    {
      title: `Old web snapshots for "${query}"`,
      url: `https://web.archive.org/web/*/${encoded}`,
      description: "A very Oldoodle-flavored fallback for exploring older pages and archived links.",
      type: "fallback"
    }
  ];
}

function renderSearchFallback(query, reason = "Live search API is not available from this page.") {
  renderResults(makeSearchFallbackItems(query));
  setStatus(`${reason} Showing fallback search links for "${query}".`);
  setSearchProgress("complete", 100);
  nudgePet({ energy: -2, focus: 2, bond: 1, mood: "worried" });
  setPet("worried", "404?", "static search fallback");
  if (browserStatusText) browserStatusText.textContent = "Fallback";
  window.setTimeout(() => setSearchProgress("idle"), 900);
}

function runSearch(query) {
  if (activeEvents) activeEvents.close();
  resultsBox.innerHTML = "";
  setStatus("Starting search...");
  setSearchProgress("starting", 12);
  nudgePet({ energy: -3, focus: 4, mood: "searching" });
  setPet("searching", "PING", `scanning "${query}"`, 999999);

  const configuredApiBase = getConfiguredApiBase();
  if (!configuredApiBase && location.hostname.endsWith("github.io")) {
    renderSearchFallback(query, "GitHub Pages is a static host.");
    return;
  }

  const searchUrl = new URL(`${configuredApiBase}/api/search`, location.href);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("provider", searchProviderSetting);
  if (searchProviderSetting === "apify" && apifyApiKey) searchUrl.searchParams.set("apifyToken", apifyApiKey);

  if (typeof EventSource !== "function") {
    renderSearchFallback(query, "This browser does not support live search events.");
    return;
  }

  activeEvents = new EventSource(searchUrl.toString());
  activeEvents.addEventListener("status", (event) => {
    const data = JSON.parse(event.data);
    setStatus(data.message);
    setSearchProgress("connecting", 46);
    setPet("searching", "PING", data.message.toLowerCase(), 999999);
  });

  activeEvents.addEventListener("results", (event) => {
    const data = JSON.parse(event.data);
    setStatus(`Showing ${data.count} live ${data.provider || "search"} results for "${data.query}"`);
    setSearchProgress("receiving", 82);
    renderResults(data.items);
    nudgePet({ energy: -2, focus: 8, bond: 2, mood: "happy" });
    setPet("happy", "OK", `${data.count} results cached`);
    if (browserStatusText) browserStatusText.textContent = "Done";
  });

  activeEvents.addEventListener("done", () => {
    setSearchProgress("complete", 100);
    window.setTimeout(() => setSearchProgress("idle"), 700);
    activeEvents.close();
    activeEvents = null;
  });

  activeEvents.addEventListener("error", (event) => {
    if (event.data) {
      const data = JSON.parse(event.data);
      setStatus(data.message);
      setSearchProgress("error", 100);
      nudgePet({ energy: -5, focus: -4, bond: 1, mood: "error" });
      setPet("error", "ERR", data.message);
    } else {
      renderSearchFallback(query, "The live search connection closed.");
    }
    if (configuredApiBase) openGameLibrary("dino");
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

function launchExternal(url) {
  window.location.href = url;
}

function clearGameTimers() {
  window.clearInterval(gameTimer);
  window.clearInterval(dinoTimer);
  gameTimer = null;
  dinoTimer = null;
}

function closeGameLibrary() {
  clearGameTimers();
  if (gameLibrary) gameLibrary.hidden = true;
  if (gameStage) gameStage.innerHTML = "";
  setStatus("Done");
}

function openGameLibrary(game = "oldoodle") {
  if (!gameLibrary || !gameStage) return;
  clearGameTimers();
  resultsBox.innerHTML = "";
  gameLibrary.hidden = false;
  setStatus("Airplane mode: local games ready.");
  setPet("happy", "GAME", "offline fun");
  renderGame(game);
  gameStage.focus();
}

function makeGameBits(count, text = "Oldoodle") {
  return Array.from({ length: count }, (_, index) => {
    const bit = document.createElement("button");
    bit.type = "button";
    bit.className = "game-bit";
    bit.textContent = text[index % text.length];
    bit.style.left = `${8 + Math.random() * 82}%`;
    bit.style.top = `${10 + Math.random() * 70}%`;
    bit.style.setProperty("--speed", `${1.8 + Math.random() * 2.4}s`);
    return bit;
  });
}

function renderFloatingGame(mode) {
  const title = mode === "gravity" ? "Gravity" : mode === "anti-gravity" ? "Anti-Gravity" : "Space";
  gameStage.innerHTML = `<div class="game-title">${title}</div>`;
  const bits = makeGameBits(mode === "space" ? 12 : 18, "OLD");
  bits.forEach((bit) => {
    if (mode === "gravity") bit.classList.add("falls");
    if (mode === "anti-gravity") bit.classList.add("rises");
    if (mode === "space") {
      bit.classList.add("draggable");
      bit.draggable = true;
      bit.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", String(bits.indexOf(bit)));
      });
    }
    gameStage.append(bit);
  });

  if (mode === "space") {
    gameStage.ondragover = (event) => event.preventDefault();
    gameStage.ondrop = (event) => {
      event.preventDefault();
      const bit = bits[Number(event.dataTransfer.getData("text/plain"))];
      if (!bit) return;
      const rect = gameStage.getBoundingClientRect();
      bit.style.left = `${clamp(((event.clientX - rect.left) / rect.width) * 100)}%`;
      bit.style.top = `${clamp(((event.clientY - rect.top) / rect.height) * 100)}%`;
    };
  }
}

function renderOldoodleGame() {
  gameStage.innerHTML = `
    <div class="oldoodle-game">
      <div class="oldoodle-game-logo">Oldooooooooooodle</div>
      <input aria-label="Oldooooooooooodle search" value="how many o's is too many?">
      <button type="button">I'm Feeling Ooooooold</button>
      <p>Every search result is just this page, but older.</p>
    </div>
  `;
  gameStage.querySelector("button").addEventListener("click", () => {
    setStatus("Oldooooooooooodle found 999,999 nostalgic o's.");
    setPet("happy", "OOOO", "too many o's");
  });
}

function renderDinoGame() {
  gameStage.innerHTML = `
    <div class="dino-game" aria-label="Dino game">
      <div id="dinoScore" class="dino-score">00000</div>
      <div id="dino" class="dino">404</div>
      <div id="cactus" class="cactus" aria-label="cactus"><span></span><span></span><span></span></div>
      <div class="ground"></div>
    </div>
    <p class="game-help">Click, tap, or press Space to jump.</p>
  `;

  const dinoGame = gameStage.querySelector(".dino-game");
  const dino = gameStage.querySelector("#dino");
  const cactus = gameStage.querySelector("#cactus");
  const score = gameStage.querySelector("#dinoScore");
  let jumping = false;
  let gameOver = false;
  let points = 0;

  const jump = () => {
    if (jumping || gameOver) return;
    jumping = true;
    dino.classList.add("jump");
    window.setTimeout(() => {
      dino.classList.remove("jump");
      jumping = false;
    }, 520);
  };

  const hitbox = (box, insetX, insetY) => ({
    left: box.left + insetX,
    right: box.right - insetX,
    top: box.top + insetY,
    bottom: box.bottom - insetY
  });

  const overlaps = (a, b) => !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);

  const endGame = () => {
    gameOver = true;
    score.textContent = "CRASH";
    dinoGame.classList.add("is-crashed");
    cactus.classList.add("is-stopped");
    setStatus("Dino game over: cactus collision.");
    setPet("worried", "DINO", "cactus got us");
    clearGameTimers();
  };

  gameStage.onclick = jump;
  gameStage.onkeydown = (event) => {
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      jump();
    }
  };

  dinoTimer = window.setInterval(() => {
    if (gameOver) return;
    points += 1;
    score.textContent = String(points).padStart(5, "0");
    const dinoBox = hitbox(dino.getBoundingClientRect(), 6, 4);
    const cactusBox = hitbox(cactus.getBoundingClientRect(), 2, 2);
    if (overlaps(dinoBox, cactusBox)) endGame();
  }, 80);
}

function renderGame(game) {
  clearGameTimers();
  gameButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.game === game));
  gameStage.onclick = null;
  gameStage.onkeydown = null;
  gameStage.ondragover = null;
  gameStage.ondrop = null;

  if (game === "oldoodle") renderOldoodleGame();
  if (game === "gravity") renderFloatingGame("gravity");
  if (game === "anti-gravity") renderFloatingGame("anti-gravity");
  if (game === "space") renderFloatingGame("space");
  if (game === "dino") renderDinoGame();
}

function handleStartAction(action) {
  closeStartMenu();

  if (action === "google") {
    launchExternal("https://www.google.com/");
    return;
  }

  if (action === "duckduckgo") {
    launchExternal("https://duckduckgo.com/");
    return;
  }

  if (action === "chatgpt") {
    launchExternal("https://openai.com/");
    return;
  }

  if (action === "airplane") {
    openGameLibrary("oldoodle");
    return;
  }

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

startSearchInput?.addEventListener("input", () => {
  filterStartMenu(startSearchInput.value);
});

startSearchInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  runStartSearch(startSearchInput.value);
});

startSearchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  runStartSearch(startSearchInput?.value || "");
});

gameButtons.forEach((button) => {
  button.addEventListener("click", () => renderGame(button.dataset.game));
});

closeGames?.addEventListener("click", closeGameLibrary);

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

clearApiKeyButton?.addEventListener("click", resetApiSettings);

searchEndpointSelect?.addEventListener("change", updateEndpointRow);

apiKeyDialog?.addEventListener("close", () => {
  if (apiKeyDialog.returnValue === "save") {
    saveApiSettings();
  }
});

apiKeySave?.addEventListener("click", (event) => {
  event.preventDefault();
  saveApiSettings();
  apiKeyDialog?.close();
});

apiManagerTest?.addEventListener("click", testApiSettings);

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

if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => setStatus("Oldoodle shell cached for offline use."))
      .catch(() => {
        // Cache setup is optional; the app still works without it.
      });
  });
}

applyPetEnabled();
updatePetPanel();
setDoodle(currentDoodle, false);
updateApiKeyStatus();
if (!apifyApiKey && localStorage.getItem("oldoodleApifyPromptSeen") !== "true") {
  localStorage.setItem("oldoodleApifyPromptSeen", "true");
  window.setTimeout(openApiKeyDialog, 700);
}
