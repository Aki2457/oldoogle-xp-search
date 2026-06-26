#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/backups"
tar --exclude='server/cache' --exclude='server/logs' -czf "$ROOT/backups/minecraft-$(date -u +%Y%m%dT%H%M%SZ).tar.gz" -C "$ROOT" server
