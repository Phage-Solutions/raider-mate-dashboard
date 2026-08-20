import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { ServiceError } from '../../../lib/service-error';
import { noticeCodeFor } from '../../../lib/service-notice';
import { findOwnCharacter } from '../../../lib/own-character';
import type { Role } from '../../../lib/service-types';

export const prerender = false;

/** The order the form renders, which is what turns a set of ticks into priorities. */
const ORDER: Role[] = ['TANK', 'HEALER', 'MDPS', 'RDPS'];

/**
 * Replaces one character's role menu. A whole-menu write: the form submits every ticked
 * box, so an empty submission means "nothing", which a raider is allowed to want.
 *
 * Priority comes from the order the roles are rendered in rather than from a control of
 * its own. A four-way ranking widget is a lot of interface for a decision most raiders
 * make once, and the service only needs the choices to be ordered.
 */
export const POST: APIRoute = async ({ request, params, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const back = (notice: string) => redirect(`/characters?notice=${notice}`);

  const form = await request.formData();
  const chosen = new Set(form.getAll('roles').filter((v): v is string => typeof v === 'string'));

  try {
    // Found in the raider's own list, which is what makes this their character: the
    // roles link exists only where the service decided they may write it.
    const character = await findOwnCharacter(client, actor, session.discordId, params.id!);
    const link = character && getLink(character, 'roles');
    if (!link) {
      return back('denied');
    }

    await client.follow(actor, link, {
      roles: ORDER.filter((role) => chosen.has(role)).map((role, index) => ({
        role,
        priority: index + 1,
      })),
    });
    return back('saved');
  } catch (error) {
    if (error instanceof ServiceError && error.status === 400) {
      return back('invalid');
    }
    return back(noticeCodeFor(error));
  }
};
