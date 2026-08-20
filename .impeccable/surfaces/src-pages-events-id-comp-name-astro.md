---
version: 1
slug: "src-pages-events-id-comp-name-astro"
primary_target: "src/pages/events/[id]/comp/[name].astro"
related_targets: ["src/islands/comp-builder.astro"]
---

# Surface: the comp builder (`/events/{id}/comp/{name}`)

**Scope.** `src/pages/events/[id]/comp/[name].astro` and the island it holds,
`src/islands/comp-builder.astro`. Visitor mode: **Operate**. It inherits the dashboard's
visual world unchanged; nothing here is a new identity exercise.

**Audience and job.** A raid lead with the assigner's board in front of them and a change
to make, usually minutes before pull and often after it. One task: move raiders between
tank, healer, melee, ranged, bench, and the available pool, then save. Raiders never
reach this route; the service does not send them the link that opens it.

**Action.** Save comp. It is the only write the island makes, and the only amber fill on
the screen once the board is dirty.

**Proof.** Nothing to persuade anyone of. The screen earns its place by being faster than
the alternative, which is asking the bot to relock and hoping.

**Constraints.**
- The `save` link is the entire permission model. No role check, no capability flag.
- Whole-board writes. Never a partial board, never a per-slot patch.
- Nothing validates a board. No invalid drop, no rejected placement, no correction, no
  warning. Advisories are information and never block a save.
- A raider carries a role everywhere, bench included; a raider sits in exactly one
  column. Those two make the service's only two refusals unbuildable.
- Bench comes from the comp, `Signup.status` from the raider. Never merged into one
  badge.
- The keyboard path is not a fallback. It is used mid-raid and has to be complete.
- The route stays usable after `starts_at`. The banner says so and gates nothing.

**Direction.** The dashboard's established world, applied to a workspace rather than a
reading view. Six bordered columns on the tonal ground, cards at table-row density.

Two rules borrowed from DESIGN.md do the design work. Amber keeps its two jobs: the drop
target under the pointer is "where you are", Save-when-dirty is "what you can do next",
and they are never both live. Saturated hue keeps meaning data: while a raider is held,
the columns matching the roles *they themselves declared* warm to their own role colour.
It reads as a hint and restricts nothing, which is the whole posture of the screen.

**The encounter band.** A raid-marker reticle with beams converging on it, drawn from
the live counts: threat and damage up to the marker, healing forward from the back line,
and a broken still line where a role is empty. A beam that flows is four strokes, not
one, so it reads as a charge with a head and a falling-off trail rather than a dashed
line in motion. This is the one place on the surface permitted a bloom, and DESIGN.md
names the exception.

**Memorable moment.** The raider travels. Every move, by pointer or by arrow key, is the
same card element animating from where it was to where it is, with the cards it displaced
sliding to make room. It is the local reading of the one motion idea the events table
already spends its budget on, and it is why the DOM node is moved rather than re-rendered.

**Unresolved.**
- Two raid leads editing at once resolve to whoever saved last, by design. Nothing on
  screen says another save landed underneath yours.
- The started banner is fixed at render, so a page held open across `starts_at` does not
  grow one until reload.
- Comps still cannot be created from the dashboard. An event with no comp offers no link
  to hang creation off, so the bot's lock remains the only way to a first board.
