# The dashboard is a single node process serving Astro's standalone build. Caddy sits
# in front of it for TLS; see Caddyfile.

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

WORKDIR /app

COPY --from=deps /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist
COPY package.json ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Numeric, not a name: a Kubernetes runAsNonRoot check reads the image's USER field and
# cannot resolve a name against the image's passwd file.
USER 65532:65532

# Above 1024, so dropping every capability including NET_BIND_SERVICE still leaves the
# listener able to bind.
EXPOSE 4321

# The secrets are read at runtime rather than baked in, which is why astro.config.mjs
# declares every environment variable as a secret even the ones that are only URLs.
CMD ["node", "./dist/server/entry.mjs"]
