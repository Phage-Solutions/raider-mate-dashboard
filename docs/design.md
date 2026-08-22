# raider-mate-dashboard: design notes

The full spec (schema, assignment algorithm, tier rationale, licensing detail) lives in
`raider-mate-service/docs/design.md`. This file covers only what is specific to this
repo.

**Vocabulary:** the privileged user is a **raid lead**, not an officer.

---

## 1. What this dashboard renders

- **Roster view.** Characters, roles, current iLvl and Mythic+ score, from the roster
  and audit endpoints.
- **Event view.** Signups and comp, from the signup and comp endpoints.
- **Comp builder.** Manual editing of a comp's slots. This repo owns it; see below.
- **Analysis.** Five panels over one fixed ninety-day window: attendance, comp balance,
  roster health, the raid week, and gear over time. Attendance is free for every guild;
  the other four are Premium.

  Which of them holds numbers is decided entirely by the link set on
  `GET /api/guilds/{gid}/analysis`. A panel with no link renders locked. The list of
  five panels is this repo's own UI vocabulary, so naming them in the page is not a
  client-side permissions model; what is behind each one is never decided here, and a
  lapsed subscription looks exactly like a guild that never subscribed.

  Going straight to a gated panel answers 402 rather than 403, and the page renders the
  same locked state. That redundancy is deliberate: it is a second reading of the
  service's answer, never a second source of truth.

  No number on the page is computed here. Every rate, share and median arrives worked
  out; a page that divides two of its own fields is a bug.
- **Premium views still to come.** Gear gap analysis and enchant compliance. Same rule:
  rendered only when the API returns the data, upsell state when it does not, never a
  tier flag read client-side.

## 2. HATEOAS and allowed_statuses

Every entity the API returns carries a `_links` object describing what the current user
may do with it. Signups additionally carry `allowed_statuses`: the set this caller may
`PUT`.

The dashboard renders controls for the links and statuses present, and nothing else.

Do not maintain a client-side permissions model that duplicates what the API already
encodes. That duplication is exactly the drift HATEOAS exists to avoid, and it is how a
dashboard ends up offering a button that returns 403. `allowed_statuses` is absent
entirely for a caller who cannot act on that signup, the same way its links are.

See `raider-mate-service/docs/design.md` section 2 for the link shape and the reasoning
behind it.

## 3. Manual comp editing

This is the one piece of interaction the bot deliberately does not have.

A comp is keyed `(event_id, name)` and carries a `mode`:

| Mode | Owner | Behaviour |
|---|---|---|
| `AUTO` | The assigner | `Lock` recomputes every slot from current signups |
| `MANUAL` | The raid lead | The assigner never runs; the board is whatever was saved |

The two never fight over the same comp. Locking a `MANUAL` comp returns
`ErrCompIsManual` and writes nothing. Saving a board over an `AUTO` comp is refused the
same way. Both refusals need a plain sentence in the UI, not an error dump.

Conversion between modes is explicit and leaves the slots alone. The useful workflow
that falls out of this: a raid lead locks an `AUTO` comp, flips it to `MANUAL`, and
hand-edits the assigner's output as a starting point. The builder should make that path
obvious rather than making people choose a mode up front.

**Saves are whole-board writes.** The builder holds the entire board and submits it
entire. `slot_index` falls out of the submitted order. Never send a partial board or a
per-slot patch: the whole-board model exists so two raid leads editing at once cannot
leave partial state to reconcile.

**Nothing validates a manual board.** A healer placed as a tank, a raider who never
signed up, an eleven-man Mythic roster: all are written exactly as asked. Render it
without comment or correction. The raid lead is the authority, and a builder that
argues gets switched off.

Advisories from the assigner are a different thing and should be shown: "HEALER: 3,
suggestion for 20 raiders is 4" is information a raid lead wants before pulling. Show
them as information, never as errors, and never as something blocking a save.

### How it is built

The builder is `src/islands/comp-builder.astro`, reached at
`/events/{id}/comp/{name}` and nowhere else. The route is the auth boundary: it looks
for the comp's `save` link in frontmatter. That one lookup is the whole permission
decision, because the service sends `save` only to a raid lead and only on a manual comp.

Absent, the board renders read-only rather than not at all. Following the comp's own
`self` link is the permission to look at it, and the service offers that link to
everyone who can see the event, which is why the event page already draws every board
for every raider. A reader gets the formation, the beams, the marker and the advisories;
the cards render as `div`s instead of `button`s and the script returns before a single
listener is attached, so there is nothing to pick up rather than a drag refused later.

Three things follow from the link set rather than from a preference:

- **Mode conversion is a form post that reloads.** Flipping to `MANUAL` is what makes the
  service start sending `save`, so the flip is literally what turns a read-only board
  into an editable one. Reloading is the honest render of a resource whose links changed.
- **The island performs exactly one write.** Everything else on the comp is an ordinary
  form, which keeps the interactive surface to the board itself.
- **The dashboard cannot create a comp.** An event with no comp has no comp resource, so
  there is no `lock` or `save` link to hang anything off. The bot's lock creates the
  first one. The event page says so.
- **Renaming is a `rename` link, not a save under a new name.** The service moves the
  comp and its slots together; saving under a new name would leave the old comp behind
  with no way to remove it. The link is offered in both modes, because a name is a label
  rather than a claim on who owns the board.

