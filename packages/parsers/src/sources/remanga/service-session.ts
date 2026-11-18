import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { REMANGA_TOKEN_REGEX, type RemangaServiceSession } from './models';

/** The service credential, kept separately from linked accounts and browser cookies. */
export const readRemangaServiceSession = async (
  path: string,
): Promise<RemangaServiceSession | null> => {
  let data: string;
  try {
    data = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    throw new Error('Invalid ReManga service session file');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('token' in parsed) ||
    typeof parsed.token !== 'string' ||
    !REMANGA_TOKEN_REGEX.test(parsed.token)
  ) {
    throw new Error('Invalid ReManga service session file');
  }
  const { token } = parsed;
  if (!('refreshToken' in parsed)) return { token };
  if (typeof parsed.refreshToken !== 'string' || !REMANGA_TOKEN_REGEX.test(parsed.refreshToken)) {
    throw new Error('Invalid ReManga service session file');
  }
  return { token, refreshToken: parsed.refreshToken };
};

/** Write secrets atomically, with owner-only file permissions. Never log the token. */
export const writeRemangaServiceSession = async (
  path: string,
  session: RemangaServiceSession,
): Promise<void> => {
  const { token, refreshToken } = session;
  if (!REMANGA_TOKEN_REGEX.test(token)) throw new Error('Invalid ReManga service token');
  if (refreshToken !== undefined && !REMANGA_TOKEN_REGEX.test(refreshToken)) {
    throw new Error('Invalid ReManga service refresh token');
  }
  const dir = dirname(path);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const temp = join(dir, `.remanga-${randomBytes(8).toString('hex')}.tmp`);
  try {
    await writeFile(temp, JSON.stringify({ token, refreshToken }), {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx',
    });
    await rename(temp, path);
  } finally {
    await unlink(temp).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    });
  }
};
