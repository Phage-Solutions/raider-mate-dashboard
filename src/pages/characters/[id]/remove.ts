import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { noticeCodeFor } from '../../../lib/service-notice';
import { findOwnCharacter } from '../../../lib/own-character';

export const prerender = false;

/**
 * Deletes a character. The service cascades its signups, comp slots and gear history,
 * and none of it comes back, which is the erasure route the privacy policy points at.
 */
export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const back = (notice: string) => redirect(`/characters?notice=${notice}`);

  try {
    const character = await findOwnCharacter(client, actor, session.discordId, params.id!);
    const link = character && getLink(character, 'delete');
    if (!link) {
      return back('denied');
    }

    await client.follow(actor, link);
    return back('removed');
  } catch (error) {
    return back(noticeCodeFor(error));
  }
};
