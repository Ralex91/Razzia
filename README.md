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

## ⚙️ Prerequisites

Choose one of the following deployment methods:

### Without Docker

- Node.js : version 24 or higher
- PNPM : version 10.16 or higher (learn more [here](https://pnpm.io/))

### With Docker

- Docker and Docker Compose

## 📖 Getting Started

Choose your deployment method:

### 🐳 Using Docker (Recommended)

Using Docker Compose (recommended):
You can find the docker compose configuration in the repository:
[docker-compose.yml](/compose.yml)

Create a `.env` next to it with your manager password (see Configuration below), then:

```bash
docker compose up -d
```

Or using Docker directly:

```bash
docker run -d \
  -p 3000:3000 \
  -e MANAGER_PASSWORD=your-password \
  -v ./config:/app/config \
  ralex91/razzia:latest
```

The image is also published on the GitHub Container Registry, if you prefer using it instead of Docker Hub:

```bash
docker run -d \
  -p 3000:3000 \
  -e MANAGER_PASSWORD=your-password \
  -v ./config:/app/config \
  ghcr.io/ralex91/razzia:latest
```

**Configuration Volume:**
The `-v ./config:/app/config` option mounts a local `config` folder to persist your quizzes and results. This allows you to:

- Edit your quizzes directly on your host machine
- Keep your content when updating the container
- Easily backup your quizzes and game results

The folder will be created automatically on first run with an example quiz to get you started.

The application will be available at http://localhost:3000

### 🛠️ Without Docker

1. Clone the repository:

```bash
git clone https://github.com/Ralex91/Razzia.git
cd ./Razzia
```

2. Install dependencies:

```bash
pnpm install
```

3. Set your manager password:

```bash
cp .env.example .env
```

4. Build and start the application:

```bash
# Development mode
pnpm dev

# Production mode
pnpm build
pnpm start
```

## ⚙️ Configuration

**⚠️ Required:** set a manager password before going live. Copy `.env.example` to `.env`:

```bash
MANAGER_PASSWORD=your-password
JWT_SECRET=
```

Manager access stays blocked until `MANAGER_PASSWORD` is set. `JWT_SECRET` is optional: left empty, a new secret is generated at every start, which logs managers out on each restart — harmless, since running games are lost on a restart anyway.

With Docker, `compose.yml` reads the same `.env` through `env_file`.

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
