# Reverse Proxy

Razzia's container serves everything on a single port (`3000`): static assets, the manager UI, and a WebSocket endpoint at `/ws` (used by [Socket.IO](https://socket.io/)) which is proxied internally to the socket server.

If you put Razzia behind your own reverse proxy (to add a domain name, HTTPS, or run several apps on one host), the only requirement is that the proxy forwards **WebSocket upgrade requests** through to the container. Without this, the app loads but never connects (players stay stuck on "connecting").

> **Single instance only**: game state is kept in memory by the socket server, so you can only run **one** Razzia container/replica at a time. Do not load-balance across multiple instances.

In all examples below, `razzia` resolves to wherever the container is reachable (e.g. `localhost:3000`, or a Docker Compose service name on the same network).

These are basic configs to get you started, adjust them (HTTPS, auth, etc.) to fit your own setup.

## Nginx

```nginx
server {
    listen 80;
    server_name quiz.example.com;

    location / {
        proxy_pass http://razzia:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip; # only set if this nginx sits behind Cloudflare: real visitor IP from Cloudflare's edge
        proxy_read_timeout 3600s;
    }
}
```

The `Upgrade`/`Connection` headers and the longer `proxy_read_timeout` are what keep the `/ws` WebSocket connection alive — the rest of the config is a standard reverse proxy.

## Traefik

Traefik proxies WebSocket upgrades automatically — no extra config needed. Example using Docker labels:

```yaml
services:
  razzia:
    image: ralex91/razzia:latest
    volumes:
      - ./config:/app/config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.razzia.rule=Host(`quiz.example.com`)"
      - "traefik.http.routers.razzia.entrypoints=web"
      - "traefik.http.services.razzia.loadbalancer.server.port=3000"
    networks:
      - traefik
```

## Caddy

Caddy detects and proxies WebSocket upgrades automatically with a plain `reverse_proxy`:

```caddyfile
quiz.example.com {
    reverse_proxy razzia:3000
}
```

## Other proxies

Any reverse proxy works as long as it:

- Forwards all paths (`/`, `/branding/`, `/ws`) to the container's port `3000`
- Passes through `Upgrade` and `Connection` headers for WebSocket upgrades on `/ws`
- Uses a generous read/idle timeout (players stay connected for the whole game, potentially longer than a default 60s timeout)
