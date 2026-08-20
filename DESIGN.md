---
name: Raider Mate Dashboard
description: A dark, dense raid-night console for World of Warcraft guild leads
colors:
  ground: '#0B0D12'
  surface: '#11141B'
  raised: '#171B24'
  hover: '#1D2230'
  border-subtle: '#232936'
  border: '#2C3342'
  border-strong: '#3A4356'
  text-primary: '#E8EBF2'
  text-secondary: '#A5ADBE'
  text-tertiary: '#8A94A6'
  accent: '#E0A33C'
  accent-hover: '#F0B457'
  accent-pressed: '#C88C2C'
  accent-fg: '#12141A'
  success: '#34D399'
  warning: '#FB923C'
  danger: '#F27381'
  info: '#6AA9F5'
  role-tank: '#6AA9F5'
  role-healer: '#4ED88F'
  role-mdps: '#F5915E'
  role-rdps: '#B98BF0'
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI Variable Display, Segoe UI, system-ui, Roboto, sans-serif'
    fontSize: '1.625rem'
    fontWeight: 640
    lineHeight: 1.15
    letterSpacing: '-0.022em'
  title:
    fontFamily: '{typography.display.fontFamily}'
    fontSize: '1.0625rem'
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: '-0.014em'
  body:
    fontFamily: '{typography.display.fontFamily}'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: '-0.006em'
  label:
    fontFamily: '{typography.display.fontFamily}'
    fontSize: '0.75rem'
    fontWeight: 560
    lineHeight: 1.35
    letterSpacing: '0.01em'
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
  full: '9999px'
spacing:
  1: '4px'
  2: '8px'
  3: '12px'
  4: '16px'
  5: '20px'
  6: '24px'
  8: '32px'
  10: '40px'
  12: '48px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-fg}'
    rounded: '{rounded.md}'
    padding: '8px 14px'
    typography: '{typography.label}'
  button-primary-hover:
    backgroundColor: '{colors.accent-hover}'
    textColor: '{colors.accent-fg}'
  button-secondary:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.md}'
    padding: '8px 14px'
    typography: '{typography.label}'
  button-secondary-hover:
    backgroundColor: '{colors.hover}'
    textColor: '{colors.text-primary}'
  badge:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-secondary}'
    rounded: '{rounded.full}'
    padding: '2px 8px'
    typography: '{typography.label}'
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.xl}'
    padding: '20px'
  table-row-hover:
    backgroundColor: '{colors.hover}'
    textColor: '{colors.text-primary}'
  nav-link:
    backgroundColor: 'transparent'
    textColor: '{colors.text-secondary}'
    rounded: '{rounded.md}'
    padding: '6px 10px'
    typography: '{typography.label}'
  nav-link-active:
    backgroundColor: 'transparent'
    textColor: '{colors.text-primary}'
---

# Design System: Raider Mate Dashboard

## Overview

**Creative North Star: "The console on the second monitor."**

This is a raid-night instrument, not a marketing surface. It runs on a second display at
20:00 beside a full-screen game and a dark Discord, and a raid lead reads it in the
minutes before pull with half their attention. Every decision follows from that scene:
dark ground so nothing flares in a dim room, tight type so a whole roster fits without
scrolling, and one warm amber accent that appears rarely enough that finding it takes no
search. Depth is tonal, built from four stacked neutral values, because a raid lead is
scanning rows rather than admiring cards.

The craft bar is Linear, Vercel's Geist, Raycast, Stripe's dashboard, and Untitled UI:
familiar product-UI grammar executed exactly, with no invented affordances. A raid lead
who has used any tool in that family should not have to pause at a single control. What
is specific to Raider Mate is not the chrome but the data channels layered into it: WoW
class colors on the roster, role colors on a comp, and a difficulty vocabulary that
matches the one guilds already say out loud.

Colour is Restrained: cool neutrals carry the surface, amber marks the primary action
and the current place, and the saturated colours appear only where they encode real
game data. Colour is never decoration here. If a hue appears, it means something.

**Key Characteristics:**

- Dark, cool-tinted neutrals; nothing pure gray, nothing pure black.
- 14px body, tabular numerals on every figure, tight tracking.
- One amber accent, used on primary actions and current state only.
- Hairline borders and tonal steps instead of drop shadows, except on true overlays.
- Motion is one material idea: elements that persist across a navigation morph.

