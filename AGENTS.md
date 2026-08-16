# AGENTS.md: raider-mate-dashboard

Astro dashboard for Raider Mate. This repo is a client of `raider-mate-service`'s HTTP
API, same as the bot. It holds no schema, no domain logic, no direct database access.

It does own one thing the bot does not: **manual comp editing**. See
[docs/design.md](docs/design.md).

Licensed AGPLv3. Free to self-host, monetised via a hosted instance.

Shared conventions (licensing, writing style, the "keep in sync" note) are duplicated
across raider-mate-service, raider-mate-bot, and raider-mate-dashboard on purpose.
The canonical copy of the shared sections lives in raider-mate-service's AGENTS.md.
If you need to change a shared section, edit it there first, then copy the edit here.

Repo-relevant design context lives in [docs/design.md](docs/design.md). The full
domain design lives in `raider-mate-service/docs/design.md`. The writing style rules
live in [docs/style.md](docs/style.md). Read them when the task touches those areas.
Do not load them by default.

## Stack

- Astro 7, `output: 'server'` with `@astrojs/node` standalone. SSR pages plus
  interactive islands for anything genuinely stateful.
- Discord OAuth2 for login. Session is an AES-GCM sealed cookie, no server-side store.
- Plain CSS with custom properties. No Sass, no Tailwind, no React.
- Fetches against the `raider-mate-service` API. No direct database access.
- Caddy in front of the node process in the container. See `Caddyfile`.

