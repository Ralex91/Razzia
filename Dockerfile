# ---- BASE ----
FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS base
RUN npm install -g pnpm

# ---- BUILDER ----
FROM base AS builder
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/web/package.json ./packages/web/
COPY packages/socket/package.json ./packages/socket/
COPY packages/e2e/package.json ./packages/e2e/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ---- RUNNER ----
FROM cgr.dev/chainguard/wolfi-base@sha256:28c39be5a5e1e9b85081c10740e8495f6518a865b23bc6a486637c4b21e74b43 AS runner

RUN apk upgrade --no-cache && apk add --no-cache nginx-mainline nodejs-26 s6 su-exec \
    && mkdir -p /run/nginx /var/lib/nginx/tmp /var/log/nginx

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --chmod=755 docker/s6 /etc/s6

COPY --from=builder /app/packages/web/dist /app/web
COPY --from=builder /app/packages/socket/dist/index.cjs /app/socket/index.cjs

EXPOSE 3000

CMD ["s6-svscan", "/etc/s6"]