State lives in `src/lib/comp-board.ts`, which is pure and tested: it moves ids between
six columns and serialises the result. Everything it does is arranging a data structure
the service will accept verbatim, so it is not the domain logic rule 1 forbids.

Two invariants there are worth stating, because they are the only two ways the service
refuses a board outright. A raider sits in exactly one column, so nobody is placed
twice. Every card carries a role wherever it sits, including on the bench, so no slot
arrives without one. Neither is checked at save time; both are impossible to build.

The board is drawn server-side and the script moves the existing card nodes rather than
re-rendering. That keeps one copy of the card markup in the repo, keeps focus on the
node a raid lead is carrying, and makes the move animation a real element travelling.

## 4. Bench

Bench membership lives on `comp_slots.is_bench`, decided fresh by every lock. It is not
a signup status; `BENCH` was dropped from the enum.

This means the event view draws from two sources at once. The role columns and the
bench tray come from the comp. Late, Tentative, Declined, and Absent come from
`signups.status`, which is what the raider self-reported. Do not conflate them: a
raider can be `CONFIRMED` and benched at the same time, and that is the normal case.

## 5. Template

Scaffolded from **accessible-astro-dashboard** by Mark Teekman, MIT licensed.

Chosen over Flowbite's Astro admin dashboard for two reasons. It is a real dashboard
shell rather than a landing page in dashboard clothing, and its accessibility work
(landmarks, focus outlines, skip links, keyboard-navigable menus) matters for a tool
raid leads tab through every raid night. Flowbite is more feature-dense, but its
interactive components are vanilla JS, which sits awkwardly beside the island the comp
builder needs.

Licence was a hard constraint, not a preference. This repo ships AGPLv3 and the
template is redistributed with it. MIT combines cleanly. Anything with a
no-redistribution clause, a personal-use restriction, or a typical paid marketplace
licence could not be used at all.

### What the template does not solve

The comp builder. Drag-and-drop assignment with concurrent raid lead edits is bespoke
by definition and is the one genuinely hard screen in the product. The template
provides the shell: sidebar layout, auth pages, table components, chart setup.

### How the template was actually used

Not cloned. The repo is a fresh Astro 7 project, and the shell was ported by hand: the
skip link, the landmark structure, and the focus-visible outlines. Its sidebar was not
kept; navigation is a top bar, because the roster and the comp are wide tables and a
14rem rail was spending screen on three links. The
template's own copy of those was written against Astro 1.x, so cloning it would have
meant an upgrade before the first line of Raider Mate code, and its demo pages, charts
and fake login would have arrived as things to delete rather than things to use.

The MIT licence still applies to what was ported and is kept in
`LICENSE-MIT-accessible-astro-dashboard`. Its SCSS was not: the styles here are plain
CSS with custom properties, which drops the Dart Sass deprecation warnings and one
dependency.

## 6. Session and actor

The service authenticates with a shared API key and four self-asserted headers:
`X-Actor-Discord-Id`, `X-Actor-Guild-Id`, `X-Actor-Roles` and `X-Actor-Guild-Admin`. It
performs no verification of its own; it resolves raid-lead capability from the role ids
it is handed. The bot has the same deal.

That makes this dashboard, not the service, the place where "who is this" is decided,
and it has two consequences worth stating plainly.

The API key never reaches a browser. Every service call happens in page frontmatter or
an API route, and `astro.config.mjs` declares the key as an `astro:env` secret so that
importing it from an island fails the build rather than the deploy.

Nothing that ends up in an actor header may originate in the browser. The guild id
comes from the sealed session cookie, and the only route that changes it
(`POST /guild/select`) checks the requested guild against the user's real Discord guild
list first. Without that check, a snowflake typed into a form field reads another
guild's roster.

The session is an AES-GCM sealed cookie, `httpOnly` and `SameSite=Lax`, with no
server-side store: this repo has no database and does not want one. It holds the Discord
tokens, the selected guild, and the role ids in that guild. It deliberately does not
hold the user's full guild list, which the picker fetches live, because a raider in
fifty guilds would push the cookie past the 4KB limit and fail in a way that looks like
a login bug.

Role ids are re-read from Discord every 15 minutes. A raider promoted to raid lead
mid-session waits at most that long, and the service re-resolves capability from those
ids on every request, so the staleness window is entirely on this side.

## 7. Still outstanding

- Late requests are listed for a raid lead but not yet approved or rejected from here.
- CSRF beyond form posts. Two things cover what exists today: the session cookie is
  `SameSite=Lax`, and Astro's `security.checkOrigin` (on by default) answers 403 to a
  form `POST` whose `Origin` is not this site. Verified, not assumed. That check keys
  on form content types, so the moment an island posts JSON to an API route, the route
  needs its own token.

  The comp builder is the first island to write anything, and it sidesteps this rather
  than settling it: it posts `FormData` with the board in one field, which keeps the
  origin check covering it. The open question is unchanged for whatever posts a real
  JSON body first.
- Knowing which guilds run Raider Mate. The picker lists every Discord server the user
  is in, because the service has no endpoint that says which ones it knows about. An
  unregistered guild renders empty, which is honest but not friendly.

## 8. What this repo does not decide

Whether a signup is valid, how the assigner ranks candidates, who is benched, and what
counts as a Premium feature are all service-side. This repo displays what the API
returns. If a change here seems to need a new rule about any of those, the rule belongs
in `raider-mate-service`.