The dashboard shell (skip link, landmarks, focus outlines, sidebar nav) was ported by
hand from [accessible-astro-dashboard](https://github.com/incluud/accessible-astro-dashboard)
by Mark Teekman, MIT. Its licence is preserved in
`LICENSE-MIT-accessible-astro-dashboard`, as its terms require. Raider Mate code added
on top is AGPL-3.0-or-later.

## Commands

```
make dev     # astro dev server, pointed at a running raider-mate-service
make build   # astro build
make check   # astro check (type and template errors)
make test    # vitest over the pure parts of src/lib
make lint    # eslint and prettier
make up      # docker compose: dashboard behind caddy on :8081
```

See hard rule 9 for when these have to run. In short: `make check`, `make build`,
`make lint`, and any configured tests, every time, after the last edit.

## Hard rules

Violating these produces broken behaviour, not just untidy code.

1. **This repo holds no business logic.** It renders what the service API returns. If
   a page computes a comp, validates a signup, decides who is benched, or decides what
   a user may do beyond what the API told it, that is a bug.
2. **Use HATEOAS links and `allowed_statuses` to decide what UI to show.** If a
   response has no `bench` link for the current user, do not render a bench control,
   even if you happen to know the user is a raid lead. A signup response carries
   `allowed_statuses`: render exactly those buttons. Absent means the caller cannot act
   on that signup at all. Never discover a 403 by trying.
3. **Treat the service API as an external contract.** Do not assume a field exists
   because you remember it from the schema doc. Check the actual response shape. The
   service changes on its own release cycle; read its CHANGELOG when something breaks.
4. **Never use `localStorage` or `sessionStorage`** for anything that matters beyond
   the current page load. Session state comes from the OAuth2 session and the API. The
   template shipped a fake email/password login storing a flag in `localStorage`; it
   was removed and must not come back.
5. **Auth is enforced server-side**, in page frontmatter, before render. Never a
   client-side check after the page has already loaded.
6. **Bench is not a signup status.** It lives on the comp, on `comp_slots.is_bench`,
   decided fresh by every lock. `BENCH` is not in the enum. Never send it.
7. **Manual comp saves are whole-board writes.** Never a partial board, never a
   per-slot patch. Saving over an `AUTO` comp is refused by the service, the same way
   locking a `MANUAL` comp is. See docs/design.md.
8. **Tier-gated UI reflects what the API returns, not a client-side tier check.** The
   dashboard is not the source of truth for what a guild may see. A lapsed
   subscription means the service stops returning the data; show an upsell state
   rather than inventing one from a flag read client-side.
9. **Never report work finished without running `make check`, `make build`, and
   `make lint`, in that order, after the last edit.** Every time, not when the change
   feels risky.

   Astro fails differently from Go: a template referencing a prop that no longer
   exists, or a page importing a deleted component, compiles nowhere until it is
   built. `make dev` is lazy and only compiles the routes you visited, so a dev server
   that looks fine proves nothing about the routes you did not open. Only `make build`
   walks every page.

   Run the full build, never a single route. If a change lands mid-task from another
   source, verification restarts: what passed before those edits says nothing about
   what is on disk now.

   Report the actual output. "It builds" without having built it since the last edit
   is a false statement about the state of the repo, not an optimistic one.
10. **Update CHANGELOG.md in the same change as any added feature, removal, or
    bugfix.** Add the entry under `## [Unreleased]`, in the right Keep a Changelog
    section (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`). The
    release workflow reads the section matching the pushed tag as the GitHub Release
    body; a tag with no matching section fails the release. Write for the people
    running the hosted instance and for self-hosters, not for git history: state what
    changed in user-facing terms, and why if it is not obvious from the what.
11. **Do not autocommit and push, at all.** Leave changes staged, uncommitted, for the
    author to review, commit, and push themselves.

## Structure

```
src/pages       route-level Astro pages, SSR by default
src/components  shared components
src/islands     interactive client-side components (comp builder)
src/lib         typed API client for raider-mate-service, incl. HATEOAS parsing
```

Never create `utils/`, `helpers/`, or `common/` catch-all directories. If something
does not fit one of the above, it needs a better name, not a junk drawer.

## Conventions

- Fetch data server-side in Astro frontmatter where possible. Reach for a client island
  only when a page needs live interactivity.
- Ask before adding a dependency. Check what Astro's ecosystem already covers before
  reaching for a heavier framework.

## Principles

Priority order when they conflict: **KISS > YAGNI > DRY > SOLID**.

- **KISS.** Server-rendered HTML beats a client-side framework for anything that is not
  genuinely interactive.
- **YAGNI.** No component abstraction for a single use site.
- **DRY.** De-duplicate knowledge, not markup that merely looks similar.
- **DDD.** Use guild vocabulary: `Roster`, `Bench`, `Comp`, `Lockout`, `RaidLead`.
  Never `Participant`, `Entity`, `Item`.

The service calls the privileged user a **raid lead**, not an officer. Match it in code
and in UI copy.

## Behaviour

- **Do not assume.** State assumptions. Where a request has several readings, present
  them instead of silently choosing. When unclear, stop and ask.
- **Minimum code that solves the problem.** No speculative props, config options, or
  abstraction for a single call site.
- **Surgical changes.** Do not improve adjacent code or reformat working things. Remove
  only the orphans your own change created. Every changed line traces to the request.
- **Verifiable goals.** "Fix the layout bug" becomes "reproduce it, then verify the fix
  against that reproduction".
- Small commits, one concern each. Imperative lowercase subject, no trailing period.

## Writing style

**No em dashes.** No litanies of three. No emoji in code, comments, or commits. No
banned filler: `robust`, `seamless`, `comprehensive`, `leverage`, `delve`,
`ensure that`, `it's worth noting`. Comment why, not what. Full rules in
[docs/style.md](docs/style.md).

UI copy is read by players, so it should be short and plain, and may have a sense of
humour. Never apologetic boilerplate.

## Build order

1. Typed API client with HATEOAS link and `allowed_statuses` parsing
2. Discord OAuth2 login flow
3. Roster view, event view (SSR, read-only)
4. Comp builder island, including AUTO to MANUAL conversion
5. Tier-gated Premium views

**v0.1 scope for this repo:** roster view and event view, both read-heavy and mostly
SSR. The comp builder and tier gating wait until the service and bot are usable.
