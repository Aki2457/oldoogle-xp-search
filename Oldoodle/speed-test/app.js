const form = document.querySelector("#runner");
const endpoint = document.querySelector("#endpoint");
const query = document.querySelector("#query");
const runs = document.querySelector("#runs");
const log = document.querySelector("#log");
const payload = document.querySelector("#payload");
const avg = document.querySelector("#avg");
const best = document.querySelector("#best");
const count = document.querySelector("#count");
const statusText = document.querySelector("#status");

function ms(value) {
  return `${Math.round(value)} ms`;
}

function setStatus(value) {
  statusText.textContent = value;
}

async function runOnce(baseUrl, searchQuery) {
  const url = new URL("/api/search.json", baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("q", searchQuery);

  const started = performance.now();
  const response = await fetch(url);
  const body = await response.json();
  const duration = performance.now() - started;

  if (!response.ok || !body.items) {
    throw new Error(body.error || `HTTP ${response.status}`);
  }

  return { duration, body };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const totalRuns = Number(runs.value);
  const timings = [];
  let latestBody = null;
  log.innerHTML = "";
  payload.textContent = "{}";
  avg.textContent = "-";
  best.textContent = "-";
  count.textContent = "-";
  setStatus("Running");

  for (let index = 0; index < totalRuns; index += 1) {
    const item = document.createElement("li");
    item.textContent = `Run ${index + 1}: waiting...`;
    log.append(item);

    try {
      const result = await runOnce(endpoint.value, query.value.trim());
      timings.push(result.duration);
      latestBody = result.body;
      item.textContent = `Run ${index + 1}: ${ms(result.duration)} (${result.body.count} results, ${result.body.provider})`;
    } catch (error) {
      item.textContent = `Run ${index + 1}: failed - ${error.message}`;
    }
  }

  if (timings.length) {
    const average = timings.reduce((sum, value) => sum + value, 0) / timings.length;
    avg.textContent = ms(average);
    best.textContent = ms(Math.min(...timings));
    count.textContent = String(latestBody.count);
    payload.textContent = JSON.stringify(latestBody, null, 2);
    setStatus("Done");
  } else {
    setStatus("Failed");
  }
});
