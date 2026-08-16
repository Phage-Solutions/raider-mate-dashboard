import { describe, expect, it } from 'vitest';

import { actorHeaders } from './actor';

describe('actorHeaders', () => {
  it('joins role ids the way the service splits them', () => {
    const headers = actorHeaders({
      discordId: '123456789012345678',
      guildId: '987654321098765432',
      roleIds: ['111111111111111111', '222222222222222222'],
      guildAdmin: false,
    });

    expect(headers).toEqual({
      'X-Actor-Discord-Id': '123456789012345678',
      'X-Actor-Guild-Id': '987654321098765432',
      'X-Actor-Guild-Admin': 'false',
      'X-Actor-Roles': '111111111111111111,222222222222222222',
    });
  });

  it('omits the roles header entirely when the raider has none', () => {
    const headers = actorHeaders({
      discordId: '123456789012345678',
      guildId: '987654321098765432',
      roleIds: [],
      guildAdmin: true,
    });

    expect(headers['X-Actor-Roles']).toBeUndefined();
    expect(headers['X-Actor-Guild-Admin']).toBe('true');
  });

  it('keeps snowflakes as strings, since they do not survive a number', () => {
    const headers = actorHeaders({
      discordId: '9007199254740993',
      guildId: '9007199254740995',
      roleIds: [],
      guildAdmin: false,
    });

    expect(headers['X-Actor-Discord-Id']).toBe('9007199254740993');
    expect(headers['X-Actor-Guild-Id']).toBe('9007199254740995');
  });
});
