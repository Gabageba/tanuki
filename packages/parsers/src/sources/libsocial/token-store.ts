import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { LibSocialTokenState, TokenStore } from '../../core/source-accounts';

export type { LibSocialTokenState };

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

/** Токен сервисной учётки — файл, который пишет scripts/libsocial-login.ts. */
export const fileTokenStore = (path: string): TokenStore => ({
  key: path,
  read: () => readTokenStore(path),
  write: (state) => writeTokenStore(path, state),
});
