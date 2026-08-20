# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

World of Warcraft guild members, in four distinct moments that all matter:

- **A raid lead 30 minutes before pull.** Who signed up, who is missing, whether the
  comp holds, who is benched. Scan and decide, under time pressure, usually with WoW and
  Discord open beside the dashboard.
- **A raider who clicked through from a Discord event post.** Sign up, change status,
  withdraw, see whether they made the comp. Short visit, one action.
- **A raid lead doing roster admin between raids.** Gear gaps, attendance, who has never
  synced a character. Unhurried, comparative, wants the whole roster at once.
- **A raid lead hand-editing a comp.** The one genuinely interactive screen: taking the
  assigner's board and rearranging it.

No single one of these is the primary audience. The dashboard has to serve the
scan-and-decide flow and the check-and-act flow without favouring either.

## Product Purpose

Runs a guild's raid nights: events, signups, and the raid composition that comes out of
them. The service computes a comp from current signups and synced character data; the
dashboard is where a raid lead reads it, overrides it, and looks at the roster behind
it. Discord is where raiders live, so the bot handles most raider traffic; the dashboard
exists for the things a chat message cannot do, and for the raid lead who needs the
whole picture at once.

Success is a raid lead who opens the dashboard before pull, sees the answer without
hunting, and closes it.

## Positioning

Five things together, none of which a signup bot has on its own:

- **An assigner that builds the comp**, from signups plus synced iLvl, spec and Mythic+
  data, rather than a list of names a human still has to sort into roles.
- **Manual comp editing that the assigner does not fight.** A comp is `AUTO` or
  `MANUAL`. Locking an `AUTO` comp recomputes it; flipping it to `MANUAL` hands the
  board to the raid lead permanently, and nothing overwrites it afterwards. The useful
  path is lock, flip, hand-edit the assigner's output.
- **Analysis over time:** attendance trends, gear gap analysis, enchant compliance.
- **WarcraftLogs links on events**, so a raid night connects to what actually happened
  in it.
- **Self-hostable, AGPLv3.** A guild can run its own instance. The hosted instance is
  convenience, not lock-in.

## Operating Context

- **Desktop is primary, phone is real.** Raid leads use a wide screen, often on a second
  monitor beside the game and Discord. Raiders arrive on phones from a Discord link.
  Desktop sets the visual language; the phone layout is not an afterthought.
- **Raid night is keyboard-driven and time-pressured.** The dashboard shell was chosen
  for its accessibility work (skip link, landmarks, focus outlines) because a raid lead
  tabs through it while doing three other things.
- **Discord is the surrounding tool.** Sign-in is Discord OAuth2; events are posted to a
  Discord channel by the bot; the dashboard is opened from there and returned from.
- **Guild vocabulary, not software vocabulary.** `Roster`, `Bench`, `Comp`, `Lockout`,
  `RaidLead`. The privileged user is a **raid lead**, never an officer, never a
  participant.
- **Raid times are the guild's local time**, not the viewer's and not the server's,
  because that is the clock time the raid lead announced.

## Capabilities and Constraints

**Confirmed and shipped in this repo:** Discord sign-in and guild picker, roster view,
event view (signups, locked comp with bench and per-slot reason, assigner advisories,
late requests for raid leads), setting and withdrawing your own signup status.

**Confirmed and paid:** Analytics is behind a subscription, along with attendance
trends, gear gap analysis and enchant compliance. The hosted instance is the commercial
side of an otherwise self-hostable AGPLv3 product. Premium is **2.99 EUR per month or
29.99 EUR per year, VAT included, billed through Stripe**. The prices are quoted
inclusive because they are shown to consumers, and every public surface states so. Self-hosting stays free under the AGPL.
Which individual views sit behind the tier is still being decided and must not be
invented; the prices above are settled and may be stated publicly.

**Confirmed and not built yet:** the comp builder island, tier-gated Premium views
(attendance, gear gap, enchant compliance), WarcraftLogs linking on events, approving or
rejecting late requests from the dashboard.

**Hard constraints future work must preserve:**

- This repo holds no business logic. It renders what the service API returns. No
  client-side rule about who may do what.
- Controls are rendered from HATEOAS `_links` and `allowed_statuses`, and from nothing
  else. Absent means the user cannot act, and the UI must not offer the control.
