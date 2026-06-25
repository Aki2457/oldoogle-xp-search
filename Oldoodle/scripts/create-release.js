const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const releaseRoot = path.join(dist, "release");
const oldoodle = path.join(releaseRoot, "Oldoodle");
const extensionDir = path.join(oldoodle, "Oldoodle_Extension");
const torrentDir = path.join(oldoodle, "Oldoodle_Torrent");
const readmeDir = path.join(oldoodle, "Oldoodle_ReadMe");
const appGuideDir = path.join(readmeDir, "Oldoodle_App_Guide");
const zipPath = path.join(dist, "Oldoodle_Release.zip");
const torrentPath = path.join(torrentDir, "Oldoodle_Torrent.torrent");
const pieceLength = 256 * 1024;

function rm(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copy(from, to) {
  if (!fs.existsSync(from)) throw new Error(`Missing ${from}`);
  fs.copyFileSync(from, to);
}

function write(file, content) {
  fs.writeFileSync(file, content.trimStart(), "utf8");
}

function bencode(value) {
  if (Buffer.isBuffer(value)) return Buffer.concat([Buffer.from(`${value.length}:`), value]);
  if (typeof value === "string") return Buffer.from(`${Buffer.byteLength(value)}:${value}`);
  if (typeof value === "number") return Buffer.from(`i${Math.trunc(value)}e`);
  if (Array.isArray(value)) return Buffer.concat([Buffer.from("l"), ...value.map(bencode), Buffer.from("e")]);
  return Buffer.concat([
    Buffer.from("d"),
    ...Object.keys(value).sort().flatMap((key) => [bencode(key), bencode(value[key])]),
    Buffer.from("e")
  ]);
}

function listTorrentFiles(baseDir) {
  const files = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const relative = path.relative(baseDir, full);
      if (relative === "Oldoodle_Torrent" || relative.startsWith(`Oldoodle_Torrent${path.sep}`)) continue;
      if (entry.isDirectory()) {
        walk(full);
      } else {
        files.push(full);
      }
    }
  }

  walk(baseDir);
  return files.sort();
}

function buildPieces(files) {
  const pieces = [];
  let pending = Buffer.alloc(0);

  for (const file of files) {
    let data = fs.readFileSync(file);
    while (data.length) {
      const remaining = pieceLength - pending.length;
      pending = Buffer.concat([pending, data.subarray(0, remaining)]);
      data = data.subarray(remaining);

      if (pending.length === pieceLength) {
        pieces.push(crypto.createHash("sha1").update(pending).digest());
        pending = Buffer.alloc(0);
      }
    }
  }

  if (pending.length) pieces.push(crypto.createHash("sha1").update(pending).digest());
  return Buffer.concat(pieces);
}

function writeTorrent(baseDir) {
  const files = listTorrentFiles(baseDir);
  const torrent = {
    "announce": "udp://tracker.opentrackr.org:1337/announce",
    "announce-list": [
      ["udp://tracker.opentrackr.org:1337/announce"],
      ["udp://open.stealth.si:80/announce"],
      ["udp://tracker.torrent.eu.org:451/announce"]
    ],
    "comment": "Oldoodle XP release torrent. Generated locally; share the release folder contents alongside this torrent for hotspot-friendly transfers.",
    "created by": "Oldoodle release builder",
    "creation date": Math.floor(Date.now() / 1000),
    "url-list": [
      "https://github.com/Aki2457/oldoodle/releases/download/v1.0.1/Oldoodle_Release.zip"
    ],
    "info": {
      "name": "Oldoodle",
      "piece length": pieceLength,
      "pieces": buildPieces(files),
      "files": files.map((file) => ({
        "length": fs.statSync(file).size,
        "path": path.relative(baseDir, file).split(path.sep)
      }))
    }
  };

  fs.writeFileSync(torrentPath, bencode(torrent));
}

rm(releaseRoot);
rm(zipPath);
fs.mkdirSync(extensionDir, { recursive: true });
fs.mkdirSync(torrentDir, { recursive: true });
fs.mkdirSync(appGuideDir, { recursive: true });

copy(path.join(dist, "Oldoodle-Chromium-XP.exe"), path.join(oldoodle, "Oldoodle_Chromium.exe"));
copy(path.join(dist, "Oldoodle_Chrome.zip"), path.join(extensionDir, "Oldoodle_Chrome.zip"));
copy(path.join(dist, "Oldoodle_Firefox.xpi"), path.join(extensionDir, "Oldoodle_Firefox.xpi"));

