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
const searchProvider = (process.env.SEARCH_PROVIDER || "duckduckgo").toLowerCase();
const searchTimeoutMs = Number(process.env.SEARCH_TIMEOUT_MS || 5000);
const customSearchTemplate = process.env.CUSTOM_SEARCH_URL || "";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getApifyToken(req) {
  const supplied = String(req?.query?.apifyToken || req?.headers?.["x-apify-token"] || "").trim();
  return supplied || token;
}

function getSearchProvider(req) {
  const provider = String(req?.query?.provider || "").trim().toLowerCase();
  if (["apify", "duckduckgo", "custom"].includes(provider)) return provider;
  return req.query.apifyToken ? "apify" : searchProvider;
}

async function apify(pathname, options = {}, apifyToken = token) {
  if (!apifyToken) {
    throw new Error("APIFY_TOKEN is missing from .env");
  }

  const url = new URL(`https://api.apify.com/v2/${pathname}`);
  url.searchParams.set("token", apifyToken);

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
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeDuckDuckGoUrl(value) {
  try {
    const url = new URL(value, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : url.href;
  } catch {
    return value;
  }
}

function normalizeItem(item) {
  return {
    title: cleanText(item.title || item.name || item.searchQuery?.term || "Untitled result"),
    url: cleanText(item.url || item.link || item.displayedUrl || ""),
    description: cleanText(item.description || item.text || item.snippet || item.preview || ""),
    type: cleanText(item.type || item.resultType || "result")
  };
}

async function duckDuckGoSearch(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), searchTimeoutMs);

  try {
    const url = new URL("https://html.duckduckgo.com/html/");
    url.searchParams.set("q", query);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "user-agent": "OldoodleXP/1.0 (+https://github.com/Aki2457/oldoodle)"
      }
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo request failed (${response.status})`);
    }

    const html = await response.text();
    const blocks = html.split(/<div class="result results_links/i).slice(1);

    return blocks.map((block) => {
      const linkMatch = block.match(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) return null;

      const snippetMatch = block.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)
        || block.match(/<div[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
      const urlMatch = block.match(/<a[^>]+class="result__url"[^>]*>([\s\S]*?)<\/a>/i);

      return normalizeItem({
        title: cleanText(linkMatch[2]),
        url: decodeDuckDuckGoUrl(cleanText(linkMatch[1])),
        description: cleanText(snippetMatch?.[1] || ""),
        type: cleanText(urlMatch?.[1] || "web")
      });
    }).filter(Boolean).slice(0, 12);
  } finally {
    clearTimeout(timeout);
  }
}

async function apifySearch(query, sendStatus = () => {}, apifyToken = token) {
  sendStatus({ message: "Dialing Apify..." });

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
  }, apifyToken);

  const runId = run.data.id;
  sendStatus({ message: "Search bot is running...", runId });

  let finishedRun = run.data;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const current = await apify(`actor-runs/${runId}`, {}, apifyToken);
    finishedRun = current.data;
    sendStatus({
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
  const dataset = await apify(`datasets/${datasetId}/items?clean=true`, {}, apifyToken);
  const items = Array.isArray(dataset) ? dataset.flatMap((entry) => {
    if (Array.isArray(entry.organicResults)) return entry.organicResults;
    if (Array.isArray(entry.results)) return entry.results;
    return [entry];
  }) : [];

  return items.slice(0, 12).map(normalizeItem);
}

async function customSearch(query, customSearchUrl) {
  if (!customSearchUrl) throw new Error("Custom search URL is missing");
  const url = customSearchUrl.includes("{q}")
    ? customSearchUrl.replaceAll("{q}", encodeURIComponent(query))
    : `${customSearchUrl}${customSearchUrl.includes("?") ? "&" : "?"}q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || `Custom search failed (${response.status})`);
  const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : Array.isArray(data.results) ? data.results : [];
  return items.slice(0, 12).map(normalizeItem);
}

async function search(query, sendStatus = () => {}, apifyToken = token, preferredProvider = searchProvider) {
  if (preferredProvider === "custom") {
    return {
      provider: "custom",
      items: await customSearch(query, customSearchTemplate)
    };
  }

  if (preferredProvider === "apify") {
    return {
      provider: "apify",
      items: await apifySearch(query, sendStatus, apifyToken)
    };
  }

  try {
    sendStatus({ message: "Searching the fast index..." });
    const items = await duckDuckGoSearch(query);
    return { provider: "duckduckgo", items };
  } catch (error) {
    if (!apifyToken) throw error;
    sendStatus({ message: "Fast index missed; falling back to Apify..." });
    return {
      provider: "apify",
      items: await apifySearch(query, sendStatus, apifyToken)
    };
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "oldoodle-search",
    provider: searchProvider,
    oldoodle: {
      endpoint: "/api/search?q=windows+xp",
      events: ["status", "results", "done"],
      itemShape: ["title", "url", "description", "type"]
    }
  });
});

app.get("/api/search.json", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) {
    res.status(400).json({ error: "Missing search query" });
    return;
  }

  try {
    const apifyToken = getApifyToken(req);
    const provider = getSearchProvider(req);
    const result = await search(query, undefined, apifyToken, provider);
    res.json({
      query,
      provider: result.provider,
      count: result.items.length,
      items: result.items
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

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
    const apifyToken = getApifyToken(req);
    const provider = getSearchProvider(req);
    const result = await search(query, (status) => sendEvent(res, "status", status), apifyToken, provider);

    sendEvent(res, "results", {
      query,
      provider: result.provider,
      count: result.items.length,
      items: result.items
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
  app.listen(port, "0.0.0.0", () => {
    const url = `http://localhost:${port}`;
    console.log(`Oldoodle running at ${url}`);
    openBrowser(url);
  });
}

module.exports = app;
