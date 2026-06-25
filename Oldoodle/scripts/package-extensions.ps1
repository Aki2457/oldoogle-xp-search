$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$chromiumZip = Join-Path $dist "Oldoodle_Chrome.zip"
$firefoxXpi = Join-Path $dist "Oldoodle_Firefox.xpi"
$firefoxZip = Join-Path $dist "Oldoodle_Firefox.zip"

New-Item -ItemType Directory -Force -Path $dist | Out-Null
Remove-Item -Force -ErrorAction SilentlyContinue $chromiumZip, $firefoxXpi, $firefoxZip
Remove-Item -Force -ErrorAction SilentlyContinue `
  (Join-Path $dist "oldoodle-xp-chromium-extension.zip"), `
  (Join-Path $dist "oldoodle-xp-firefox-extension.xpi"), `
  (Join-Path $dist "oldoodle-xp-firefox-extension.zip"), `
  (Join-Path $dist "oldoogle-xp-chromium-extension.zip"), `
  (Join-Path $dist "oldoogle-xp-chromium-extension.crx"), `
  (Join-Path $dist "oldoogle-xp-chromium-extension.pem"), `
  (Join-Path $dist "oldoogle-xp-firefox-extension.xpi"), `
  (Join-Path $dist "oldoogle-xp-firefox-extension.zip")

Compress-Archive -Path (Join-Path $root "extensions\chromium\*") -DestinationPath $chromiumZip
Compress-Archive -Path (Join-Path $root "extensions\firefox\*") -DestinationPath $firefoxZip
Move-Item -Path $firefoxZip -Destination $firefoxXpi

Write-Host "Wrote $chromiumZip"
Write-Host "Wrote $firefoxXpi"