- Auth is enforced server-side in page frontmatter, before render. Never a client-side
  check after load. No `localStorage` or `sessionStorage` for anything that matters.
- Bench lives on the comp (`comp_slots.is_bench`), not on the signup. A raider can be
  `CONFIRMED` and benched at once, and that is the normal case.
- Manual comp saves are whole-board writes, never per-slot patches.
- Nothing validates a manual board. A raid lead's board is written exactly as asked. The
  UI renders it without correction; assigner advisories are information, never errors,
  and never block a save.
- Tier-gated views reflect what the API returns. A lapsed subscription means the service
  stops returning the data and the dashboard shows an upsell state, never a client-side
  tier check.
- Astro 7 SSR with `@astrojs/node`. Plain CSS with custom properties. No Sass, no
  Tailwind, no React. Islands only where a screen is genuinely interactive.

## Brand Commitments

- **Name:** Raider Mate.
- **Mark:** the icon the bot posts under in Discord, three role chevrons in an amber
  ring, kept at `public/icon-512.webp` in this repo. Shared across the bot and the
  dashboard on purpose; a raider clicking through from Discord should land on the same
  mark they just tapped.
- **Voice:** UI copy is read by players. Short, plain, may have a sense of humour. Never
  apologetic boilerplate. Errors name the problem and the recovery in one sentence.
- **Writing rules that apply to UI copy too:** no em dashes, no litanies of three, no
  emoji, no filler (`robust`, `seamless`, `comprehensive`, `leverage`, `ensure that`).
- **Where it lives.** Three public repositories under
  `https://github.com/Raider-Mate`: `raider-mate-service`, `raider-mate-discord-bot`,
  `raider-mate-dashboard`. The dashboard one is private as of 2026-08-20 and is going
  public before the landing page does. The company site is `https://phage.sk`; the code
  lives under its own org, so the two are separate addresses on purpose.
- **The bot's install link:**
  `https://discord.com/oauth2/authorize?client_id=1537567534201569452`. A guild starts
  here rather than at sign-in, because nothing reaches the dashboard until the bot is
  posting events in a channel.
- **Legal entity.** Phage Solutions, s.r.o., a Slovak limited liability company at
  Lermontovova 911/3, 811 05 Bratislava. IČO 53151178, IČ DPH SK2121316010, ORSR insert
  147154/B. It is the controller for the hosted instance, its GDPR contact is
  `dpo@phage.sk`, and Slovak law governs the terms. Any public surface that names the
  operator uses this exact wording.
- **Licensing:** AGPLv3. The dashboard shell was ported by hand from
  accessible-astro-dashboard (MIT, Mark Teekman); its licence is preserved in
  `LICENSE-MIT-accessible-astro-dashboard` and must stay.

## Evidence on Hand

- Real API contract and response shapes: `src/lib/service-types.ts`, transcribed from
  the service's handlers.
- Repo-specific design record: `docs/design.md`. Full domain design lives in
  `raider-mate-service/docs/design.md`, outside this repo.
- Shipped feature list in user-facing terms: `CHANGELOG.md` `[Unreleased]`.
- Premium pricing, confirmed 2026-08-20: 2.99 EUR monthly, 29.99 EUR yearly, VAT
  included, via Stripe.
- No screenshots, no usage data, no testimonials, no customer names. Future work must
  not fabricate any of these. Any raider or guild name on a public surface is invented
  demonstration data and has to be labelled as such.

## Product Principles

1. **The service decides, the dashboard renders.** Every permission, validation, and
   ranking question has an answer on the wire already. Re-deriving it here is the bug.
2. **The raid lead is the authority.** A tool that argues with a hand-made comp gets
   switched off. Show advisories, never corrections.
3. **Answer before pull.** The value is a raid lead getting the answer fast and leaving.
   Density and scanability beat expression on every screen.
4. **Guild words, not software words.** The interface speaks the vocabulary raiders
   already use in voice chat.
5. **Self-hosting is a first-class path.** Nothing may depend on the hosted instance's
   infrastructure or on an asset a self-hoster cannot get.

## Accessibility & Inclusion

Keyboard operability is a product requirement, not a checkbox: the skip link, real
landmarks, and visible focus outlines exist because raid leads drive this from the
keyboard mid-raid. Never remove a focus outline. Times are always rendered in the
guild's timezone with the zone named, since guilds span offsets.
