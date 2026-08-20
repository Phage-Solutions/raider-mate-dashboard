# syntax=docker/dockerfile:1

# The dashboard is a node process serving Astro's standalone build, with Caddy in front
# of it for headers and compression. Both live in this one image: a Scaleway Serverless
# Container is a single container on a single port. See Caddyfile and docker-entrypoint.sh.

FROM node:26-alpine AS build

WORKDIR /src

# Dependencies change far less often than pages do, so the install is its own layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# A second install, production only, because the runtime stage needs astro's server
# runtime but none of the toolchain that produced the build.
FROM node:26-alpine AS deps

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:26-alpine

# Caddy comes from its own image rather than from apk: one pinned binary, and no package
# manager left behind in the layer that faces the internet.
COPY --from=caddy:2.11.4-alpine /usr/bin/caddy /usr/bin/caddy

WORKDIR /app

COPY --from=deps /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist
COPY package.json ./
COPY Caddyfile /etc/caddy/Caddyfile
COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production

# Loopback, not 0.0.0.0: the only thing that should reach the node process is the Caddy
# in this same container.
ENV HOST=127.0.0.1
ENV PORT=4321

# Caddy resolves a home directory at startup and a numeric user has none. It writes
# nothing with auto_https and persist_config off, but it still looks.
ENV XDG_CONFIG_HOME=/tmp
ENV XDG_DATA_HOME=/tmp

# Numeric, not a name: a Kubernetes runAsNonRoot check reads the image's USER field and
# cannot resolve a name against the image's passwd file.
USER 65532:65532

# Above 1024, so dropping every capability including NET_BIND_SERVICE still leaves the
# listener able to bind.
EXPOSE 8080

# The secrets are read at runtime rather than baked in, which is why astro.config.mjs
# declares every environment variable as a secret even the ones that are only URLs.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
