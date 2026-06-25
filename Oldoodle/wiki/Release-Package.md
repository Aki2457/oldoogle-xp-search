# Release Package

The release bundle is built with:

```sh
npm run release:folder
```

Expected output:

```text
dist/Oldoodle_Release.zip
```

## Bundle Layout

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

## Torrent Note

The torrent file intentionally excludes the `Oldoodle_Torrent/` folder itself. A torrent cannot reliably include itself because changing the torrent changes the payload hash.