write(path.join(extensionDir, "Oldoodle_Extension_ReadMe.md"), `
# Oldoodle Extension

This folder contains the browser extension builds.

- \`Oldoodle_Chrome.zip\` is Oldoodle Chrome.
- \`Oldoodle_Firefox.xpi\` is Oldoodle Firefox.

Live search widgets use the local Oldoodle server at \`http://localhost:3000\`. Start the app server before expecting Apify-backed searches to work from an extension page.

Use Developer Mode to load the extracted \`Oldoodle_Chrome.zip\` folder, or load \`extensions/chromium\` unpacked from the source repo.
`);

write(path.join(torrentDir, "Oldoodle_Torrent.md"), `
# Oldoodle Torrent

\`Oldoodle_Torrent.torrent\` is included for hotspot-friendly sharing.

Important notes:

- The torrent describes the Oldoodle release payload files and intentionally excludes the \`Oldoodle_Torrent/\` folder itself. A torrent cannot reliably include itself because changing the torrent changes the payload hash.
- For easiest sharing, keep the extracted \`Oldoodle/\` folder intact and seed it from a BitTorrent client.
- The torrent includes public UDP trackers and a GitHub release web seed for \`Oldoodle_Release.zip\`.
- If you only need a direct download, use the GitHub release zip instead.
`);

write(path.join(readmeDir, "Oldoodle_Github_Details.md"), `
# Oldoodle GitHub Details

Repository: https://github.com/Aki2457/oldoodle

The repository is private. It contains source code only. Secrets, generated binaries, downloaded Chromium builds, and local dependency folders are ignored by git.

Ignored locally:

- \`.env\`
- \`dist/\`
- \`node_modules/\`
`);

write(path.join(readmeDir, "Oldoodle_Chrome_Guide.md"), `
# Oldoodle Chrome Guide

## Option A: bundled Chromium

Run:

\`\`\`text
Oldoodle_Chromium.exe
\`\`\`

This opens the downloaded Chromium build with the Oldoodle extension loaded.

## Option B: Chrome / Edge / Chromium extension

1. Open \`chrome://extensions\`.
2. Enable Developer mode.
3. Load \`Oldoodle_Chrome.zip\` as an unpacked extension folder after extracting it, or load \`extensions/chromium\` unpacked from the source repo.
4. Start the Oldoodle local app server if you want live Apify search widgets.

Chrome blocks most local extension package installs that are not from the Chrome Web Store. Use unpacked loading for local testing.
`);

write(path.join(readmeDir, "Oldoodle_FireFox_Guide.md"), `
# Oldoodle FireFox Guide

## Temporary local install

1. Open \`about:debugging#/runtime/this-firefox\`.
2. Click **Load Temporary Add-on**.
3. Select \`Oldoodle_Firefox.xpi\`.

Firefox usually requires signing for permanent extension installs. For permanent distribution, submit the XPI to Mozilla Add-ons for signing.

Live search widgets use the local app server at \`http://localhost:3000\`.
`);

write(path.join(appGuideDir, "Oldoodle_App_Setup_Guide.md"), `
# Oldoodle App Setup Guide

1. Install Node.js if running from source.
2. Copy \`.env.example\` to \`.env\`.
3. Add your Apify token:

\`\`\`env
APIFY_TOKEN=your_apify_token_here
\`\`\`

4. Run:

\`\`\`bash
npm install
npm start
\`\`\`

Open \`http://localhost:3000\`.

The packaged release intentionally does not include your \`.env\` secret.
`);

write(path.join(appGuideDir, "Oldoodle_Update_Guide.md"), `
# Oldoodle Update Guide

1. Pull the latest source from GitHub.
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Rebuild release artifacts:

\`\`\`bash
npm run build:exe
npm run package:extensions
npm run release:folder
\`\`\`

4. Upload \`dist/Oldoodle_Release.zip\` to a new GitHub release.
`);

write(path.join(appGuideDir, "Oldoodle_Extension_Update_Guide.md"), `
# Oldoodle Extension Update Guide

1. Update files in \`public/\`.
2. Sync them into both extension folders.
3. Run:

\`\`\`bash
npm run package:extensions
\`\`\`
`);

writeTorrent(oldoodle);

execFileSync("powershell", [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path '${oldoodle.replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`
], { stdio: "inherit" });

console.log(`Wrote ${zipPath}`);