## Colors

Cool neutrals in the 225-230 hue range under one warm amber, with saturated hues
reserved entirely for game data.

### Primary

- **Amber** (#E0A33C): the primary action, the current nav item, the focus ring, and
  the active-state indicator. Nothing else. It appears on well under 10% of any screen.
- **Amber Hover** (#F0B457) and **Amber Pressed** (#C88C2C): the only two variations.
- **Amber Foreground** (#12141A): text and icons on an amber fill. Never white.

### Secondary

Game-data hues. These are information channels, not palette decoration.

- **Tank** (#6AA9F5), **Healer** (#4ED88F), **Melee** (#F5915E), **Ranged** (#B98BF0):
  role identity on comps and signups.
- **Heroic** (#6AA9F5) and **Mythic** (#B98BF0): raid difficulty. Normal takes neutral.
- **WoW class colors**: Blizzard's official thirteen, rendered only as a small dot or a
  left-edge marker beside the class name. Several of them (Death Knight, Rogue, Priest)
  cannot carry text at 4.5:1 on this ground, so class colour never becomes text colour.

### Tertiary

State semantics, used on badges and notices.

- **Success** (#34D399): confirmed signups.
- **Warning** (#FB923C): late, and deadlines inside the hour.
- **Danger** (#F27381): declined, no-show, and failures.
- **Info** (#6AA9F5): tentative, and neutral advisories.

### Neutral

- **Ground** (#0B0D12): the page behind everything.
- **Surface** (#11141B): panels, tables, the nav bar.
- **Raised** (#171B24): controls at rest, badges, table headers.
- **Hover** (#1D2230): row and control hover.
- **Border Subtle** (#232936): dividers inside a panel.
- **Border** (#2C3342): panel and control edges.
- **Border Strong** (#3A4356): hover edges and selected outlines.
- **Text Primary** (#E8EBF2), **Text Secondary** (#A5ADBE), **Text Tertiary** (#8A94A6).
  Tertiary is the floor; nothing dimmer ships, because it stops clearing 4.5:1.

### Named Rules

**The One Amber Rule.** Amber marks exactly two things: what you can do next, and where
you are. A second amber element on a screen means one of them is wrong.

**The Colour Means Data Rule.** A saturated hue on this surface encodes a role, a class,
a difficulty, or a state. Never a mood, never a gradient, never an accent on a heading.

## Typography

**Display Font:** system UI stack (`-apple-system`, `Segoe UI Variable Display`,
`system-ui`, Roboto)
**Body Font:** the same stack
**Label/Mono Font:** `ui-monospace`, `SF Mono`, `JetBrains Mono`, Menlo

**Character:** one family for everything, because this is an instrument and a second
typeface would be costume. The stack is deliberate rather than lazy: it renders at
native hinting on every raid lead's machine, adds no network request, and keeps the
self-hosted instance free of a font CDN. Personality comes from the scale and the
numerals, not the letterforms.

### Hierarchy

- **Display** (640, 1.625rem, 1.15, -0.022em): the page title in the header block. One
  per page.
- **Headline** (600, 1.3125rem, 1.25, -0.018em): section heads inside a page.
- **Title** (600, 1.0625rem, 1.35, -0.014em): panel and card titles, event names.
- **Body** (400, 0.875rem, 1.55, -0.006em): everything else. Prose blocks cap at 68ch;
  table content runs as wide as the data needs.
- **Label** (560, 0.75rem, 1.35, 0.01em): badges, table headers, nav items, metadata.
  Table headers add 0.04em and uppercase; nothing else is uppercased.

### Named Rules

**The Tabular Rule.** Every figure a raid lead compares down a column carries
`font-variant-numeric: tabular-nums`: item level, Mythic+ score, times, counts, page
numbers. Digits that shift width between rows make a column unreadable at a glance.

**The One Family Rule.** No display face, no serif, no mono outside code, identifiers,
and keyboard hints.

## Layout

A single centred column, `max-width: 76rem`, with `1.25rem` gutters that grow to
`2rem` above 60rem. The top nav is full-bleed and sticky; the content column is not.

Spacing runs on a 4px scale. The vertical rhythm is `2rem` between page sections,
`1.25rem` between blocks inside a section, and `0.5rem` inside a tight group. A heading
always gets more space above it than below it: `2rem` over, `0.75rem` under.

Density is deliberately high. Table rows run about `42px` on desktop
(`0.625rem` block padding on a `1.55` line), which fits roughly fourteen events or
twenty-five roster entries in a viewport without scrolling.

Responsive behaviour is structural, never fluid type. Below 52rem the nav collapses its
links into a horizontal scrolling strip and the guild switcher drops its label; below
44rem data tables re-flow into stacked rows with their column names as inline labels,
so no table ever scrolls sideways on a phone.

## Elevation & Depth

Tonal layering, not shadows. Depth on this surface is four neutral steps
(ground → surface → raised → hover) plus a hairline border, which reads correctly in a
dark room where a drop shadow reads as smudge. Shadows appear only on elements that
genuinely float above the page: the sticky nav once the page has scrolled, and any true
overlay.

### Shadow Vocabulary

- **Sticky** (`box-shadow: 0 8px 24px -12px rgb(0 0 0 / 0.7)`): the nav bar once
  content has scrolled beneath it, faded in over the first `4rem` of scroll by a
  scroll-driven animation. Where that API is missing the bar stays flat.
- **Overlay** (`box-shadow: 0 16px 40px -12px rgb(0 0 0 / 0.65), 0 4px 12px -6px rgb(0 0 0 / 0.5)`):
  dialogs and popovers only.

### Named Rules

**The Flat-At-Rest Rule.** Panels and rows carry no shadow. Elevation is a response to
floating or to state, never a default decoration.

## Shapes

Soft-rectangular throughout, on a four-step radius scale: `6px` on inline chips and
small controls, `8px` on buttons and inputs, `10px` on nested blocks, `14px` on panels
and tables. Pills (`9999px`) are reserved for badges that carry a status word.

Every panel, table, and control is defined by a `1px` border rather than a fill
difference alone, so the structure survives on a dim or badly calibrated monitor. Left
or right accent borders thicker than 1px are not part of this language; a class colour
marker is a `3px` rounded bar and is the single exception, because it encodes data.

## Components

### Buttons

- **Shape:** `8px` radius, `1px` border, `32px` tall at default size.
- **Primary:** amber fill, `#12141A` text, no border colour of its own. Padding
  `8px 14px`, label type.
- **Secondary:** raised fill (#171B24), border (#2C3342), primary text. This is the
  default button on this surface; primary is rare.
- **Ghost:** transparent until hover, used inside table rows and toolbars.
- **Hover / Focus:** background steps one tonal level and the border steps to
  border-strong, over `120ms` with `cubic-bezier(0.16, 1, 0.3, 1)`. Focus adds the
  2px amber outline at 2px offset plus a soft amber halo. Active presses `1px` down via
  transform, never via margin.
- **Disabled:** 45% opacity, no hover response, `cursor: not-allowed`.
- **Toggle buttons** (signup statuses) carry `aria-pressed`; the pressed state takes the
  status colour as border and text, not as a fill.

### Chips

- **Style:** pill, raised fill, `1px` border, label type, optional `6px` leading dot
  carrying the semantic or class colour.
- **State:** status chips tint their background with `color-mix(in srgb, <hue> 14%,
  transparent)` and take the hue for text and border. Neutral chips stay raised.

### Cards / Containers

- **Corner Style:** `14px` on panels, `10px` on nested blocks.
- **Background:** surface (#11141B) on ground; raised (#171B24) for a block nested
  inside a panel.
- **Shadow Strategy:** none. See Elevation & Depth.
- **Border:** `1px` solid border (#2C3342), always.
- **Internal Padding:** `20px` on panels, `12px` on nested blocks. A panel header sits
  in its own `16px 20px` band separated by a subtle divider.
- Cards are never nested inside cards. A repeating card grid is not this system's page
  structure; tables and panels are.

### Tables

- **Header:** raised fill, uppercase label type at `0.04em`, subtle bottom border. Not
  sticky: the horizontal scroll container a wide table needs would trap it.
- **Rows:** `44px` tall, separated by subtle dividers, hover to `#1D2230` over `120ms`.
- **Row as link:** the whole row is clickable via a stretched anchor on the primary
  cell, so the pointer target is the row while the accessible name stays the event.
- **Numeric cells:** right-aligned, tabular numerals.
- **Empty cell:** an em dash at text-tertiary. A blank cell is never acceptable, because
  "no data" and "not synced yet" are different facts and must read differently.
- **Pagination:** a footer band inside the table border, showing the range and total on
  the left and previous / numbered / next controls on the right. Pagination is
  server-rendered from a `?page=` parameter; the current page is `aria-current="page"`.

### Inputs / Fields

- **Style:** raised fill, `1px` border, `8px` radius, `32px` tall, body type.
- **Focus:** border steps to amber and the amber halo appears. The border never
  disappears on focus.
- **Placeholder:** text-tertiary, which is the dimmest value that still clears 4.5:1.

### Navigation

- **Style:** a sticky full-width top bar, `56px` tall, surface fill, hairline bottom
  border. Brand mark left, primary links beside it, guild switcher and account right.
- **Brand mark:** `public/icon-512.webp`, the same mark the bot posts under in Discord:
  three chevrons in tank blue, healer green and dps red inside an amber ring. It is
  shipped as one file at `20px` in the nav, `48px` on the sign-in card, and as the
  favicon and touch icon. Never recoloured, never redrawn as an inline SVG, because the
  point of it is being the mark a raider already recognises from the event post.
- **Links:** label type at text-secondary, stepping to text-primary on hover.
- **Active:** text-primary plus a `2px` amber bar seated on the bar's bottom edge.
- **Mobile:** below 52rem the links become a horizontally scrollable strip on a second
  row; nothing is hidden behind a hamburger, because there are only three destinations.

### Locked panels (subscription-gated views)

Analytics, attendance trends, gear gap analysis and enchant compliance are part of a
paid tier. The dashboard never decides this: the service stops returning the data, and
the panel renders its locked state instead of its content.

- **Style:** the ordinary panel, at full opacity and full contrast. A locked panel is
  not blurred, greyed, or dimmed, because a raid lead has to be able to read what they
  would be getting.
- **Marker:** a neutral chip reading `Premium` in the panel header, in the badge
  vocabulary. Not amber, because it is not an action and not where you are.
- **Body:** a heading naming the view, one plain sentence on what it shows, and one
  primary button. Never a screenshot of fake data, never a blurred chart, never an
  invented number.
- **Nav:** a gated destination sits in the nav like any other, with the same `Premium`
  chip trailing its label. It is never hidden, because hiding it makes the product look
  smaller than it is.

### Signature Component: the raid row

The events table row is the surface's one authored moment. It carries the event name,
its type and difficulty chips, the start time in the guild's timezone, and how long
signups remain open. Clicking it morphs the row into the event detail header: the name
and its chips travel from the table to the page title while the nav bar stays fixed,
so a raid lead never loses their place in a list of fourteen raids.

This is built on the View Transitions API through Astro's `ClientRouter`, with paired
`transition:name` values on the row and the detail header. The active nav indicator
carries its own transition name and slides between destinations on the same mechanism.
Where the API is unavailable the navigation is an ordinary one and nothing is lost.

## Do's and Don'ts

### Do:

- **Do** render controls from the API's `_links` and `allowed_statuses` and nothing
  else. A control the service did not offer must not exist in the markup.
- **Do** put `font-variant-numeric: tabular-nums` on every compared figure.
- **Do** state both facts in an empty cell: "Not synced yet" is not the same as no item
  level, and neither is a blank.
- **Do** keep transitions at `120-180ms` for state and up to `280ms` for a navigation
  morph. A raid lead is in flow.
- **Do** give an empty state a heading, one plain sentence, and the action that fills
  it.
- **Do** honour `prefers-reduced-motion: reduce` by dropping every transition and
  transition-name to nothing.

### Don't:

- **Don't** use amber for anything except the primary action and current state.
- **Don't** use a saturated colour that does not encode role, class, difficulty, or
  state.
- **Don't** add a drop shadow to a panel or a row.
- **Don't** introduce a second typeface, gradient text, or a glow. The two exceptions
  are the focus ring and the comp builder's encounter band, where the beams and the
  marker they converge on carry a bloom. That band is this surface's one authored
  moment and the glow is what makes a beam read as light arriving somewhere rather than
  as a coloured line; it is named here so it stays one place rather than becoming a
  house style. Nothing outside that band glows.
- **Don't** nest a card inside a card, or use a same-size card grid as a page's
  structure.
- **Don't** stage a page-load animation. This surface opens into a task.
- **Don't** remove or thin a focus outline. Keyboard operability is a product
  requirement here, not a preference.
