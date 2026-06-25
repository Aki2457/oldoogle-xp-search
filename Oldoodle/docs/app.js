const body = document.body;
const buttons = document.querySelectorAll("[data-doodle]");
const form = document.querySelector("#demoSearch");
const input = document.querySelector("#query");
const results = document.querySelector("#results");
const lucky = document.querySelector("#lucky");

function setDoodle(name) {
  body.dataset.doodle = name;
  buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.doodle === name));
  localStorage.setItem("oldoodlePagesDoodle", name);
}

function renderDemo(query) {
  const clean = query || "oldoodle xp";
  results.innerHTML = "";

  const items = [
    {
      title: `Oldoodle demo search: ${clean}`,
      url: "github.com/Aki2457/oldoogle-xp-search",
      text: "The hosted GitHub Pages app is a static demo and launcher. Live Apify widgets run in the local app."
    },
    {
      title: "Download Oldoodle XP release",
      url: "github.com/Aki2457/oldoogle-xp-search/releases/download/v1.0.1/Oldoodle_Release.zip",
      text: "Get the Oldoodle Chrome ZIP, Oldoodle Firefox XPI, torrent metadata, and install guides."
    },
    {
      title: "Run local live search",
      url: "localhost:3000",
      text: "Start Oldoodle locally with your .env Apify token to enable live search widgets."
    }
  ];

  for (const item of items) {
    const article = document.createElement("article");
    article.innerHTML = `<a href="https://${item.url}">${item.title}</a><p class="url">${item.url}</p><p>${item.text}</p>`;
    results.append(article);
  }
}

buttons.forEach((button) => button.addEventListener("click", () => setDoodle(button.dataset.doodle)));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderDemo(input.value.trim());
});

lucky.addEventListener("click", () => {
  window.location.href = "https://github.com/Aki2457/oldoogle-xp-search/releases/download/v1.0.1/Oldoodle_Release.zip";
});

setDoodle(localStorage.getItem("oldoodlePagesDoodle") || "classic");
