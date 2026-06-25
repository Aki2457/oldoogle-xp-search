const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { install, Browser, resolveBuildId } = require("@puppeteer/browsers");

async function main() {
  const root = path.resolve(__dirname, "..");
  const cacheDir = path.join(root, "dist", "chromium-cache");
  const profileDir = path.join(root, "dist", "chromium-oldoodle-profile");
  const extensionDir = path.join(root, "extensions", "chromium");

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.mkdirSync(profileDir, { recursive: true });

  const buildId = await resolveBuildId(Browser.CHROMIUM, "win64", "latest");
  const installed = await install({
    browser: Browser.CHROMIUM,
    buildId,
    cacheDir,
    platform: "win64"
  });

  const chromePath = installed.executablePath;
  const launcher = [
    "@echo off",
    "setlocal",
    "cd /d %~dp0..",
    "start \"Oldoodle Chromium\" \"" + chromePath + "\" --user-data-dir=\"" + profileDir + "\" --load-extension=\"" + extensionDir + "\" --disable-extensions-except=\"" + extensionDir + "\" chrome://newtab",
    "endlocal"
  ].join("\r\n");

  fs.writeFileSync(path.join(root, "dist", "Launch-Oldoodle-Chromium.bat"), launcher);
  fs.writeFileSync(path.join(root, "dist", "chromium-path.txt"), chromePath);

  try {
    execFileSync(chromePath, ["--version"], { stdio: "pipe" });
  } catch {
    // Some Chromium snapshots exit non-zero for --version on Windows shells.
  }

  console.log(`Chromium build ${buildId}`);
  console.log(`Executable: ${chromePath}`);
  console.log(`Launcher: ${path.join(root, "dist", "Launch-Oldoodle-Chromium.bat")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
