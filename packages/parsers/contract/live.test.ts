import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { describe, expect, it } from 'vitest';
import { createRegistry } from '../src/registry';
import type { SourceId } from '../src/sources/catalog';

// Mirrors scripts/libsocial-login.ts: GROUPLE_USERNAME etc. live in apps/api/.env rather than
// needing a separate file here. Silently no-ops if that file doesn't exist (e.g. CI, where these
// arrive as real env vars via secrets instead).
loadDotenv({ path: resolve(__dirname, '../../../apps/api/.env'), quiet: true });

/**
 * Live network port of the old apps/parsers/src/test/kotlin/.../SourceContractTest.kt — hits
 * real sites, so it only runs in .github/workflows/parsers-nightly.yml, never in PR CI. One
 * source's real-world markup drift shouldn't hide another's, hence allSettled semantics: every
 * implemented source gets its own it.each entry instead of one test that stops at the first
 * failure.
 */
const IMPLEMENTED_SOURCE_IDS: SourceId[] = [
  'DESUME',
  'READMANGA_RU',
  'MINTMANGA',
  'SELFMANGA',
  'SEIMANGA',
  'USAGI',
  // ALLHENTAI's catalog requires an authenticated session site-wide, via its own qawa.org SSO
  // gateway — separate credentials from the main network (see ALLHENTAI_USERNAME/PASSWORD and
  // sources/grouple/auth.ts). Included here, but will fail like any other source if those
  // secrets aren't configured for this run.
  'ALLHENTAI',
  'MANGALIB',
  'YAOILIB',
  // HENTAILIB's getPages() is gated site-wide behind an authenticated session (see
  // LIBSOCIAL_CONFIGS.HENTAILIB.auth in sources/libsocial/config.ts) — login itself is
  // reCAPTCHA-gated and can only be driven by a human, once, via
  // `pnpm --filter @tanuki/parsers login:libsocial HENTAILIB` (see scripts/libsocial-login.ts).
  // After that one-time login, getValidAccessToken() refreshes the access token on its own from
  // the stored refresh_token — no further human step — as long as LIBSOCIAL_TOKEN_STORE_DIR
  // points at a directory holding that token file. Included here, but will fail like any other
  // source if that directory/token isn't configured for this run.
  'HENTAILIB',
  'MANGACHAN',
  'HENCHAN',
  // YAOICHAN intentionally excluded: marked broken (`isBroken: true` in source-catalog.ts) —
  // every request times out at the connect/TLS stage, reproduces from multiple networks.
  'REMANGA',
  'MANGABUFF',
  'INKSTORY',
  // COMX intentionally excluded: marked broken (`isBroken: true` in comx/index.ts) — every
  // request is gated behind a JS PoW + TLS/JA3 fingerprint challenge no undici client can pass.
  'TOMILOLIB',
  'WAMANGA',
  'NUDEMOON',
  // ACOMICS intentionally excluded: marked broken in the upstream kotatsu enum
  // (`isBroken: true` in registry.ts) independent of this port's own correctness.
  'SENKURO',
  // Shares SENKURO's backend but serves a disjoint catalog, selected by the `app-id` header
  // (see sources/senkuro/config.ts). Covered separately so a silent fallback to SENKURO's
  // catalog — what a wrong or missing app-id causes — doesn't go unnoticed.
  'SENKOGNITO',
  'HENTAICHAN_CC',
  'SEXKOMIX2',
  'MULTPORN',
  'MULTPORN_HENTAI',
];

const registry = createRegistry({
  credentials: {
    grouple:
      process.env['GROUPLE_USERNAME'] && process.env['GROUPLE_PASSWORD']
        ? { username: process.env['GROUPLE_USERNAME'], password: process.env['GROUPLE_PASSWORD'] }
        : undefined,
    allhentai:
      process.env['ALLHENTAI_USERNAME'] && process.env['ALLHENTAI_PASSWORD']
        ? {
            username: process.env['ALLHENTAI_USERNAME'],
            password: process.env['ALLHENTAI_PASSWORD'],
          }
        : undefined,
    // Same default as apps/api/src/config/env.ts, so the token written by
    // `login:libsocial` is picked up here without a separate LIBSOCIAL_TOKEN_STORE_DIR entry.
    libsocial: {
      tokenStoreDir:
        process.env['LIBSOCIAL_TOKEN_STORE_DIR'] ??
        resolve(__dirname, '../../../data/libsocial-tokens'),
    },
  },
  logger: { info: () => {}, warn: (msg) => console.warn(msg), error: (msg) => console.error(msg) },
});

describe.each(IMPLEMENTED_SOURCE_IDS)('contract: %s', (sourceId) => {
  it('getList -> getDetails -> getPages resolves a full read path', async () => {
    await registry.init();
    const parser = registry.get(sourceId);

    const list = await parser.getList({ offset: 0, limit: 20 });
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]!.chapters).toBeNull();

    const details = await parser.getDetails(list[0]!.url);
    expect(details.chapters).not.toBeNull();
    expect(details.chapters!.length).toBeGreaterThan(0);

    const pages = await parser.getPages(details.chapters![0]!.url);
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
  });
});
