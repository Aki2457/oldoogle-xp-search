# Self Hosting

Oldoodle can be self-hosted with Docker.

## Docker Compose

```sh
docker compose up -d --build
```

Then open:

```text
http://localhost:8080/api/health
```

## Docker Run

```sh
docker run -p 8080:8080 ghcr.io/aki2457/oldoodle:latest
```

## Environment Variables

Useful optional settings:

```env
PORT=8080
SEARCH_PROVIDER=duckduckgo
SEARCH_TIMEOUT_MS=5000
APIFY_TOKEN=your_apify_token_here
APIFY_ACTOR_ID=apify/google-search-scraper
```

The default provider works without an Apify token.
