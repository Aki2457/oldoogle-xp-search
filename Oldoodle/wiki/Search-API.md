# Search API

The hosted API is:

```text
http://43.133.207.10:30566
```

## Health

```text
GET /api/health
```

Example:

```text
http://43.133.207.10:30566/api/health
```

## JSON Search

```text
GET /api/search.json?q=windows+xp
```

Example:

```text
http://43.133.207.10:30566/api/search.json?q=old%20google
```

## Live Search Stream

```text
GET /api/search?q=windows+xp
```

The live stream emits:

- `status`
- `results`
- `done`

## Result Shape

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
