#!/usr/bin/env python3
"""Bootstrap a production Paper server with Java+Bedrock support.

Downloads Paper from PaperMC's stable downloads API and plugins from Modrinth
when available, falling back to official project APIs/sites only for projects
that are not published on Modrinth. Run from the repository root.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "server"
PLUGINS = SERVER / "plugins"
IP = "43.133.207.10"
JAVA_PORT = 25565
BEDROCK_PORT = 19132
USER_AGENT = "Codex-Env Minecraft bootstrap/1.0 (admin@example.invalid)"
TARGET_VERSION_PREFIX = "1.21."

OFFICIAL_FALLBACKS = {
    "geyser": "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot",
    "floodgate": "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot",
    "tab-was-taken": "https://github.com/NEZNAMY/TAB/releases/latest/download/TAB.v5.2.1.jar",
}

MODRINTH_PLUGINS = [
    ("geyser", "Geyser-Spigot"),
    ("floodgate", "floodgate-spigot"),
    ("viaversion", "ViaVersion"),
    ("viabackwards", "ViaBackwards"),
    ("luckperms", "LuckPerms"),
    ("essentialsx", "EssentialsX"),
    ("spark", "spark"),
    ("chunky", "Chunky"),
    ("bluemap", "BlueMap"),
    ("gsit", "GSit"),
    ("tab-was-taken", "TAB"),
    ("plan", "Plan"),
]


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=45) as res:
        return json.load(res)


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as res, tmp.open("wb") as fh:
        shutil.copyfileobj(res, fh)
    tmp.replace(dest)


def latest_stable_paper() -> tuple[str, str]:
    # PaperMC recommends the fill v3 API for stable builds.
    project = fetch_json("https://fill.papermc.io/v3/projects/paper")
    versions = sorted(
        [v for group in project["versions"].values() for v in group if v.startswith(TARGET_VERSION_PREFIX)],
        key=lambda s: [int(p) for p in s.split(".")],
        reverse=True,
    )
    for version in versions:
        builds = fetch_json(f"https://fill.papermc.io/v3/projects/paper/versions/{version}/builds")
        for build in builds:
            if build.get("channel") == "STABLE":
                return version, build["downloads"]["server:default"]["url"]
    raise RuntimeError("No stable Paper 1.21.x build found")


def latest_modrinth_plugin(slug: str) -> tuple[str, str, str]:
    url = "https://api.modrinth.com/v2/project/{}/version?loaders=[%22paper%22,%22spigot%22,%22bukkit%22]&game_versions=[%221.21.10%22,%221.21.9%22,%221.21.8%22,%221.21.7%22,%221.21.6%22,%221.21.5%22,%221.21.4%22,%221.21.3%22,%221.21.2%22,%221.21.1%22,%221.21%22]".format(slug)
    versions = fetch_json(url)
    if not versions:
        versions = fetch_json(f"https://api.modrinth.com/v2/project/{slug}/version")
    for version in versions:
        if version.get("version_type") not in ("release", None):
            continue
        for file in version.get("files", []):
            if file.get("primary") and file.get("filename", "").endswith(".jar"):
                return version["version_number"], file["filename"], file["url"]
        for file in version.get("files", []):
            if file.get("filename", "").endswith(".jar"):
                return version["version_number"], file["filename"], file["url"]
    raise RuntimeError(f"No jar release found on Modrinth for {slug}")


def write_configs() -> None:
    SERVER.mkdir(exist_ok=True)
    PLUGINS.mkdir(exist_ok=True)
    (SERVER / "eula.txt").write_text("eula=true\n", encoding="utf-8")
    (SERVER / "server.properties").write_text(f"""# Production Paper server - Java stays authenticated.
online-mode=true
enforce-secure-profile=true
server-ip=
server-port={JAVA_PORT}
motd=Production Paper 1.21.x - Java and Bedrock
max-players=50
view-distance=8
simulation-distance=6
sync-chunk-writes=false
enable-command-block=false
enable-query=false
enable-rcon=false
white-list=false
spawn-protection=16
""", encoding="utf-8")
    (SERVER / "paper-global.yml").write_text("""# Minimal safe global Paper tuning; keep gameplay vanilla.
chunk-system:
  gen-parallelism: default
