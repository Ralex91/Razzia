# Configuration

The configuration lives in the `config` folder (mounted as a Docker volume, or `../../config` relative to the packages when running without Docker).

## Game Configuration (`config/game.json`)

Main game settings:

```json
{
  "managerPassword": "PASSWORD"
}
```

Options:

- `managerPassword`: The master password for accessing the manager interface. **Must be changed from the default `"PASSWORD"` value**, otherwise manager access is blocked.

See also: [Quiz Configuration](quiz.md) and [Custom Branding](branding.md), also stored in the `config` folder.

## Media Storage (`media` folder)

Uploaded question media is stored in a dedicated `media` folder, mounted as its own Docker volume (`./media:/app/media`) and kept separate from `config`. It persists across restarts and updates and can be backed up on its own. Uploads accept images (PNG, JPEG, WebP, GIF) and audio (MP3, OGG, WAV) up to 20 MB each; video is not uploadable and is attached by external URL instead.

The volume is a single flat, unmanaged store shared across all quizzes — files are never deduplicated and deleting a quiz never deletes its media, so with audio now allowed (larger files than images) plan for the folder to grow and prune it manually if needed.
