# Oldoodle Search Self-Hosting

The search server is a small Node/Express service that returns Oldoodle-ready search data.

## Docker Compose

```sh
docker compose up -d --build
```

Open:

```text
http://localhost:8080/api/health
http://localhost:8080/api/search.json?q=windows+xp
http://localhost:8080/api/search?q=windows+xp
```

## GitHub Container Registry

The workflow at `.github/workflows/docker-image.yml` builds and publishes:

```text
ghcr.io/aki2457/oldoodle-search-engine:latest
```

Run the published image:

```sh
docker run -p 8080:8080 ghcr.io/aki2457/oldoodle-search-engine:latest
```

## Speed Test Website

Open `speed-test/index.html` in a browser and point it at any deployed Oldoodle search endpoint, for example:

```text
http://43.133.207.10:30566
```

It tests `/api/search.json`, records average/best latency, and shows a sample payload.
