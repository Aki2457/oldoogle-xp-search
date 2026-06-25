# Oldoodle XP

Oldoodle XP is a Windows XP / Internet Explorer styled search app with live result widgets, date-based Doodles, a functional Start menu, browser extensions, release packaging, a hosted demo page, a hosted speed-test page, and a fast self-hostable search backend.

## Live Links

- GitHub Pages home: <https://[I have forgot my Github Username].github.io/oldoodle/>
- Speed test website: <https://[I have forgot my Github Username].github.io/oldoodle/speed-test/>
- Public deploy/source repo: <https://github.com/Aki2457/oldoodle>
- Main private/source repo: <https://github.com/Aki2457/oldoodle>
- Latest release zip: <https://github.com/Aki2457/oldoodle/releases/download/v1.0.1/Oldoodle_Release.zip>
- Public wiki contents: <https://github.com/Aki2457/oldoodle/tree/main/wiki>

## What It Includes

- XP-style Oldoodle search interface.
- Fast search backend using DuckDuckGo HTML by default.
- Optional Apify fallback/provider support.
- Oldoodle-compatible Server-Sent Events endpoint.
- JSON endpoint for testing and integrations.
- Doodles: Classic, April Fools, Birthday, Winter, Random.
- Functional XP Start menu.
- Oldoodle Chrome and Oldoodle Firefox extension source folders.
- Windows launcher and Chromium launcher build scripts.
- Release folder/zip builder with torrent metadata.
- GitHub Pages static mini-app.
- Hosted speed-test website.
- Dockerfile, Docker Compose, and GitHub Actions GHCR image build.

## Search API

Health:

```text
GET /api/health
```

JSON search:

```text
GET /api/search.json?q=windows+xp
```

Oldoodle live search stream:

```text
GET /api/search?q=windows+xp
```

The SSE endpoint emits:

```text
status
results
done
```

Result payloads use this shape:

```json
{
  "query": "windows xp",
  "provider": "duckduckgo",
  "count": 10,
  "items": [
    {
      "title": "Example result",
      "url": "https://example.com",
      "description": "Short result snippet.",
      "type": "example.com"
    }
  ]
}
```

## Local Development

Copy the example environment file:

```sh
cp .env.example .env
```

Install dependencies:

```sh
npm install
```

Run locally:

```sh
npm start
```

Open:

```text
http://localhost:3000
```

The app uses `SEARCH_PROVIDER=duckduckgo` by default and does not require an Apify token for fast search.

Optional `.env` values:

```env
PORT=3000
SEARCH_PROVIDER=duckduckgo
SEARCH_TIMEOUT_MS=5000
APIFY_TOKEN=apify_api_demo_replace_me
APIFY_ACTOR_ID=apify/google-search-scraper
OLDOODLE_PUBLIC_SITE=https://[I have forgot my Github Username].github.io/oldoodle/
OLDOODLE_API_BASE=http://localhost:3000

# Demo auto-reply/chat placeholders for future bot work.
AUTOREPLY_ENABLED=false
AUTOREPLY_MODE=demo
AUTOREPLY_FROM_NAME=Oldoodle Codex
AUTOREPLY_FROM_ADDRESS=oldoodle-codex@example.invalid
AUTOREPLY_SUBJECT_PREFIX=Re:
AUTOREPLY_TEXT=Hi! Oldoodle received your message. This is a demo auto-reply, not a real inbox bot yet.

# Demo SMTP placeholders. Do not commit real values.
SMTP_HOST=smtp.example.invalid
SMTP_PORT=587
SMTP_USER=oldoodle-demo@example.invalid
SMTP_PASS=smtp_demo_replace_me

# Optional Discord development bot.
DISCORD_BOT_TOKEN=discord_bot_token_demo_replace_me
DISCORD_SERVER_ID=1367877281552531486
DISCORD_DEV_CHANNEL_ID=1519364758191607839
DISCORD_REPLY_PREFIX=!oldoodle
DISCORD_STATUS_TEXT=developing Oldoodle
```

Use `SEARCH_PROVIDER=apify` if you want Apify as the primary provider.
The checked-in `.env.example` uses fake demo credentials only; keep real keys in a local `.env` or deployment secrets.

## Discord Development Bot

Oldoodle includes an optional Discord dev helper for app-development notes and lightweight auto-replies.

