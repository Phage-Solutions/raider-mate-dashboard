# Changelog

Notable changes to raider-mate-dashboard. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) without a `v` prefix.

The release workflow reads the section matching the pushed tag and uses it as the
GitHub Release body. A tag with no section here fails the release before anything is
published.

Sections are `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

## [Unreleased]

### Added

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
- An overview page listing the guild's upcoming events. It exists to prove the chain
  from sign-in to an authenticated API call, and the roster and event views replace it.

### Security

- The shared service API key stays on the server. It is declared as an `astro:env`
  secret, which fails the build rather than the deploy if anything client-side ever
  imports it.
- Sign-out is a `POST`. A sign-out reachable by `GET` can be fired by any image tag on
  any page. Form posts from another site are refused, since Astro checks the `Origin`
  header and the session cookie is `SameSite=Lax`.
