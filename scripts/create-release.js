const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const releaseRoot = path.join(dist, "release");
const oldoodle = path.join(releaseRoot, "Oldoodle");
const extensionDir = path.join(oldoodle, "Oldoodle_Extension");
const readmeDir = path.join(oldoodle, "Oldoodle_ReadMe");
const appGuideDir = path.join(readmeDir, "Oldoodle_App_Guide");
const zipPath = path.join(dist, "Oldoodle_Release.zip");

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

rm(releaseRoot);
rm(zipPath);
fs.mkdirSync(extensionDir, { recursive: true });
fs.mkdirSync(appGuideDir, { recursive: true });

copy(path.join(dist, "Oldoogle-Chromium-XP.exe"), path.join(oldoodle, "Oldoodle_Chromium.exe"));
copy(path.join(dist, "oldoogle-xp-chromium-extension.crx"), path.join(extensionDir, "Oldoodle_Extension_Chrome.crx"));
copy(path.join(dist, "oldoogle-xp-firefox-extension.xpi"), path.join(extensionDir, "Oldoodle_Extension_FireFox.xpi"));

write(path.join(extensionDir, "Oldoodle_Extension_ReadMe.md"), `
# Oldoodle Extension

This folder contains the browser extension builds.

- \`Oldoodle_Extension_Chrome.crx\` is for Chromium-based browsers.
- \`Oldoodle_Extension_FireFox.xpi\` is for Firefox.

Live search widgets use the local Oldoogle server at \`http://localhost:3000\`. Start the app server before expecting Apify-backed searches to work from an extension page.

If Chrome blocks local CRX installs, use Developer Mode and load \`extensions/chromium\` unpacked from the source repo.
`);

write(path.join(readmeDir, "Oldoodle_Github_Details.md"), `
# Oldoodle GitHub Details

Repository: https://github.com/Aki2457/oldoogle-xp-search

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
3. Drag \`Oldoodle_Extension_Chrome.crx\` into the page, or load \`extensions/chromium\` unpacked from the source repo.
4. Start the Oldoogle local app server if you want live Apify search widgets.

Chrome may block local CRX installs that are not from the Chrome Web Store. In that case, use unpacked loading.
`);

write(path.join(readmeDir, "Oldoodle_FireFox_Guide.md"), `
# Oldoodle FireFox Guide

## Temporary local install

1. Open \`about:debugging#/runtime/this-firefox\`.
2. Click **Load Temporary Add-on**.
3. Select \`Oldoodle_Extension_FireFox.xpi\`.

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

execFileSync("powershell", [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path '${oldoodle.replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`
], { stdio: "inherit" });

console.log(`Wrote ${zipPath}`);