1. Create an app at <https://discord.com/developers/applications>.
2. Add a bot and copy its token into local `.env` as `DISCORD_BOT_TOKEN`.
3. Enable the bot's `MESSAGE CONTENT INTENT` in the Discord Developer Portal.
4. Invite the bot to your server with bot permissions to read and send messages.
5. Use Oldoodle's development server/channel IDs:
   `DISCORD_SERVER_ID=1367877281552531486`
   `DISCORD_DEV_CHANNEL_ID=1519364758191607839`
6. Run:

```sh
npm run discord:bot
```

Then mention the bot, DM it, or use `!oldoodle status`, `!oldoodle search`, or `!oldoodle deploy`.

## Speed Testing

Hosted tester:

```text
https://[I have forgot my Github Username].github.io/oldoodle/speed-test/
```

Default endpoint:

```text
http://localhost:3000
```

The speed tester calls `/api/search.json`, records every run, shows average/best latency, result count, provider, and a sample payload.

You can also open the local tester directly:

```text
speed-test/index.html
```

## Docker Self-Hosting

Build and run with Docker Compose:

```sh
docker compose up -d --build
```

Then test:

```text
http://localhost:8080/api/health
http://localhost:8080/api/search.json?q=windows+xp
http://localhost:8080/api/search?q=windows+xp
```

Run the GitHub Container Registry image:

```sh
docker run -p 8080:8080 ghcr.io/aki2457/oldoodle:latest
```

The Docker image listens on port `8080`.

## GitHub Docker Build

The workflow at:

```text
.github/workflows/docker-image.yml
```

builds and publishes:

```text
ghcr.io/aki2457/oldoodle:latest
```

It runs on pushes to `main` when Docker/server files change, and can also be run manually from GitHub Actions.

## Hosted API Deployment

Oldoodle can run its Node search API on any host that supports Docker or Node.js. The API sets CORS headers, so GitHub Pages and extension builds can call a configured backend from the browser.

## Browser Extensions

Extension source:

```text
extensions/chromium/
extensions/firefox/
```

Package extensions:

```sh
npm run package:extensions
```

Oldoodle Chrome extension behavior:

- Overrides the new tab page.
- Uses the XP Oldoodle page.
- Talks to a local Oldoodle server at `localhost:3000` for live search.

Oldoodle Firefox extension behavior:

- Overrides the new tab page.
- Includes homepage override support.
- May need temporary install through `about:debugging` unless signed by Mozilla.

## Windows Builds

Build the Windows Oldoodle app launcher:

```sh
npm run build:exe
```

Download Chromium and create the Oldoodle Chromium launcher:

```sh
npm run download:chromium
```

Generated artifacts go to:

```text
dist/
```

`dist/` is ignored by git.

## Release Bundle

Create the release folder and zip:

```sh
npm run release:folder
```

Expected output:

```text
dist/Oldoodle_Release.zip
```

The release bundle contains:

```text
Oldoodle/
  Oldoodle_Chromium.exe
  Oldoodle_Extension/
    Oldoodle_Chrome.zip
    Oldoodle_Firefox.xpi
    Oldoodle_Extension_ReadMe.md
  Oldoodle_Torrent/
    Oldoodle_Torrent.md
    Oldoodle_Torrent.torrent
  Oldoodle_ReadMe/
    Oldoodle_Github_Details.md
    Oldoodle_Chrome_Guide.md
    Oldoodle_FireFox_Guide.md
    Oldoodle_App_Guide/
      Oldoodle_App_Setup_Guide.md
      Oldoodle_Update_Guide.md
      Oldoodle_Extension_Update_Guide.md
```

The torrent intentionally excludes the `Oldoodle_Torrent/` folder itself because a torrent file cannot reliably include itself.

## GitHub Pages Site

The public GitHub Pages repo is:

```text
https://github.com/Aki2457/oldoodle
```

The root site serves the Oldoodle XP mini-app:

```text
https://[I have forgot my Github Username].github.io/oldoodle/
```

The speed tester is served at:

```text
https://[I have forgot my Github Username].github.io/oldoodle/speed-test/
```

## Useful Commands

```sh
npm start
npm run build:exe
npm run package:extensions
npm run download:chromium
npm run release:folder
docker compose up -d --build
```

## Notes

- `.env`, `dist/`, and `node_modules/` are intentionally ignored.
- Do not commit real API tokens.
- The fast search path is provider-light and works without Apify.
- Apify remains available as an optional provider or fallback.
- GitHub Pages is static, so live search is handled by the deployed/self-hosted API.
