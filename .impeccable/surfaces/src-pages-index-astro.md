---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: []
---

# Surface: the landing page (`/`)

**Scope.** `src/pages/index.astro`, the only route reachable signed out apart from the
sign-in round trip. Visitor mode: **Persuade**. Everything else in this repo is Operate.

**Audience and job.** A raid lead evaluating whether this replaces their signup bot plus
spreadsheet, usually arriving from a link somebody dropped in a guild Discord. They
decide in one viewport whether the tool understands raid nights. Raiders land here too
but their real entry point is the bot's event post.

**Action.** Add the bot to your server, primary and amber, in the hero and again at the
close. Sign in with Discord sits quiet beside it and in the header, for guilds already
running it. Read the source is a text link in the fine print and in the footer.

The install leads because the funnel demands it: nothing in the dashboard exists until
the bot is posting events in a channel, so sign-in is the returning user's door, not the
new one's.

**Proof.** The product's own board, built from the same tokens and components as the
dashboard, assembling as the page scrolls. No screenshot, no floating browser frame, no
testimonial, no logo wall. There is nothing real to show yet, so the page shows the
mechanism instead of evidence of adoption.

**Constraints.**
- Every raider and guild name is invented and the page says so on the board itself.
- The only commercial claims permitted are the ones in PRODUCT.md: AGPLv3 and
  self-hostable, a hosted instance exists, Premium is 2.99 EUR monthly or 29.99 EUR
  yearly through Stripe. No other price, customer, or number.
- The three repository URLs and the bot's install link are confirmed. `raider-mate-dashboard`
  is still private and has to be public before this page is.
- This is the one page with `indexable` set, so it is also the only one carrying a meta
  description and share card.

**Direction.** "The roster fills", candidate 5 of the grounded structural list, seed key
4b621d0f. A sticky comp board against a scrolling narrative, driven by a single
view-progress timeline over the whole stage: empty slots, signups landing one at a time,
an advisory, the flip from auto to manual with two raiders changing places, then a bench.

**Memorable moment.** The board is empty in the first viewport. A landing page that opens
on an empty state is the argument: this is what you have before Raider Mate, and the rest
of the page is it filling.

**Unresolved.**
- `raider-mate-dashboard` is private; the footer links to it regardless, on the
  understanding that it goes public first.
- Whether the hosted instance has a free tier is undecided, so the page neither claims
  nor denies one.
