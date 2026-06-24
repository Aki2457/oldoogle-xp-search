$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$chromiumZip = Join-Path $dist "oldoodle-xp-chromium-extension.zip"
$firefoxXpi = Join-Path $dist "oldoodle-xp-firefox-extension.xpi"
$firefoxZip = Join-Path $dist "oldoodle-xp-firefox-extension.zip"

New-Item -ItemType Directory -Force -Path $dist | Out-Null
Remove-Item -Force -ErrorAction SilentlyContinue $chromiumZip, $firefoxXpi, $firefoxZip

Compress-Archive -Path (Join-Path $root "extensions\chromium\*") -DestinationPath $chromiumZip
Compress-Archive -Path (Join-Path $root "extensions\firefox\*") -DestinationPath $firefoxZip
Move-Item -Path $firefoxZip -Destination $firefoxXpi

Write-Host "Wrote $chromiumZip"
Write-Host "Wrote $firefoxXpi"
