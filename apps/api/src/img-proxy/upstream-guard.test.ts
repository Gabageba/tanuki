import { describe, expect, it } from 'vitest';
import { guardedLookup, isAllowedUpstreamUrl, isBlockedAddress } from './upstream-guard';

describe('isBlockedAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.0',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
  ])('закрывает %s', (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946'])('пропускает %s', (address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });
});

describe('isAllowedUpstreamUrl', () => {
  it('пропускает http(s) с именем хоста — его проверит lookup агента', () => {
    expect(isAllowedUpstreamUrl('https://cdn.example.com/cover.jpg')).toBe(true);
    expect(isAllowedUpstreamUrl('http://localhost/cover.jpg')).toBe(true);
  });

  it('отказывает в других схемах и в закрытых адресах-литералах', () => {
    expect(isAllowedUpstreamUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUpstreamUrl('ftp://example.com/a.jpg')).toBe(false);
    expect(isAllowedUpstreamUrl('http://127.0.0.1:6379/')).toBe(false);
    expect(isAllowedUpstreamUrl('http://[::1]/')).toBe(false);
    expect(isAllowedUpstreamUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isAllowedUpstreamUrl('не адрес')).toBe(false);
  });
});

describe('guardedLookup', () => {
  it('не открывает соединение с именем, которое резолвится в loopback', async () => {
    const error = await new Promise<NodeJS.ErrnoException | null>((resolve) => {
      guardedLookup('localhost', {}, (lookupError) => resolve(lookupError));
    });
    expect(error?.code).toBe('EBLOCKED');
  });
});
