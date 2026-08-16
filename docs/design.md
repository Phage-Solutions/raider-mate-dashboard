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
- **Premium views.** Attendance trends, gear gap analysis, enchant compliance. Rendered
  only when the API returns the data. A lapsed subscription means the service stops
  returning it, and the dashboard shows an upsell state rather than reading a tier flag
  client-side.

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

### Changes already made to the scaffold

- Demo pages removed (products, messages, media). `users` became `roster`; `events`
  added.
- `src/islands/` and `src/lib/` added, with a typed HATEOAS-aware API client stub.
- `tsconfig.json` added; the template shipped without one.
- The template's fake email/password login, which stored a flag in `localStorage` and
  gated every page on it client-side, was removed. Replaced with a placeholder linking
  to `/auth/discord`. Real Discord OAuth2 is still to be built, enforced server-side.
- Nav links repointed at the pages that actually exist.

### Still outstanding

- Upgrade Astro from 1.x, and `sass` alongside it.
- Replace `LICENSE` with the canonical AGPL-3.0 text from gnu.org.
- Build the real OAuth2 flow.

## 6. What this repo does not decide

Whether a signup is valid, how the assigner ranks candidates, who is benched, and what
counts as a Premium feature are all service-side. This repo displays what the API
returns. If a change here seems to need a new rule about any of those, the rule belongs
in `raider-mate-service`.
