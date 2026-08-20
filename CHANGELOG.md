# Changelog

Notable changes to raider-mate-dashboard. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) without a `v` prefix.

The release workflow reads the section matching the pushed tag and uses it as the
GitHub Release body. A tag with no section here fails the release before anything is
published.

Sections are `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

## [Unreleased]

## [0.1.0] - 2026-08-20

### Changed

- The comp leads the event page, above the signups. It is what a raid lead opens the page
  for. Before it is locked it is one line rather than an empty panel, so an event nobody
  has locked yet no longer pushes its signups most of a screen down.

### Added

- **Events can be created here, not only with `/raid create` and `/dungeon create`.**
  A raid lead gets a New event button in the top bar, on every page, and the form asks
  for what the slash commands ask for: type, title, difficulty, the two times, the comp
  sizes, and the reminder lead. Raider Mate posts the signup sheet in the guild's events
  channel exactly as the bot does, so answers still come from Discord.

  Times are typed as wall clock and read in the guild's timezone, so 20:00 means the
  20:00 the guild raids at wherever the raid lead happens to be sitting. A guild that has
  set no timezone is told, on the form, that its times are being read as UTC.

  A guild with no events channel set is told so instead of being offered the form: unlike
  a slash command there is no "here" to post in, and an event nobody can see is worse
  than no event.

  Needs the raider-mate-service and raider-mate-discord-bot releases that carry the
  announcement between them.
- Every empty screen inside the dashboard now carries the bot's install button. Signing
  in works whether or not Raider Mate is in your Discord server, so somebody could get
  this far, find four blank pages, and have nothing to click. The events list only offers
  it for upcoming raids: an empty Past list is a guild that has not raided yet, not a
  guild missing the bot.
- A container image that runs the whole dashboard: Caddy on port 8080 in front of the
  node process on loopback, both inside it, as a non-root user. Scaleway's Serverless
  Containers run one container on one port and terminate TLS at the edge, so Caddy's
  automatic HTTPS is off and it never sees the public hostname. If either half dies the
  container exits, so the platform replaces a broken one rather than leaving it serving
  502s from the half still alive.
- CI on every push and pull request: check, build, lint, tests, and a Docker build, plus
  a sign-off check on pull requests. Tagging a release publishes the image to
  `ghcr.io/phage-solutions/raider-mate-dashboard` and cuts a GitHub Release from this file,
  and refuses to do either if the tag has no section here.
- The dashboard itself: an Astro 7 application, server-rendered, running behind Caddy
  in the container described by `Dockerfile` and `docker-compose.yml`.
- Discord sign-in. The dashboard asks for `identify`, `guilds` and
  `guilds.members.read`, then holds the session in an encrypted cookie rather than any
  server-side store. Signing out and rotating `SESSION_SECRET` both end sessions;
  rotating the secret ends all of them at once.
- A guild picker. Every Discord server you are in is listed, because the service has no
  way yet to say which of them are running Raider Mate. Picking one that is not simply
  shows an empty dashboard.
- A typed client for the raider-mate-service API that reads `_links` and
  `allowed_statuses`, so later screens render the controls the service offered and
  nothing else.
- An overview page showing the next few events, with the full list behind it.
- A roster view: every character registered in the guild, with class and spec, item
  level and Mythic+ score. A character the sync has not reached yet says so, rather
  than showing an empty item level that reads as a missing character.
- An event view: who signed up and as what, the locked comp with its bench and the
  assigner's reason for each slot, and any advisories the assigner raised. Raid leads
  also see the late requests waiting on them.
- Setting your signup status from the event view, and withdrawing. You get the statuses
  the service says you may set and no others, so a raid lead sees NO_SHOW and a raider
  does not. Once signups have closed, the same buttons file a late request instead, and
  the page says so rather than looking like the change went through.
- Raid times shown in the guild's timezone, the one set in guild settings, so everyone
  reads the clock time the raid lead announced. A guild that has not set one still sees
  what the service sent.
- Navigation across the top of every page rather than down the side, so the roster and
  the comp get the full width of the screen.
- Pagination on the events list, ten to a page, with the range and total in view.
- Class colours on the roster and on signup lists, the ones you already read in a raid
  frame, as a marker beside each name.
- How long is left to sign up, in plain words, next to the exact deadline.
- Page transitions. Opening an event carries its row into the page header instead of
  swapping the screen, so you keep your place in a long list. Browsers without the View
  Transitions API navigate normally, and the whole effect is off when the operating
  system asks for reduced motion.
- A landing page at `/`, the one page reachable without signing in. It builds a raid
  comp in front of you as you read it: an empty board fills with signups, the assigner
  fills the slots, the comp flips to manual and two raiders change places, and a bench
  forms. Browsers without scroll-driven animations get the finished board and the same
  argument. Every name on it is invented and the page says so.
- The landing page names the Raider Mate bot and leads with its install. Adding the bot
  is where a guild actually starts, since nothing reaches the dashboard until it is
  posting events in a channel, so that is the page's primary action and signing in sits
  quietly beside it for the guilds already running it.
- Source links to all three repositories, with GitHub's mark on them.
- A privacy policy at `/privacy` and terms of service at `/terms`, both public and
  linked from the footer. The privacy policy is written from what the code actually
  collects, category by category: the three Discord scopes the sign-in asks for, the
  columns the service stores, the Raider.IO lookups, and the one strictly necessary
  session cookie, which is why there is no cookie banner. Guild data is deleted within
  30 days of the bot being removed, and a raider can have their own erased without their
  guild leaving.
- Pricing on the landing page: free and self-hostable under the AGPL, or hosted Premium
  at 2.99 EUR a month or 29.99 EUR a year, VAT included, through Stripe.
- Server icons in the guild picker.
- Past events. The events page has an Upcoming and a Past view, both paginated, and a
  raid that has started moves from one to the other.
- Linking a WarcraftLogs report to an event. Raid leads get a field on the event page to
  paste the report URL into, and everyone else sees the link once it is there. The
  service decides what counts as a report link and what a raid lead may attach, so a
  raider never sees a control that would be refused.
- The Raider Mate mark, the same one the bot posts under in Discord, in the top bar, on
  the sign-in page, and as the browser tab icon.

### Changed

- Raid-lead actions now follow the guild's mapped roles alone. A Discord server admin
  who holds none of them can configure the guild but cannot create or edit events, which
  matches how guilds actually split those two jobs. This needs raider-mate-service 0.6.0
  or later.
- The dashboard overview moved from `/` to `/dashboard`, because `/` is now the public
  landing page. Signing in, picking a guild, and the Overview link all lead to the new
  address, and a signed-in visitor asking for `/` is sent to it.
- Signing out lands on the landing page rather than a separate login screen.

### Removed

- The separate `/login` page. It held a heading, a sentence and one Discord button, all
  of which the landing page already carries, and it meant signing out dropped you on the
  emptiest page on the site. Sign-in problems are reported on the landing page now.

- Your main leads the "My characters" page, carrying the accent border, with the alts
  under their own heading beneath it. A raider with six alts should not have to hunt for
  the one a raid lead plans around.
- Headings that follow a card get proper space above them again. A section only took its
  margin from another section, so a heading after a panel sat welded to it.
- A "My characters" page. Every member can register a character, say which roles it can
  play, move their main, and remove one. Removing a character takes its signups, comp
  slots and gear history with it, which is the self-service erasure the privacy policy
  points at. Registering and editing characters used to be possible only through the
  bot.
- The guild's highest Discord role is locked on in the raid-leads picker and cannot be
  unticked, because the service now refuses any mapping that leaves it out. Unticking
  everything used to leave a guild unable to create an event with nothing on screen
  saying why. Needs raider-mate-service 0.6.0 or later.
- Configuration is open to raid leads as well as Discord admins, and the nav entry
  appears only for them. Whether you may configure the guild is the service's answer,
  cached on the session and re-asked on the same clock as your Discord roles, so losing
  a raid-lead role removes the page within a refresh interval. Against a service too old
  to answer, the page falls back to the Discord admins who had it before, so upgrading
  the two repos in either order never leaves nobody able to configure a guild.
- A guild configuration page for raid leads and Discord server admins. It maps which Discord roles
  count as raid leads, and sets the events channel, the guild timezone, the reminder
  lead and delivery, and which roles a new event mentions. Mapping raid-lead roles used
  to be possible only through the bot.
- The guild picker asks Raider Mate which servers it already knows you in and leads with
  those, instead of making you find yours among every Discord server you have ever
  joined. When exactly one of them is running Raider Mate and you have not chosen yet,
  it is picked for you. If the service cannot answer, the full list is still there.

### Fixed

- The Configuration entry no longer disappears because the service was briefly
  unreachable. Whether you may configure a guild was resolved once when you picked it,
  and a failed lookup was cached as "no" for the next fifteen minutes, which locked
  raid leads out of a page they could still open by typing its address. Not knowing is
  now kept distinct from being told no, and an unresolved answer is retried on the next
  request instead of waiting out the refresh interval.
- Signing in again is required once: the session payload changed shape, so its version
  was bumped rather than letting older cookies read the new field as absent.

### Security

- The shared service API key stays on the server. It is declared as an `astro:env`
  secret, which fails the build rather than the deploy if anything client-side ever
  imports it.
- Sign-out is a `POST`. A sign-out reachable by `GET` can be fired by any image tag on
  any page. Form posts from another site are refused, since Astro checks the `Origin`
  header and the session cookie is `SameSite=Lax`.
