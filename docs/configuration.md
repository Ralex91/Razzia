# Configuration

Razzia is configured in two places:

- **Environment variables** for the manager password and the session secret.
- The **`config` folder** for content: quizzes, results and branding. It is mounted as a Docker volume, or resolved as `../../config` relative to the packages when running without Docker.

## Environment variables

Copy [`.env.example`](../.env.example) to `.env` at the root of the project:

```bash
MANAGER_PASSWORD=your-password
JWT_SECRET=
```

| Variable           | Required | What it does                                                                                                           |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `MANAGER_PASSWORD` | Yes      | Unlocks the manager interface. Until it is set, manager access is refused with `errors:manager.passwordNotConfigured`. |
| `JWT_SECRET`       | No       | Signs session tokens. Must be at least 32 characters; a shorter value is ignored.                                      |
| `WEB_PORT`         | No       | Without Docker only: port the app is served on. Defaults to `3000`.                                                    |
| `SOCKET_PORT`      | No       | Without Docker only: port of the socket server, proxied behind the web port. Defaults to `3001`.                       |
| `PUID`             | No       | Docker only: user ID the app runs as and owner of the `config` folder. Defaults to `1000`.                             |
| `PGID`             | No       | Docker only: group ID the app runs as and group of the `config` folder. Defaults to `1000`.                            |

`pnpm dev` and `pnpm start` load `.env` automatically. With Docker, `compose.yml` reads the same file through `env_file`, or you can set the variables inline with `environment:`. With a bare `docker run`, pass them with `-e MANAGER_PASSWORD=...`.

### About `JWT_SECRET`

Leave it empty and the server generates a new secret at every start. The consequence is that a restart logs every manager out and hands every player a fresh identity.

That is usually fine: game state lives in memory, so a restart already ends every running game — the sessions it invalidates point at games that no longer exist. Set the variable only if you want sessions to survive a restart, and keep it secret: anyone holding it can forge a manager session.

Generate one with either of these:

```bash
openssl rand -hex 32

# No openssl? Node is already a prerequisite:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Both print 64 hexadecimal characters, the same shape the server generates for itself.

### About `PUID` and `PGID`

With Docker, the app does not run as root. It runs with the user and group IDs set by `PUID` and `PGID` (both `1000` by default), and every start gives the `config` folder to that user and group.

If you edit your quizzes from the host and get a `Permission denied`, your host user is not the one the app runs as. Find your IDs:

```bash
id -u   # your user ID, for PUID
id -g   # your group ID, for PGID
```

Set them in your `.env`, then restart the container:

```bash
PUID=1001
PGID=1001
```

```bash
docker compose up -d
```

The container gives the folder back to these IDs on start, so you can edit it again without `sudo`.

If `config` lives on a network share (NFS, SMB) that refuses ownership changes, the app may be unable to write to it. Set `PUID=0` and `PGID=0` to run as root, as before.

## The `config` folder

Created automatically on first run, with an example quiz:

```
config/
  quizz/      your quizzes
  results/    saved game results
  media/      files uploaded from the quiz editor
  branding/   optional theming
```

See [Quiz Configuration](quiz.md) and [Custom Branding](branding.md).
