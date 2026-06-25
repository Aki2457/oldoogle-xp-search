# Oldoodle XP Hackathon Submission Notes

## Team

- Primary member: Akira Oh
- School: Singapore Japanese School (Primary School, Changi Campus)

## Project

**Title:** Oldoodle XP

**One-sentence pitch:** Oldoodle XP is a nostalgic Windows XP-style search experience that helps people explore the web through a fast, self-hostable search backend, browser widgets, and easy release packages.

## Demo Links

- Public website: https://aki2457.github.io/
- Speed test: https://aki2457.github.io/speed-test/
- Search API: http://43.133.207.10:30566/api/health
- Public source repo: https://github.com/Aki2457/oldoodle-search-engine

## What Was Built

- A Windows XP / Internet Explorer styled search app.
- A fast search engine API that returns Oldoodle-ready JSON and Server-Sent Events.
- A GitHub Pages website and speed-test page.
- Chrome/Chromium and Firefox extensions.
- Browser toolbox widgets: Search, Timer, QR maker, Notes, and Speed ping.
- Windows release packaging and package scripts for macOS/Linux builds.
- Docker and Docker Compose self-hosting files.
- A release zip with guides, extension packages, and torrent metadata.
- Streamline icon attribution through a Made Possible With page.

## Data Sources And Rationale

Oldoodle uses lightweight web search data returned through DuckDuckGo HTML search by default. This was chosen because it is fast, avoids requiring users to configure a paid API token, and returns enough public web metadata for search result widgets: title, URL, description, and source/domain type.

Optional Apify support remains available for users who want a more configurable scraping provider.

## Interaction Logs And Collaboration Notes

The project was built through an iterative human-AI workflow:

- Human decisions: visual direction, nostalgia theme, project scope, release requirements, and final approval of what should be shipped.
- AI-assisted implementation: code edits, packaging scripts, extension manifests, Docker setup, release folder generation, documentation drafts, and test commands.
- Human review moments: the user repeatedly redirected the style and feature set, including XP visuals, Start menu behavior, Doodles, widgets, release packaging, GitHub Pages, and Zeabur deployment.
- Public evidence: commit history and this submission note in the GitHub repository.

Relevant public repo sections:

- README.md
- SELF_HOSTING.md
- speed-test/
- extensions/
- Dockerfile
- docker-compose.yml
- .github/workflows/docker-image.yml

## Responsible AI Use

AI was used as a coding and packaging assistant, not as a replacement for project judgment. The user chose the concept, branding direction, priorities, and final feature requests. AI handled repetitive implementation work, code validation, packaging, documentation, and deployment checks.

Human judgment was used for:

- Whether the app should feel like Windows XP / old Google.
- Which widgets were useful.
- What should be public versus private.
- Whether the final behavior matched the project idea.

Responsible-use steps:

- Secrets such as `.env` are ignored by git.
- The search API health response does not expose tokens.
- Browser extensions use narrow host permissions for local/known Oldoodle endpoints.
- Icon attribution is documented and linked.
- The README explains limitations and setup clearly.

## Tech Stack

- Node.js and Express for the search backend.
- HTML, CSS, and JavaScript for the Oldoodle UI, widgets, and speed test.
- DuckDuckGo HTML search as the default fast provider.
- Optional Apify integration for configurable search scraping.
- Docker and Docker Compose for self-hosting.
- GitHub Actions for container image builds.
- GitHub Pages for the public website.
- Browser extension manifests for Chromium and Firefox.
- Python was used for generating explanation artifacts such as PDF, spreadsheet, and presentation summaries.

## PyConSG26 Learning Applied

The project follows hackathon-friendly engineering lessons: build a working vertical slice first, keep deployment simple, make documentation easy for judges and non-technical users, and use AI tools transparently. It also applies a Python-community mindset of open sharing: public repo, clear README, self-hosting instructions, and reproducible release packaging.

## Extra Notes

Oldoodle is intentionally playful, but it also demonstrates practical deployment work: public static website, hosted API, browser extension packaging, Docker self-hosting, release zips, and user-facing documentation.
