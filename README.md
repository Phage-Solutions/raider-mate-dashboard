# raider-mate-dashboard

Web dashboard for [Raider Mate](https://github.com/Phage-Solutions/raider-mate-service),
a WoW raid and Mythic+ signup system built around the fact that raiders play more than
one role.

This repo renders what the service API returns. It holds no schema, no domain logic and
no database access. What it will own that the Discord bot does not is manual comp
editing, where a raid lead hand-builds a roster the assigner then leaves alone.

Licensed AGPLv3. Free to self-host, monetised via a hosted instance.

## Running it

You need a running `raider-mate-service` and a Discord application with a redirect URI
registered.

```
cp .env.example .env    # then fill in the Discord credentials and SESSION_SECRET
npm install
make dev
```

```
make check    # astro check: type and template errors
make build    # astro build, which is the only thing that compiles every route
make lint     # eslint and prettier
make test     # vitest over the pure parts of src/lib
```

`docker compose up --build` serves the production build behind Caddy on
<http://localhost:8081>.

## What works today

Discord sign-in, a guild picker, and an overview page listing the guild's upcoming
events. The roster view, event view and comp builder come next; see `docs/design.md`.

## Credits

The dashboard shell is derived from
[accessible-astro-dashboard](https://github.com/incluud/accessible-astro-dashboard) by
Mark Teekman, MIT licensed. Its licence is kept in
`LICENSE-MIT-accessible-astro-dashboard`.
