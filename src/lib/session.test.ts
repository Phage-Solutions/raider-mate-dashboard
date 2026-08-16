import { describe, expect, it } from 'vitest';

import { newSession, openSession, sealSession, type Session } from './session';

const secret = Buffer.alloc(32, 7).toString('base64');
const otherSecret = Buffer.alloc(32, 9).toString('base64');

function aSession(): Session {
  return {
    ...newSession({
      discordId: '123456789012345678',
      username: 'thrall',
      avatar: null,
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenExpiresAt: 1_700_000_000_000,
    }),
    selectedGuildId: '987654321098765432',
    selectedGuildName: 'Method',
    roleIds: ['111111111111111111'],
    guildAdmin: true,
    actorFetchedAt: 1_700_000_000_000,
  };
}

describe('sealSession', () => {
  it('round trips a session', async () => {
    const session = aSession();
    const opened = await openSession(await sealSession(session, secret), secret);
    expect(opened).toEqual(session);
  });

  it('produces a different cookie each time for the same session', async () => {
    const session = aSession();
    const first = await sealSession(session, secret);
    const second = await sealSession(session, secret);
    expect(first).not.toEqual(second);
  });
});

describe('openSession', () => {
  it('rejects a cookie sealed with a different secret', async () => {
    const sealed = await sealSession(aSession(), otherSecret);
    expect(await openSession(sealed, secret)).toBeNull();
  });

  it('rejects a flipped byte rather than returning part of the payload', async () => {
    const sealed = await sealSession(aSession(), secret);
    const bytes = Buffer.from(sealed, 'base64url');
    const last = bytes.length - 1;
    bytes.writeUInt8(bytes.readUInt8(last) ^ 0xff, last);
    expect(await openSession(bytes.toString('base64url'), secret)).toBeNull();
  });

  it('rejects a cookie too short to hold an IV', async () => {
    expect(await openSession(Buffer.alloc(8).toString('base64url'), secret)).toBeNull();
  });

  it('rejects a payload from an older session version', async () => {
    const stale = { ...aSession(), v: 0 };
    expect(await openSession(await sealSession(stale, secret), secret)).toBeNull();
  });

  it('rejects a cookie that is not base64 at all', async () => {
    expect(await openSession('not a cookie', secret)).toBeNull();
  });
});

describe('sealSession with a malformed secret', () => {
  it('refuses a secret that is not 32 bytes', async () => {
    await expect(sealSession(aSession(), 'dG9vIHNob3J0')).rejects.toThrow('32 bytes');
  });
});
