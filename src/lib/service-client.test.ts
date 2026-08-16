import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Actor } from './actor';
import { ServiceClient } from './service-client';
import { ServiceError, ServiceUnreachableError } from './service-error';

const actor: Actor = {
  discordId: '123456789012345678',
  guildId: '987654321098765432',
  roleIds: ['111111111111111111'],
  guildAdmin: false,
};

function stubFetch(response: Response | Error) {
  const fetchStub = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchStub);
  return fetchStub;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ServiceClient.request', () => {
  it('sends the shared key and the actor headers together', async () => {
    const fetchStub = stubFetch(jsonResponse(200, []));
    const client = new ServiceClient('http://service:8080/', 'dev-local-key');

    await client.get(actor, '/api/guilds/987654321098765432/events');

    const [url, init] = fetchStub.mock.calls[0]! as unknown as [string, RequestInit];
    // The trailing slash on the base URL must not survive into the path.
    expect(url).toBe('http://service:8080/api/guilds/987654321098765432/events');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer dev-local-key',
      'X-Actor-Discord-Id': '123456789012345678',
      'X-Actor-Guild-Id': '987654321098765432',
      'X-Actor-Roles': '111111111111111111',
      'X-Actor-Guild-Admin': 'false',
    });
  });

  it('omits actor headers for the routes guarded by the key alone', async () => {
    const fetchStub = stubFetch(jsonResponse(200, []));
    const client = new ServiceClient('http://service:8080', 'dev-local-key');

    await client.get(null, '/api/notifications');

    const [, init] = fetchStub.mock.calls[0]! as unknown as [string, RequestInit];
    expect(init.headers).not.toHaveProperty('X-Actor-Discord-Id');
  });

  it('reports the status alongside the body, since 200 and 202 mean different things', async () => {
    stubFetch(jsonResponse(202, { id: 'late-request' }));
    const client = new ServiceClient('http://service:8080', 'k');

    const { status, body } = await client.request(actor, 'PUT', '/api/events/e/signups/c', {
      status: 'CONFIRMED',
    });

    expect(status).toBe(202);
    expect(body).toEqual({ id: 'late-request' });
  });

  it('returns nothing for a 204', async () => {
    stubFetch(new Response(null, { status: 204 }));
    const client = new ServiceClient('http://service:8080', 'k');

    const { body } = await client.request(actor, 'DELETE', '/api/events/e/signups/c');

    expect(body).toBeUndefined();
  });

  it('carries a 4xx message through, because the service wrote it for a human', async () => {
    stubFetch(jsonResponse(403, { error: 'not your character' }));
    const client = new ServiceClient('http://service:8080', 'k');

    const error = await client.get(actor, '/api/events/e/signups').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).serviceMessage).toBe('not your character');
    expect((error as ServiceError).isForbidden).toBe(true);
    expect((error as ServiceError).isSafe()).toBe(true);
  });

  it('marks a 5xx unsafe to show, whatever it says', async () => {
    stubFetch(jsonResponse(500, { error: 'internal error' }));
    const client = new ServiceClient('http://service:8080', 'k');

    const error = (await client
      .get(actor, '/api/events/e')
      .catch((e: unknown) => e)) as ServiceError;

    expect(error.isSafe()).toBe(false);
  });

  it('distinguishes a service that never answered from one that refused', async () => {
    stubFetch(new TypeError('fetch failed'));
    const client = new ServiceClient('http://service:8080', 'k');

    const error = await client.get(actor, '/api/events/e').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnreachableError);
  });
});

describe('ServiceClient.follow', () => {
  it('defaults a link with no method to GET', async () => {
    const fetchStub = stubFetch(jsonResponse(200, {}));
    const client = new ServiceClient('http://service:8080', 'k');

    await client.follow(actor, { href: '/api/events/e/comps/main' });

    const [, init] = fetchStub.mock.calls[0]! as unknown as [string, RequestInit];
    expect(init.method).toBe('GET');
  });

  it('uses the verb the service named', async () => {
    const fetchStub = stubFetch(jsonResponse(200, {}));
    const client = new ServiceClient('http://service:8080', 'k');

    await client.follow(actor, { href: '/api/events/e/comps/main/lock', method: 'POST' });

    const [url, init] = fetchStub.mock.calls[0]! as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(url).toBe('http://service:8080/api/events/e/comps/main/lock');
  });
});
