import type { APIRoute } from 'astro';

import { ServiceError } from '../../lib/service-error';
import { noticeCodeFor } from '../../lib/service-notice';

export const prerender = false;

/**
 * Registers a character for the signed-in raider. The path is built here rather than
 * followed, because there is no resource to carry a link yet: the guild id comes from
 * the sealed session, never from the form, so a snowflake typed into a field cannot
 * reach another guild's roster.
 */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const back = (notice: string) => redirect(`/characters?notice=${notice}`);

  const form = await request.formData();
  const name = form.get('name');
  const realm = form.get('realm');
  const region = form.get('region');
  if (typeof name !== 'string' || typeof realm !== 'string' || typeof region !== 'string') {
    return back('invalid');
  }

  try {
    await client.request(actor, 'POST', `/api/guilds/${session.selectedGuildId}/characters`, {
      name: name.trim(),
      realm: realm.trim(),
      region: region.trim(),
      // The service grants the main flag only while the raider has no main, so this is
      // a request rather than an assertion and is safe to send every time.
      is_main: form.get('is_main') === 'true',
    });
    return back('registered');
  } catch (error) {
    if (error instanceof ServiceError && error.status === 409) {
      return back('duplicate');
    }
    if (error instanceof ServiceError && error.status === 400) {
      return back('invalid');
    }
    return back(noticeCodeFor(error));
  }
};
