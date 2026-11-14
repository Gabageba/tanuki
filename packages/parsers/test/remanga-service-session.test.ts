import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readRemangaServiceSession,
  writeRemangaServiceSession,
} from '../src/sources/remanga/service-session';

const dirs: string[] = [];
const TOKEN = 'valid-remanga-browser-session-token';

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('ReManga service session file', () => {
  it('saves the token outside the repository, loads it and restricts permissions', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tanuki-remanga-'));
    dirs.push(dir);
    const path = join(dir, 'nested', 'remanga.json');
    expect(await readRemangaServiceSession(path)).toBeNull();
    await writeRemangaServiceSession(path, { token: TOKEN });
    expect(await readRemangaServiceSession(path)).toEqual({ token: TOKEN });
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({ token: TOKEN });
    if (process.platform !== 'win32') {
      expect((await stat(path)).mode & 0o777).toBe(0o600);
    }
  });

  it('replaces a saved session without leaving temporary files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tanuki-remanga-'));
    dirs.push(dir);
    const path = join(dir, 'remanga.json');
    await writeRemangaServiceSession(path, { token: TOKEN });
    await writeRemangaServiceSession(path, { token: 'another-remanga-browser-session-token' });
    expect(await readRemangaServiceSession(path)).toEqual({
      token: 'another-remanga-browser-session-token',
    });
  });

  it('rejects invalid token data', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tanuki-remanga-'));
    dirs.push(dir);
    await expect(writeRemangaServiceSession(join(dir, 'remanga.json'), { token: 'bad' }))
      .rejects.toThrow('Invalid ReManga service token');
  });
});
