# Custom Branding

Optional, lives in `config/branding/` (alongside `config/game.json`, see [Configuration](configuration.md)).

You can fully rebrand the app **without touching the code** by dropping files into a `config/branding/` folder. If it is absent, the default look is used.

Create `config/branding/theme.json`:

```json
{
  "appName": "My Quiz",
  "colors": { "primary": "#ff9900", "secondary": "#1a140b" },
  "answerColors": ["#e69f00", "#56b4e9", "#3dbfa0", "#cc79a7"],
  "font": {
    "family": "Rubik",
    "url": "https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&display=swap"
  },
  "logo": "/branding/logo.svg",
  "favicon": "/branding/favicon.svg",
  "background": "/branding/background.png"
}
```

All fields are optional: anything you omit keeps its default value.

- `appName`: app name + browser tab title
- `colors`: CSS color tokens (at least `primary` and `secondary`)
- `answerColors`: up to 4 answer-button colors
- `font`: a font family + an optional stylesheet URL (e.g. Google Fonts)
- `logo` / `favicon` / `background`: drop the files in `config/branding/` and reference them here
