import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VIEW_MODE } from '@tanuki/contracts';
import { createRegistry } from '../src/registry';
import { runSourceContract } from '../src/core/source-contract';
import { SOURCE_ID, type SourceId } from '../src/sources/catalog';

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
  SOURCE_ID.DESUME,
  SOURCE_ID.READMANGA_RU,
  SOURCE_ID.MINTMANGA,
  SOURCE_ID.SELFMANGA,
  SOURCE_ID.SEIMANGA,
  SOURCE_ID.USAGI,
  // ALLHENTAI's catalog requires an authenticated session site-wide, via its own qawa.org SSO
  // gateway — separate credentials from the main network (see ALLHENTAI_USERNAME/PASSWORD and
  // sources/grouple/auth.ts). Included here, but will fail like any other source if those
  // secrets aren't configured for this run.
  SOURCE_ID.ALLHENTAI,
  SOURCE_ID.MANGALIB,
  SOURCE_ID.YAOILIB,
  // HENTAILIB's getPages() requires a session. CI seeds hentailib.json from its token secret.
  // Complete the initial login with login:libsocial hentailib (including the email code);
  // the engine then rotates the stored token without another interactive login.
  SOURCE_ID.HENTAILIB,
  SOURCE_ID.MANGACHAN,
  SOURCE_ID.HENCHAN,
  // YAOICHAN intentionally excluded: marked broken (`isBroken: true` in source-catalog.ts) —
  // every request times out at the connect/TLS stage, reproduces from multiple networks.
  //
  // REMANGA/MANGABUFF/INKSTORY are here too — see CI_ANTIBOT_FLAKY_SOURCE_IDS below for why
  // they're filtered out of the CI run specifically instead of being excluded outright.
  SOURCE_ID.REMANGA,
  SOURCE_ID.MANGABUFF,
  SOURCE_ID.INKSTORY,
  // Same inuko network as INKSTORY (see sources/inuko/config.ts), behind the same DDoS-Guard.
  SOURCE_ID.PUREMANGA,
  // COMX intentionally excluded: marked broken (`isBroken: true` in comx/index.ts) — every
  // request is gated behind a JS PoW + TLS/JA3 fingerprint challenge no undici client can pass.
  SOURCE_ID.TOMILOLIB,
  SOURCE_ID.WAMANGA,
  SOURCE_ID.NUDEMOON,
  // ACOMICS intentionally excluded: marked broken in the upstream kotatsu enum
  // (`isBroken: true` in registry.ts) independent of this port's own correctness.
  SOURCE_ID.SENKURO,
  // Shares SENKURO's backend but serves a disjoint catalog, selected by the `app-id` header
  // (see sources/senkuro/config.ts). Covered separately so a silent fallback to SENKURO's
  // catalog — what a wrong or missing app-id causes — doesn't go unnoticed.
  SOURCE_ID.SENKOGNITO,
  SOURCE_ID.HENTAICHAN_CC,
  SOURCE_ID.SEXKOMIX2,
  SOURCE_ID.MULTPORN,
  SOURCE_ID.MULTPORN_HENTAI,
];

// REMANGA/MANGABUFF/INKSTORY/PUREMANGA/NUDEMOON: known-flaky in the nightly workflow specifically — their
// Cloudflare/DDoS-Guard antibot (see looksLikeAntibotChallenge in core/http/classify.ts)
// challenges GitHub Actions' shared runner IP ranges with a 403, but the exact same requests
// pass from a residential IP (confirmed for NUDEMOON: g.nude-moon.fun returns 200 outside CI).
// The parser logic itself is correct — a red run for one of these most likely means "GitHub's
// IPs got flagged again," not a parsing regression — so they run locally (any residential/non-CI
// IP) but are skipped when GITHUB_ACTIONS is set, instead of being excluded outright like
// YAOICHAN/COMX/ACOMICS.
const CI_ANTIBOT_FLAKY_SOURCE_IDS: SourceId[] = [
  SOURCE_ID.REMANGA,
  SOURCE_ID.MANGABUFF,
  SOURCE_ID.INKSTORY,
  SOURCE_ID.PUREMANGA,
  SOURCE_ID.NUDEMOON,
];

const RUN_SOURCE_IDS =
  process.env['GITHUB_ACTIONS'] === 'true'
    ? IMPLEMENTED_SOURCE_IDS.filter((id) => !CI_ANTIBOT_FLAKY_SOURCE_IDS.includes(id))
    : IMPLEMENTED_SOURCE_IDS;

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
    nudemoon:
      process.env['NUDEMOON_USERNAME'] && process.env['NUDEMOON_PASSWORD']
        ? { username: process.env['NUDEMOON_USERNAME'], password: process.env['NUDEMOON_PASSWORD'] }
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

// Прогрев сессий не расходует время первого источника. Закрываем HTTP-клиенты и после ошибок.
beforeAll(() => registry.init());
afterAll(() => registry.close());

describe.each(RUN_SOURCE_IDS)('contract: %s', (sourceId) => {
  it('getList -> getDetails -> getPages resolves a full read path', async () => {
    // Сама проверка живёт в src/core/source-contract.ts, а не здесь: тот же путь чтения гоняет
    // рантаймовый пробник в apps/api, который и проставляет источникам статус. Будь описание
    // «рабочего источника» в двух местах, статус в проде и результат этого теста разошлись бы.
    await expect(runSourceContract(registry.get(sourceId))).resolves.toBeUndefined();
  });
});

/**
 * Главная сайта для подборок: каждый описанный блок непуст, у тайтлов есть название и адрес,
 * в каждом блоке есть обложки. Отдельная карточка может честно не иметь обложки на сайте.
 * Ловит переезд вёрстки главной — блок, которого не нашлось, парсер отдаёт пустым, и в
 * приложении он просто пропал бы молча.
 */
const HOME_SOURCE_IDS = RUN_SOURCE_IDS.filter(
  (id) => registry.get(id).info.homeSections.length > 0,
);

describe.each(HOME_SOURCE_IDS)('contract home: %s', (sourceId) => {
  it('getHome fills every described section', async () => {
    const parser = registry.get(sourceId);

    const sections = await parser.getHome!();

    expect(sections.map(({ id }) => id)).toEqual(parser.info.homeSections.map(({ id }) => id));
    for (const section of sections) {
      if (section.viewMode !== VIEW_MODE.COVERLESS) {
        expect(section.items.length, section.id).toBeGreaterThan(0);
        expect(
          section.items.some((item) => Boolean(item.coverUrl)),
          `${section.id}: covers`,
        ).toBe(true);
      }
      for (const item of section.items) {
        expect(item.title, section.id).toBeTruthy();
        expect(item.url, section.id).toBeTruthy();
        if (item.coverUrl !== null) expect(item.coverUrl, section.id).toMatch(/^https?:\/\//);
      }
    }
  });
});
