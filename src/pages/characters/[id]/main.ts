import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { noticeCodeFor } from '../../../lib/service-notice';
import { findOwnCharacter } from '../../../lib/own-character';

export const prerender = false;

/** Moves the main flag onto this character. is_main is the only editable field. */
export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const back = (notice: string) => redirect(`/characters?notice=${notice}`);

  try {
    const character = await findOwnCharacter(client, actor, session.discordId, params.id!);
    const link = character && getLink(character, 'edit');
    if (!link) {
      return back('denied');
    }

    await client.follow(actor, link, { is_main: true });
    return back('saved');
  } catch (error) {
    return back(noticeCodeFor(error));
  }
};
