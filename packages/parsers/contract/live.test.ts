import { describe, expect, it } from 'vitest';
import { createRegistry } from '../src/registry';

/**
 * Live network port of the old apps/parsers/src/test/kotlin/.../SourceContractTest.kt — hits
 * real sites, so it only runs in .github/workflows/parsers-nightly.yml, never in PR CI. One
 * source's real-world markup drift shouldn't hide another's, hence allSettled semantics: every
 * implemented source gets its own it.each entry instead of one test that stops at the first
 * failure.
 */
const IMPLEMENTED_SOURCE_IDS = [
  'DESUME',
  'READMANGA_RU',
  'MINTMANGA',
  'SELFMANGA',
  'SEIMANGA',
  'USAGI',
  // ALLHENTAI intentionally excluded: its catalog requires an authenticated session
  // site-wide, and its SSO gateway is qawa.org — a separate login GROUPLE_USERNAME/PASSWORD
  // (the main network's credentials) doesn't cover. See sources/grouple/auth.ts. This is a
  // known limitation, not a regression, so it's not part of the always-must-pass contract.
] as const;

const registry = createRegistry({
  credentials: {
    grouple:
      process.env['GROUPLE_USERNAME'] && process.env['GROUPLE_PASSWORD']
        ? { username: process.env['GROUPLE_USERNAME'], password: process.env['GROUPLE_PASSWORD'] }
        : undefined,
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
