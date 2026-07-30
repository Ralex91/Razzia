# ---- BASE ----
# Pin ONE Node major for both build and run so the native better-sqlite3
# binary compiled in the builder matches the ABI of the runner.
FROM node:22-alpine AS base
RUN npm install -g pnpm
# Toolchain required to compile the native better-sqlite3 addon on Alpine (musl).
RUN apk add --no-cache python3 make g++

# ---- BUILDER ----
FROM base AS builder
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/web/package.json ./packages/web/
COPY packages/socket/package.json ./packages/socket/

# --frozen-lockfile + the pnpm.onlyBuiltDependencies allowlist in package.json
# ensures better-sqlite3's native binary is actually compiled here.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Produce a self-contained production node_modules for the socket package.
# esbuild externalizes better-sqlite3 + fastify, so they (and their deps,
# including the compiled native binary) must ship with the runtime.
RUN pnpm --filter @razzia/socket deploy --prod --legacy /app/socket-deploy

# ---- RUNNER ----
# Same Node major as the builder -> native ABI matches.
FROM node:22-alpine AS runner
RUN apk add --no-cache nginx supervisor

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

# Web static assets
COPY --from=builder /app/packages/web/dist /app/web

# Socket bundle + its production node_modules (better-sqlite3 native, fastify, ...)
COPY --from=builder /app/packages/socket/dist/index.cjs /app/socket/index.cjs
COPY --from=builder /app/socket-deploy/node_modules /app/socket/node_modules

EXPOSE 3000

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
