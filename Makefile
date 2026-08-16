.PHONY: dev build check test lint format run up down

# astro dev and astro build read .env themselves through Vite. The include is here for
# the targets that run the built server, which is a plain node process and does not.
ifneq (,$(wildcard .env))
include .env
export
endif

dev:
	npm run dev

build:
	npm run build

check:
	npm run check

test:
	npm run test

lint:
	npm run lint

format:
	npm run format

# Serve the production build. Same entrypoint the container runs.
run:
	@test -n "$(SESSION_SECRET)" || { echo "SESSION_SECRET is not set; cp .env.example .env"; exit 1; }
	node ./dist/server/entry.mjs

up:
	docker compose up -d --build

down:
	docker compose down
