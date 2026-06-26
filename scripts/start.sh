#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../server"
exec java -Xms2G -Xmx6G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -jar paper.jar --nogui
