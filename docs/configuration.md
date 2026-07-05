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
