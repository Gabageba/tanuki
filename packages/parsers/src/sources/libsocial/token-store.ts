import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export type LibSocialTokenState = {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms — derived from the token response's expires_in at the time it was fetched. */
  expiresAt: number;
};

export const readTokenStore = async (path: string): Promise<LibSocialTokenState | null> => {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as LibSocialTokenState;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
};

export const writeTokenStore = async (path: string, state: LibSocialTokenState): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2), 'utf-8');
};
