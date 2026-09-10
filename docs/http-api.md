# HTTP API

Everything that touches the filesystem or decides who you are is served over HTTP under `/api`, on the same port as the WebSocket. Only live game state stays on the socket ([WebSocket protocol](websocket-protocol.md)).

> Rule of thumb: **touches the filesystem or decides who you are → HTTP. Touches the in-memory registry of a running game → WebSocket.**

> This API is internal and not version-stabilized. It can change between releases without a deprecation period.

## Error contract

The server never sends prose. Every error body is:

```json
{ "error": "errors:quizz.notFound" }
```

The value is an i18n translation key (the web UI feeds it straight to `t()`), so treat it as a symbolic error code. Validation failures return the key of the first failing rule, e.g. `errors:quizz.subjectEmpty`.

This holds for **every** response the server can produce, including the ones no route handles:

| Situation                           | Status | Key                      |
| ----------------------------------- | ------ | ------------------------ |
| Unknown path or method              | `404`  | `errors:api.notFound`    |
| Unparseable or missing request body | `400`  | `errors:invalidRequest`  |
| Unexpected server-side failure      | `500`  | `errors:api.serverError` |

The one bodyless response is `204 No Content`, returned by the `DELETE` routes — that is what the status means.

## Authentication

Identity is a **JWT signed by the server** (see [`JWT_SECRET`](configuration.md)). Two roles exist: `player` (30-day tokens) and `manager` (12-hour tokens).

Authenticated routes expect the token as a bearer:

```
Authorization: Bearer <token>
```

### `POST /api/auth/session`

Body `{ "token"?: string }` (an empty or absent body is fine). Always answers `200` with:

```json
{ "token": "…", "clientId": "…", "role": "player", "expiresAt": 1789017512 }
```

| Input                    | Behaviour                                                     |
| ------------------------ | ------------------------------------------------------------- |
| none / unparseable       | mints a fresh `clientId`, role `player`                       |
| valid, unexpired         | returned **as-is** — idempotent, keeps an active manager role |
| valid signature, expired | re-minted **keeping `clientId`**, role forced to `player`     |
| bad signature            | mints a fresh session (the secret was rotated)                |

Keeping `clientId` on expiry is what preserves a player's seat across a refresh; forcing `player` is what downgrades a stale manager.

### `POST /api/auth/manager`

Body `{ "password": string }`. Upgrades the caller's session to `manager`, keeping the same `clientId` when a bearer is sent. Returns the same shape as `/api/auth/session`.

- `401 errors:manager.invalidPassword` — wrong password
- `403 errors:manager.passwordNotConfigured` — `MANAGER_PASSWORD` is not set

There is **no rate limit**, matching the previous socket behaviour.

### `POST /api/auth/logout`

Bearer required. Mints a fresh `player` token for the same `clientId` and returns it.

Logout is **stateless**: the old manager token stays cryptographically valid until it expires. The 12-hour manager TTL is the mitigation.

## Manager routes

All of these require a bearer whose role is `manager`, and answer `401 errors:auth.unauthorized` otherwise.

| Route                     | Success                            | Errors                       |
| ------------------------- | ---------------------------------- | ---------------------------- |
| `GET /api/quizz`          | `200 { quizz: [{ id, subject }] }` | —                            |
| `GET /api/quizz/:id`      | `200` the full quiz                | `404 errors:quizz.notFound`  |
| `POST /api/quizz`         | `201 { id }`                       | `400` validation key         |
| `PATCH /api/quizz/:id`    | `200 { id }`                       | `400` validation key, `404`  |
| `DELETE /api/quizz/:id`   | `204`                              | `404 errors:quizz.notFound`  |
| `GET /api/results`        | `200 { results: [meta] }`          | —                            |
| `GET /api/results/:id`    | `200` the full result              | `404 errors:result.notFound` |
| `DELETE /api/results/:id` | `204`                              | `404 errors:result.notFound` |
| `POST /api/games`         | `201 { gameId, inviteCode }`       | `404 errors:quizz.notFound`  |

The quiz body is validated against the same schema as the files in `config/quizz` — see [Quiz](quiz.md).

`POST /api/games` creates the game but binds no socket to it: the manager enters the room by emitting `manager:reconnect { gameId }`. A game nobody connects to expires after ~5 minutes, like an abandoned one.

## Public routes

| Route                   | Success                  | Notes                                       |
| ----------------------- | ------------------------ | ------------------------------------------- |
| `GET /api/health`       | `200 { status: "ok" }`   | Liveness probe                              |
| `POST /api/games/check` | `200 { valid: boolean }` | Checks a 6-digit invite code before joining |

Body `{ "inviteCode": string }`. It is a `POST` rather than a `GET` on purpose: the invite code is a room key, and a body keeps it out of access logs, browser history and `Referer` headers — and out of proxy caches, which matters because the answer changes as games start and end.

### `POST /api/games/join`

Any signed session (bearer required, no role). Body `{ "inviteCode": string, "username": string }`, answers `200 { gameId, ticket }`.

The **ticket** is a 5-minute JWT with claims `{ sub, gameId, username }`, signed with the same secret. It carries the _right_ to a seat; the seat itself is only created when the socket presents it through `player:login { ticket }` — which is what keeps `player.id === socket.id` true at all times server-side.

`ticket` is `null` when this client already holds a seat: reconnect with `player:reconnect { gameId }` instead.

- `404 errors:game.notFound` — unknown invite code
- `403 errors:game.managerCannotJoin` — you are this game's manager
- `400` — invalid username, with the validation key

> `POST /api/games/check` makes the 6-digit PIN space (10⁶) cheaply enumerable, as it already was over the socket. Keeping the code out of the URL does not change that — it only stops it leaking passively into logs and caches. Worth knowing if you expose Razzia to the open internet.

## Reverse proxies

`/api` must be forwarded to the container like `/` and `/ws` — see [Reverse Proxy](reverse-proxy.md).