misc:
  use-alternative-luck-formula: false
unsupported-settings:
  allow-headless-pistons: false
  allow-permanent-block-break-exploits: false
  allow-piston-duplication: false
  allow-tripwire-disarming-exploits: false
""", encoding="utf-8")
    (SERVER / "paper-world-defaults.yml").write_text("""# Conservative optimizations that do not intentionally change gameplay.
chunks:
  auto-save-interval: default
collisions:
  max-entity-collisions: 8
entities:
  spawning:
    despawn-ranges:
      ambient:
        hard: 32
        soft: 16
      monster:
        hard: 128
        soft: 32
hopper:
  cooldown-when-full: true
  disable-move-event: false
""", encoding="utf-8")
    geyser = PLUGINS / "Geyser-Spigot"
    geyser.mkdir(exist_ok=True)
    (geyser / "config.yml").write_text(f"""bedrock:
  address: 0.0.0.0
  port: {BEDROCK_PORT}
  clone-remote-port: false
remote:
  address: 127.0.0.1
  port: {JAVA_PORT}
  auth-type: floodgate
floodgate-key-file: key.pem
command-suggestions: true
passthrough-motd: true
passthrough-player-counts: true
""", encoding="utf-8")
    floodgate = PLUGINS / "floodgate"
    floodgate.mkdir(exist_ok=True)
    (floodgate / "config.yml").write_text("""username-prefix: .
replace-spaces: true
send-floodgate-data: true
disconnect:
  invalid-key: Please connect through the configured Geyser listener.
""", encoding="utf-8")
    luck = PLUGINS / "LuckPerms" / "yaml-storage" / "groups"
    luck.mkdir(parents=True, exist_ok=True)
    for name, weight, default in [("admin",100,False),("moderator",50,False),("member",10,True)]:
        (luck / f"{name}.yml").write_text(f"name: {name}\npermissions: []\nparents: []\nmeta:\n- weight.{weight}\ndefault: {str(default).lower()}\n", encoding="utf-8")
    ess = PLUGINS / "Essentials"
    ess.mkdir(exist_ok=True)
    (ess / "config.yml").write_text("""# EssentialsX baseline. Grant permissions with LuckPerms.
spawn-on-join: false
sethome-multiple:
  default: 3
teleport-safety: true
teleport-cooldown: 3
teleport-delay: 3
""", encoding="utf-8")


def main() -> int:
    write_configs()
    manifest = {"server_ip": IP, "java_port": JAVA_PORT, "bedrock_port": BEDROCK_PORT, "plugins": []}
    try:
        version, paper_url = latest_stable_paper()
        download(paper_url, SERVER / "paper.jar")
        manifest["paper_version"] = version
        manifest["paper_url"] = paper_url
    except Exception as exc:
        print(f"WARNING: Paper download failed: {exc}", file=sys.stderr)
    for slug, display in MODRINTH_PLUGINS:
        try:
            version, filename, url = latest_modrinth_plugin(slug)
            download(url, PLUGINS / filename)
            manifest["plugins"].append({"name": display, "version": version, "source": "Modrinth", "url": url})
        except Exception as exc:
            fallback = OFFICIAL_FALLBACKS.get(slug)
            if fallback:
                try:
                    filename = f"{display}.jar"
                    download(fallback, PLUGINS / filename)
                    manifest["plugins"].append({"name": display, "version": "latest", "source": "official fallback", "url": fallback})
                    continue
                except Exception as fallback_exc:
                    manifest["plugins"].append({"name": display, "source": "manual/official", "error": f"Modrinth: {exc}; official fallback: {fallback_exc}"})
                    print(f"WARNING: {display} download failed: Modrinth: {exc}; official fallback: {fallback_exc}", file=sys.stderr)
                    continue
            manifest["plugins"].append({"name": display, "source": "manual/official", "error": str(exc)})
            print(f"WARNING: {display} download failed: {exc}", file=sys.stderr)
    (SERVER / "install-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    if (SERVER / "paper.jar").exists():
        subprocess.run(["java", "-Xms1G", "-Xmx1G", "-jar", "paper.jar", "--nogui"], cwd=SERVER, input=b"stop\n", timeout=120, check=False)
    print("Bootstrap complete. Review server/install-manifest.json and run scripts/start.sh")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
