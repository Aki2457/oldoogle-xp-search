const form = document.querySelector("#searchForm");
const input = document.querySelector("#query");
const statusBox = document.querySelector("#status");
const resultsBox = document.querySelector("#results");
const lucky = document.querySelector("#lucky");
const pet = document.querySelector("#codexPet");
const petFace = document.querySelector("#petFace");
const petBubble = document.querySelector("#petBubble");
const petToggle = document.querySelector("#petToggle");
const browserStatusText = document.querySelector("#browserStatusText");
const startButton = document.querySelector("#startButton");
const startMenu = document.querySelector("#startMenu");

let activeEvents;
let petTimer;
if (localStorage.getItem("oldoolePetDefaultOffApplied") !== "true") {
  localStorage.setItem("oldoolePetEnabled", "false");
  localStorage.setItem("oldoolePetDefaultOffApplied", "true");
}
let petEnabled = localStorage.getItem("oldoolePetEnabled") === "true";
const apiBase = ["chrome-extension:", "moz-extension:", "file:"].includes(location.protocol)
  ? "http://localhost:3000"
  : "";

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

  petTimer = window.setTimeout(() => {
    pet.classList.remove("is-speaking");
    if (mood !== "searching") {
      pet.dataset.mood = "idle";
      petFace.textContent = "404";
    }
  }, hold);
}

function setStatus(message) {
  statusBox.textContent = message || "";
  if (browserStatusText) browserStatusText.textContent = message || "Done";
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
    resultsBox.innerHTML = '<article class="widget"><p>No results came back from Apify.</p></article>';
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
  setPet("searching", "PING", `scanning "${query}"`, 999999);

  activeEvents = new EventSource(`${apiBase}/api/search?q=${encodeURIComponent(query)}`);
  activeEvents.addEventListener("status", (event) => {
    const data = JSON.parse(event.data);
    setStatus(data.message);
    setPet("searching", "PING", data.message.toLowerCase(), 999999);
  });

  activeEvents.addEventListener("results", (event) => {
    const data = JSON.parse(event.data);
    setStatus(`Showing ${data.count} live Apify results for "${data.query}"`);
    renderResults(data.items);
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
      setPet("error", "ERR", data.message);
    } else {
      setStatus("The live search connection closed.");
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
    setStatus("Oldoogle XP Search: live Apify widgets in a classic shell.");
    setPet("happy", "?", "help loaded");
    return;
  }

  if (action === "settings") {
    setStatus("Control Panel: homepage and extension settings live in the browser package.");
    setPet("idle", "CFG", "settings noted");
    return;
  }

  if (action === "logoff") {
    setStatus("Logged off Oldoogle User.");
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

pet?.addEventListener("click", () => {
  const quips = [
    ["idle", "404", "still here"],
    ["happy", "BEEP", "old web, new tricks"],
    ["worried", "404?", "try searching codex pet"],
    ["idle", "ZZZ", "keeping watch"]
  ];
  const [mood, face, message] = quips[Math.floor(Math.random() * quips.length)];
  setPet(mood, face, message);
});

petToggle?.addEventListener("click", () => {
  petEnabled = !petEnabled;
  localStorage.setItem("oldoolePetEnabled", String(petEnabled));
  applyPetEnabled();
  if (petEnabled) setPet("idle", "404", "back online");
});

applyPetEnabled();
