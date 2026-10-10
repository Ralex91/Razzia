<p align="center">
  <img width="450" height="120" align="center" src=".github/logo.svg">
  <br>
  <div align="center">
    <img alt="Visitor Badge" src="https://api.visitorbadge.io/api/visitors?path=https://github.com/Ralex91/Razzia/edit/main/README.md&countColor=%23FF9900">
    <img src="https://img.shields.io/docker/pulls/ralex91/razzia?style=for-the-badge&color=FF9900" alt="Docker Pulls">
  </div>
</p>

## 🧩 What is this project?

Razzia is a straightforward and open-source quiz platform, allowing users to host it on their own server for smaller events.

> **Disclaimer**: Razzia is an independent, open-source software project. It is not affiliated with, endorsed by, or sponsored by any third-party quiz platform or service. Any resemblance to other quiz platforms is purely incidental.

<p align="center">
  <img width="30%" src=".github/previews/1.png" alt="Login">
  <img width="30%" src=".github/previews/2.png" alt="Manager Room">
  <img width="30%" src=".github/previews/3.png" alt="Question Screen">
</p>

## 📖 Getting Started

### 🐳 Using Docker (Recommended)

Requires Docker and Docker Compose.

> The image is also available on GHCR: `ghcr.io/ralex91/razzia:latest`.

1. Create a `compose.yml`:

```yaml
services:
  razzia:
    image: ralex91/razzia:latest
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config
    env_file:
      - .env
```

2. Create a `.env` next to it:

```bash
MANAGER_PASSWORD=your-password
```

3. Start it:

```bash
docker compose up -d
```

Open http://localhost:3000 to play and http://localhost:3000/manager to host a game.

Your quizzes and results are stored in `./config`, created on first run with an example quiz. Edit them from your host, they persist across updates.

<details>
<summary>Without Compose</summary>

```bash
docker run -d \
  -p 3000:3000 \
  -e MANAGER_PASSWORD=your-password \
  -v ./config:/app/config \
  ralex91/razzia:latest
```

</details>

### 🛠️ Without Docker

Requires Node.js 24+ and [pnpm](https://pnpm.io/) 10.16+.

1. Clone and install:

```bash
git clone https://github.com/Ralex91/Razzia.git
cd Razzia
pnpm install
```

2. Create your `.env` and set `MANAGER_PASSWORD` in it. `WEB_PORT` (default `3000`) and `SOCKET_PORT` (default `3001`) are optional:

```bash
cp .env.example .env
```

3. Build and start:

```bash
pnpm build
pnpm start
```

Open http://localhost:3000 to play and http://localhost:3000/manager to host a game.

> Want to work on the code? See [CONTRIBUTING.md](.github/CONTRIBUTING.md) to run it in development mode.

## 📚 Documentation

- [Configuration](docs/configuration.md): environment variables and the `config` folder.
- [Quiz](docs/quiz.md): creating and structuring quizzes.
- [Branding](docs/branding.md): optional custom theming.
- [Reverse Proxy](docs/reverse-proxy.md): running behind Traefik, Nginx, Caddy, or another reverse proxy.
- [WebSocket Protocol](docs/websocket-protocol.md): build a custom client (e.g. an ESP32 physical buzzer).
- [HTTP API](docs/http-api.md): the `/api` surface — sessions, quiz and result CRUD, game creation.

Full index in [docs/](docs/README.md).

## 🎮 How to Play

1. Access the manager interface at http://localhost:3000/manager
2. Enter the manager password (defined by `MANAGER_PASSWORD`)
3. Share the game URL (http://localhost:3000) and room code with participants
4. Wait for players to join
5. Click the start button to begin the game

## 📝 Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](.github/CONTRIBUTING.md) guide before submitting a pull request.

For bug reports or feature requests, please [create an issue](https://github.com/Ralex91/Razzia/issues).

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Ralex91/Razzia&type=date&logscale=&legend=bottom-right)](https://www.star-history.com/#Ralex91/Razzia&type=date&logscale=&legend=bottom-right)
