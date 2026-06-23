const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, "..");
const chromePathFile = path.join(root, "chromium-path.txt");
const fallbackChrome = path.join(root, "chromium-cache", "chromium");
const profileDir = path.join(root, "chromium-oldoogle-profile");
const extensionDir = path.join(root, "..", "extensions", "chromium");

function findChrome(dir) {
  if (!fs.existsSync(dir)) return "";
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === "chrome.exe") return full;
    if (entry.isDirectory()) {
      const found = findChrome(full);
      if (found) return found;
    }
  }
  return "";
}

const chromePath = fs.existsSync(chromePathFile)
  ? fs.readFileSync(chromePathFile, "utf8").trim()
  : findChrome(fallbackChrome);

if (!chromePath || !fs.existsSync(chromePath)) {
  console.error("Chromium was not found. Run npm run download:chromium first.");
  process.exit(1);
}

fs.mkdirSync(profileDir, { recursive: true });

spawn(chromePath, [
  `--user-data-dir=${profileDir}`,
  `--load-extension=${extensionDir}`,
  `--disable-extensions-except=${extensionDir}`,
  "chrome://newtab"
], {
  detached: true,
  stdio: "ignore"
}).unref();
