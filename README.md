<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
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
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
# Minecraft Server Bootstrap

Production-oriented Paper 1.21.x server scaffold for Java and Bedrock players at `43.133.207.10`.

## Connection Details

- Java Edition: `43.133.207.10:25565`
- Bedrock Edition: `43.133.207.10`, port `19132` UDP

## Installed / Managed Software

Run `scripts/bootstrap_minecraft_server.py` to download the latest stable Paper `1.21.x` build and the plugin jars. The script records exact versions in `server/install-manifest.json` after a successful install.

| Component | Source preference | Purpose |
| --- | --- | --- |
| Paper 1.21.x | PaperMC stable downloads API | High-performance plugin server |
| Geyser | Modrinth | Allows Bedrock clients to join |
| Floodgate | Modrinth | Allows Bedrock users without Java accounts |
| ViaVersion | Modrinth | Newer client compatibility |
| ViaBackwards | Modrinth | Older client compatibility |
| LuckPerms | Modrinth | Permissions/groups |
| EssentialsX | Modrinth | Spawn, homes, teleport, warps |
| spark | Modrinth | Performance profiling |
| Chunky | Modrinth | World pre-generation |
| BlueMap | Modrinth | Web map |
| GSit | Modrinth | Cosmetic sitting/poses |
| TAB | Modrinth or official fallback | Tab list/scoreboard management |
| Plan | Modrinth | Player analytics |

## Quick Start

```bash
python3 scripts/bootstrap_minecraft_server.py
scripts/start.sh
```

The bootstrap script writes `eula=true`, downloads server/plugin jars when network policy allows it, and performs an initial Paper launch to generate remaining runtime configuration files.

## Required Networking

Open only the public game ports:

```bash
sudo ufw allow 25565/tcp
sudo ufw allow 19132/udp
sudo ufw status verbose
```

Do not expose Java debug ports, RCON, query, BlueMap, or Plan publicly unless you intentionally reverse-proxy and authenticate them.

## Geyser and Floodgate

The bundled Geyser config listens on `0.0.0.0:19132/udp` and forwards to the local Paper listener at `127.0.0.1:25565`. It uses `auth-type: floodgate`, so Bedrock players can join through Floodgate while `server.properties` keeps `online-mode=true` for normal Java authentication.

## LuckPerms Groups

Baseline YAML group files are included for:

- `admin`
- `moderator`
- `member` (default)

After the first successful server start, verify/import with LuckPerms commands as needed:

```text
/lp creategroup admin
/lp creategroup moderator
/lp creategroup member
/lp setdefaultgroup member
```

Grant permissions deliberately. Keep dangerous EssentialsX commands restricted to staff.

## EssentialsX

The baseline config enables safe teleports with cooldowns. Useful permissions to grant through LuckPerms:

```text
essentials.spawn
essentials.sethome
essentials.home
essentials.tpa
essentials.tpaccept
essentials.warp
essentials.warps.*
```

Protect destructive/admin commands such as `/stop`, `/sudo`, `/killall`, `/eco`, `/gamemode`, and unrestricted teleport permissions.

## Upgrade Instructions

1. Stop the server cleanly: `stop` in console or `systemctl stop minecraft-paper`.
2. Run `scripts/backup.sh` and copy the archive off-host.
3. Run `python3 scripts/bootstrap_minecraft_server.py` to refresh Paper and plugin jars.
4. Read `server/install-manifest.json` and plugin release notes.
5. Start the server and review `server/logs/latest.log` for startup errors, deprecated APIs, duplicate libraries, and plugin incompatibilities.
6. Join from Java and Bedrock clients before announcing the upgrade complete.

Never downgrade a world after opening it on a newer Minecraft version.

## Backup Instructions

Run:

```bash
scripts/backup.sh
```

For production, schedule backups with cron or a systemd timer, store copies off-host, and periodically test restore into a separate staging directory.

## Systemd Installation

The sample unit assumes files are deployed to `/opt/minecraft` and a locked-down `minecraft` user exists:

```bash
sudo useradd --system --home /opt/minecraft --shell /usr/sbin/nologin minecraft
sudo rsync -a ./ /opt/minecraft/
sudo chown -R minecraft:minecraft /opt/minecraft
sudo cp minecraft-paper.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now minecraft-paper
```

## Validation Checklist

- Java joins `43.133.207.10:25565`.
- Bedrock joins `43.133.207.10:19132`.
- Floodgate users receive Bedrock-prefixed usernames and do not need Java accounts.
- Java `online-mode=true` remains enabled.
- Geyser reports healthy startup and binds UDP port `19132`.
- No startup errors or plugin conflicts appear in `server/logs/latest.log`.
- TPS remains close to 20 under normal load; use `spark profiler` for diagnostics.
- No RCON, query, debug, BlueMap, or Plan web ports are publicly exposed unintentionally.

## Troubleshooting

- **Bedrock cannot connect:** verify UDP `19132` is allowed by cloud firewall and UFW, then confirm Geyser bound to `0.0.0.0:19132`.
- **Floodgate login fails:** ensure Geyser `remote.auth-type` is `floodgate` and Floodgate generated/read its key correctly.
- **Java auth problems:** verify `server/server.properties` still contains `online-mode=true` and `enforce-secure-profile=true`.
- **Lag:** lower `view-distance`, lower `simulation-distance`, pre-generate world chunks with Chunky, and profile with spark.
- **Plugin incompatibility:** remove the most recently updated plugin, restart, and check release notes for the current Paper build.
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
