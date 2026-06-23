const express = require("express");
const { execFile } = require("child_process");
const path = require("path");

const runtimeDir = process.pkg ? path.dirname(process.execPath) : __dirname;
require("dotenv").config({ path: path.join(runtimeDir, ".env") });
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const token = process.env.APIFY_TOKEN;
const actorId = process.env.APIFY_ACTOR_ID || "apify/google-search-scraper";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function apify(pathname, options = {}) {
  if (!token) {
    throw new Error("APIFY_TOKEN is missing from .env");
  }

  const url = new URL(`https://api.apify.com/v2/${pathname}`);
  url.searchParams.set("token", token);

  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Apify request failed (${response.status}): ${message}`);
  }

  return response.json();
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00c2/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeItem(item) {
  return {
    title: cleanText(item.title || item.name || item.searchQuery?.term || "Untitled result"),
    url: cleanText(item.url || item.link || item.displayedUrl || ""),
    description: cleanText(item.description || item.text || item.snippet || item.preview || ""),
    type: cleanText(item.type || item.resultType || "result")
  };
}

app.get("/api/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) {
    res.status(400).json({ error: "Missing search query" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    sendEvent(res, "status", { message: "Dialing Apify..." });

    const input = {
      queries: query,
      resultsPerPage: 10,
      maxPagesPerQuery: 1,
      countryCode: "us",
      languageCode: "en",
      mobileResults: false,
      saveHtml: false,
      saveHtmlToKeyValueStore: false
    };

    const run = await apify(`acts/${encodeURIComponent(actorId)}/runs`, {
      method: "POST",
      body: JSON.stringify(input)
    });

    const runId = run.data.id;
    sendEvent(res, "status", { message: "Search bot is running...", runId });

    let finishedRun = run.data;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const current = await apify(`actor-runs/${runId}`);
      finishedRun = current.data;
      sendEvent(res, "status", {
        message: `Apify status: ${finishedRun.status}`,
        status: finishedRun.status
      });

      if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(finishedRun.status)) {
        break;
      }
    }

    if (finishedRun.status !== "SUCCEEDED") {
      throw new Error(`Actor ended with status ${finishedRun.status}`);
    }

    const datasetId = finishedRun.defaultDatasetId;
    const dataset = await apify(`datasets/${datasetId}/items?clean=true`);
    const items = Array.isArray(dataset) ? dataset.flatMap((entry) => {
      if (Array.isArray(entry.organicResults)) return entry.organicResults;
      if (Array.isArray(entry.results)) return entry.results;
      return [entry];
    }) : [];

    sendEvent(res, "results", {
      query,
      count: items.length,
      items: items.slice(0, 12).map(normalizeItem)
    });
    sendEvent(res, "done", { ok: true });
  } catch (error) {
    sendEvent(res, "error", { message: error.message });
  } finally {
    res.end();
  }
});

function openBrowser(url) {
  if (process.env.OLDOOGLE_NO_OPEN === "1") return;

  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", url], { windowsHide: true });
    return;
  }

  execFile(process.platform === "darwin" ? "open" : "xdg-open", [url]);
}

if (require.main === module) {
  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Oldoogle running at ${url}`);
    openBrowser(url);
  });
}

module.exports = app;
