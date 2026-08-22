---
version: 1
slug: "src-pages-analysis-astro"
primary_target: "src/pages/analysis.astro"
related_targets: ["src/components/proportion-bar.astro","src/components/throughput-chart.astro","src/components/ilvl-chart.astro","src/components/locked-panel.astro"]
---

---
version: 1
slug: "src-pages-analysis-astro"
primary_target: "src/pages/analysis.astro"
related_targets: ["src/components/proportion-bar.astro","src/components/throughput-chart.astro","src/components/ilvl-chart.astro","src/components/locked-panel.astro"]
---

# Surface: analysis (`/analysis`)

**Scope.** `src/pages/analysis.astro` and the marks it renders with:
`proportion-bar`, `throughput-chart`, `ilvl-chart`, `chart-axis`, `locked-panel`.
Visitor mode: **Operate**, in the unhurried, comparative half of it. This is the raid
lead doing roster admin between raids, not the one thirty minutes before pull.

**Job.** Answer four questions the guild argues about: who actually turns up, what we
actually field, how much of the roster is still here, and is the gear moving. Five
panels in a fixed order, all covering the same ninety days, said once in the page head.

The raid week leads, because the shape of the last three months is the thing you look at
before you look at any one person. Attendance follows it.

Panels with no data are gathered at the end rather than left in place. A guild without a
subscription would otherwise open on a locked panel, with the one thing it can actually
read pushed below an advert for the things it cannot. This sorts on whether a panel has
content, which is the service's answer, so it is not a tier check; and the order within
each group is the canonical one, so a panel arrives back where it was always going to be
the moment its data does.

**What the tier does to it.** Attendance is free. The other four render locked when the
service sent no link for them, which is the same absence a lapsed subscription produces.
The panel list is this repo's vocabulary; what is behind each one is never decided here.
A locked panel is short on purpose: four of them stack under one free panel, and four
full-height billboards would read as a wall rather than as what is behind the door.

**The one chart form.** A stacked proportion bar: one whole, split by a channel that
already means something. It carries a raider's season, a role's share of the boards, and
what the roster can play, because in all three the question is the same shape. Choosing
it over four different chart types is the decision this surface is built on.

**Colour comes from the existing channels, or not at all.**
- Attendance splits three ways: turned up (`--success`), said yes and did not appear
  (`--danger`), answered no (`--text-tertiary`). Never answered is the empty track. Six
  statuses would need two hues twice over, and `DECLINED` against `NO_SHOW` is the one
  distinction the panel exists for.
- Roles take the role hues. Bench takes none, matching the event view, and specifically
  not `--warning`: four amber-adjacent bars beside the one amber button would take the
  eye off the only thing on the panel you can act on.
- The raid week's bars take `--success`, because they count confirmed signups and that
  is what `--success` means on this surface, on the event view and on the attendance
  ribbon two panels up. They were neutral first; that was not restraint, it was the one
  chart on the page refusing to say what it counted.
- Item level over time is drawn entirely in neutrals. Gear encodes no role, class,
  difficulty or state, so the one chart with no channel to borrow gets no colour. That
  restraint is what stops the page turning into a palette.

**The authored moment.** Every bar draws itself in from the left on arrival, a beat
behind the one above it, capped at twelve steps. A panel assembles top-down and the
shape of the guild's season lands before a single number has been read. It uses its own
easing rather than `--ease`: the surface's exponential ease-out is right for a 120ms
state change and puts a 460ms draw at nine tenths of its length in the first hundred
milliseconds, where the movement never reads.

A travelling bloom on the leading edge was built and cut. On a 6px bar it could not be
shown to read, and DESIGN.md's glow rule was left intact rather than spent on an effect
that had to be argued for instead of seen.

**Counts are people, never rows.** A raid week bar is how many raiders confirmed that
week, counted once each, not the sum of that week's signup rows. The sum reported more
people than the guild had, which is the worst thing an analysis panel can do: it was
wrong in the direction that flatters. Anything drawn beside the roster has to be
comparable with the roster.

**A chart answers when you ask it.** Both charts carry hover and focus readouts, from one
shared `chart-readout` shell: a `button` with the same sentence as its accessible name,
revealed in CSS, because an SVG `title` takes a second to appear, cannot be styled, and
never shows for somebody on a keyboard. No script on the page. The bar chart aims at its
bars; the gear chart has no bars to aim at, so its target is the whole vertical slice a
week occupies and the readout floats from that week's median.

Axis labels centre on their tick and only nudge at the real edges of the plot. Nudging
the first and last label unconditionally is what put a date to the left of its own bar
once there were only two of them.

**Both charts carry both axes.** A y-axis with labelled gridlines, and an x-axis that is
the whole ninety days rather than the extent of the data. Two weeks of history stretched
edge to edge draws a wedge that claims to be a quarter's trend; placed in the real window
against a thirteen-week grid it reads as two weeks, which is what it is. Weeks with
nothing in them are never filled with zeroes: "we took the week off" and "we were not
using this yet" are different facts and neither is a zero.

**Gear is quartiles over mains.** Not lowest to highest, and not every character. A
roster holds abandoned alts and one of them sets the floor at whatever it was when it was
abandoned, which drew a band spanning two hundred item levels and pinned the median to
the top edge of its own chart. The distance between p25 and p75 is the gear gap, and the
panel says it in a sentence rather than making anyone read it off an axis.

**Constraints.**
- No number on this page is computed here. Every rate, share and median arrives worked
  out; a page that divides two of its own fields is a bug (hard rule 1).
- Charts are hand-drawn SVG. No chart library was added, and the two shapes here do not
  justify one.
- Plots stretch with `preserveAspectRatio="none"` and keep their strokes with
  `vector-effect="non-scaling-stroke"`. Axis dates are HTML underneath, never SVG text,
  so a label stays real type at a real size on a phone.
- `.stack` is `minmax(0, 1fr)`. A grid item's automatic minimum is its content, so the
  attendance table would push the page wider than a phone instead of scrolling inside
  its own wrapper.
- Attendance sorts from the query string, the way the events list paginates: real links,
  no script, and a sorted view is a URL. The default is still the order the service sent.
  A sort click re-renders the page and refetches all five panels, which on a
  between-raids screen is the price of having no client-side state at all.
