# Oldoodle Workspace

This repository is organized as a workspace. The Oldoodle app lives in:

```text
Oldoodle/
```

## Oldoodle

Oldoodle is a Windows XP / old Google styled search app with:

- Web UI
- Search API
- Chrome and Firefox extension source
- GitHub Pages deployment
- Docker images for web, API, and full app builds

Run locally:

```sh
cd Oldoodle
npm install
npm start
```

Local web interface:

```text
http://localhost:3000
```

## Docker Images

```sh
docker pull ghcr.io/aki2457/oldoodle:web
docker pull ghcr.io/aki2457/oldoodle:search-api
docker pull ghcr.io/aki2457/oldoodle:full
```

Named images are also published:

```text
ghcr.io/aki2457/oldoodle-web:latest
ghcr.io/aki2457/oldoodle-search-api:latest
ghcr.io/aki2457/oldoodle-full:latest
```

## Split Refs

Branches and tags:

```text
oldoodle-web
oldoodle-search-api
oldoodle-full
```

See `Oldoodle/README.md` for the full project guide.
