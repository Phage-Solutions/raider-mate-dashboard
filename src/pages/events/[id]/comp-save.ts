import type { APIRoute } from 'astro';

import { findComp } from '../../../lib/comps';
import { getLink } from '../../../lib/links';
import { ServiceError, ServiceUnreachableError } from '../../../lib/service-error';
import type { Board, Role, SavedSlot } from '../../../lib/service-types';

export const prerender = false;

const ROLES: Role[] = ['TANK', 'HEALER', 'MDPS', 'RDPS'];

/**
 * Reads the board out of the form field the builder put it in.
 *
 * Shape only. Whether the composition is any good, whether a raider signed up, and
 * whether eleven people is a Mythic roster are all questions this route does not ask:
 * the raid lead is the authority and the service writes the board as given. What is
 * checked here is that the thing being forwarded is a board at all, because a route
 * should not hand the service whatever JSON a browser felt like sending.
 */
function readSlots(raw: string): SavedSlot[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const slots = (parsed as { slots?: unknown })?.slots;
  if (!Array.isArray(slots)) {
    return null;
  }

  const out: SavedSlot[] = [];
  for (const slot of slots) {
    const { character_id, role, is_bench } = (slot ?? {}) as Record<string, unknown>;
    if (typeof character_id !== 'string' || typeof is_bench !== 'boolean') {
      return null;
    }
    if (typeof role !== 'string' || !ROLES.includes(role as Role)) {
      return null;
    }
    // Rebuilt rather than passed through, so a field nobody asked for cannot ride
    // along. slot_index in particular is the service's to derive from this order.
    out.push({ character_id, role: role as Role, is_bench });
  }
  return out;
}

/**
 * Writes a hand-built board.
 *
 * The whole board, every time. Never a partial write and never a per-slot patch: the
 * whole-board model is what lets two raid leads edit at once and resolve to whoever
 * saved last, with no half-applied state between them.
 *
 * This is the one write the builder island makes, and it arrives as form data rather
 * than as a JSON body on purpose. Astro's origin check keys on form content types, so
 * posting a form keeps the protection every other write in this repo already has, and
 * the alternative was a CSRF token this route would have had to grow by itself.
 *
 * It answers JSON rather than redirecting, because the caller is a board mid-edit and a
 * reload would throw away the scroll position and the drag the raid lead is in.
 */
export const POST: APIRoute = async ({ request, params, locals }) => {
  const { session, actor, client } = locals;

  const fail = (status: number, message: string) =>
    new Response(JSON.stringify({ message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (!session?.selectedGuildId || !actor) {
    return fail(401, 'Your session has expired. Sign in again.');
  }

  const eventId = params.id!;
  const form = await request.formData();
  const name = form.get('name');
  const slots = form.get('slots');

  if (typeof name !== 'string' || typeof slots !== 'string') {
    return fail(400, 'That board could not be saved.');
  }

  const board = readSlots(slots);
  if (!board) {
    return fail(400, 'That board could not be saved.');
  }

  try {
    const comp = await findComp(client, actor, eventId, name);
    if (!comp) {
      return fail(404, 'That comp is no longer on this event.');
    }

    // No save link is the authorization answer: an auto comp does not offer one, and
    // neither does any comp for someone who is not a raid lead here.
    const link = getLink(comp, 'save');
    if (!link) {
      return fail(
        403,
        comp.mode === 'AUTO'
          ? 'This comp is back on auto. Take manual control before saving.'
          : 'That is not yours to change.',
      );
    }

    const { body } = await client.follow<Board>(actor, link, { slots: board });
    return new Response(JSON.stringify({ board: body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ServiceUnreachableError) {
      return fail(503, 'Raider Mate is not answering right now.');
    }
    if (error instanceof ServiceError) {
      if (error.status === 409) {
        return fail(409, 'This comp is on auto. Take manual control before saving.');
      }
      if (error.isForbidden) {
        return fail(403, 'That is not yours to change.');
      }
      if (error.isNotFound) {
        return fail(404, 'That comp is no longer on this event.');
      }
      return fail(error.isSafe() ? error.status : 500, 'That board could not be saved.');
    }
    throw error;
  }
};
