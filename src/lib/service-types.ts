import type { Linked } from './links';

/**
 * Response shapes from raider-mate-service, transcribed from its handlers rather than
 * remembered from the design doc. The service changes on its own release cycle: when
 * something here stops matching, read its CHANGELOG before editing this file.
 *
 * Timestamps arrive as RFC 3339 strings and stay strings. Parsing them into Date here
 * would throw away the offset the service sent, and a raid time rendered in the
 * server's timezone instead of the guild's is the bug that produces.
 */

export type Role = 'TANK' | 'HEALER' | 'MDPS' | 'RDPS';
export type EventType = 'RAID' | 'MYTHIC_PLUS';
export type RaidDifficulty = 'NORMAL' | 'HEROIC' | 'MYTHIC';
export type CompMode = 'AUTO' | 'MANUAL';
export type ReminderDelivery = 'PING' | 'DM' | 'BOTH';
export type RequestState = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * BENCH is deliberately absent. Bench lives on comp_slots.is_bench, decided fresh by
 * every lock, and was dropped from this enum. Never send it.
 */
export type SignupStatus = 'CONFIRMED' | 'TENTATIVE' | 'DECLINED' | 'LATE' | 'ABSENT' | 'NO_SHOW';

export interface RoleChoice {
  role: Role;
  priority: number;
}

export interface Character extends Linked {
  id: string;
  name: string;
  realm: string;
  raiderio_url: string;
  region: string;
  class?: string;
  spec?: string;
  ilvl?: number;
  mplus_score?: number;
  is_main: boolean;
  synced: boolean;
}

/**
 * The part of a character the service embeds in someone else's resource: a signup row,
 * a comp slot. No links of its own; the full character resource carries those.
 */
export interface CharacterSummary {
  id: string;
  name: string;
  realm: string;
  raiderio_url: string;
  class?: string;
  spec?: string;
  ilvl?: number;
  roles: RoleChoice[];
  is_main: boolean;
}

export interface Event extends Linked {
  id: string;
  type: EventType;
  title: string;
  starts_at: string;
  signup_deadline: string;
  comp_template: unknown;
  message_id?: string;
  channel_id?: string;
  difficulty?: RaidDifficulty;
  /** The resolved lead time, not what the creator asked for. 0 means no reminder. */
  reminder_lead_minutes?: number;
  /**
   * The WarcraftLogs report a raid lead attached after the night. Absent until someone
   * does, and most events never get one. The `warcraftlogs` link carries the same URL;
   * render from the link, since that is what the service offered.
   */
  warcraftlogs_url?: string;
}

export interface Signup extends Linked {
  id: string;
  character_id: string;
  /** Populated on list responses, absent on single-signup writes. */
  character?: CharacterSummary;
  status: SignupStatus;
  assigned_role?: Role;
  late_until?: string;
  note?: string;
  /**
   * What this caller may PUT. Render exactly these buttons. Absent means the caller
   * cannot act on this signup at all, the same way its links are absent.
   */
  allowed_statuses?: SignupStatus[];
}

export interface LateRequest extends Linked {
  id: string;
  character_id: string;
  status: SignupStatus;
  note?: string;
  late_until?: string;
  state: RequestState;
}

export interface CompInfo extends Linked {
  name: string;
  mode: CompMode;
}

export interface Assignment {
  character_id: string;
  character?: CharacterSummary;
  role: Role;
  slot_index: number;
  is_bench: boolean;
  reason: string;
}

/**
 * Information from the assigner, never an error and never a reason to block a save.
 * "HEALER: 3, suggestion for 20 raiders is 4" is what a raid lead wants before pulling.
 */
export interface Advisory {
  role?: Role;
  message: string;
}

export interface Board extends Linked {
  name: string;
  mode: CompMode;
  slots: Assignment[];
  advisories?: Advisory[];
}

export interface GuildSettings extends Linked {
  events_channel_id?: string;
  timezone?: string;
  /** Always present, empty included: "ping nobody" and "not configured" differ. */
  event_mention_role_ids: string[];
  event_banner_url?: string;
  /** Absent means the guild chose nothing, which is not the same as choosing 30. */
  reminder_lead_minutes?: number;
  reminder_delivery?: ReminderDelivery;
}

export type DiscordChannelType =
  'TEXT' | 'ANNOUNCEMENT' | 'VOICE' | 'STAGE_VOICE' | 'FORUM' | 'CATEGORY' | 'OTHER';

export interface DiscordChannel {
  id: string;
  name: string;
  type: DiscordChannelType;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

/** The Discord roles a guild has mapped as raid leads. Admin-only, both ways. */
export interface RaidLeadRoles extends Linked {
  role_ids: string[];
}

export interface GuildChannels extends Linked {
  channels: DiscordChannel[];
}

export interface GuildRoles extends Linked {
  roles: DiscordRole[];
}

/**
 * One guild the service knows this user in. Ids only: the service has no idea what a
 * guild is called, so the dashboard pairs these with Discord's own list for names.
 *
 * No `_links`, and that is deliberate on the service's side: every guild-scoped route is
 * bound to the actor's own guild, so a link to another guild's collection would answer
 * 403, and a link that cannot be followed is worse than no link.
 */
export interface UserGuild {
  discord_guild_id: string;
}

/**
 * What the signed-in raider may do in the selected guild, answered by the service so
 * this repo never has to hold its own copy of the rules. The `configure` link is the
 * one the dashboard hangs its Configuration entry off.
 */
export interface GuildCapabilities extends Linked {
  is_raid_lead: boolean;
  is_guild_admin: boolean;
}
