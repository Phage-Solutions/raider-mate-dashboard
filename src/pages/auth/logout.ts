import type { APIRoute } from 'astro';

import { SESSION_COOKIE } from '../../lib/session';

export const prerender = false;

// POST only. A signing-out GET can be triggered by any image tag on any page.
export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/');
};
