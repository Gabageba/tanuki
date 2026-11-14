import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';

const TOKEN_REGEX = /^[\\w.~+/-]{20,}=*$/;

type RemangaServiceSession = { token: string };

/** A single service credential, never a user's linked account or browser cookies. */
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
  const parsed: unknown = JSON.parse(data);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('token' in parsed) ||
    typeof parsed.token !== 'string' ||
    !TOKEN_REGEX.test(parsed.token)
  ) {
    throw new Error('Invalid ReManga service session file');
  }
  return { token: parsed.token };
};

/** Write secrets atomically, with owner-only file permissions. Never log the token. */
export const writeRemangaServiceSession = async (
  path: string,
  session: RemangaServiceSession,
): Promise<void> => {
  if (!TOKEN_REGEX.test(session.token)) throw new Error('Invalid ReManga service token');
  const dir = dirname(path);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const temp = join(dir, `.remanga-${randomBytes(8).toString('hex')}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(session), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temp, path);
  } finally {
    await unlink(temp).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    });
  }
};
