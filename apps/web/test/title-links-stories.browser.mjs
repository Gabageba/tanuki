import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';
import { URL } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = process.env.TITLE_LINKS_STORYBOOK_URL ?? 'http://127.0.0.1:6007';
const INDEX = JSON.parse(
  await readFile(new URL('../storybook-static/index.json', import.meta.url), 'utf8'),
);
const STORIES = Object.values(INDEX.entries).filter(
  (entry) =>
    entry.type === 'story' &&
    /TitleMatches$|TitleMatchAddModal$|BookmarkFolderModal$/.test(entry.title),
);

test(
  'подтверждение связей: выбор, очередь, ошибка и конфликт папок в двух темах и языках',
  { timeout: 240_000 },
  async () => {
    assert.ok(STORIES.length >= 19, 'Истории подтверждения связей должны попасть в сборку');
    let server;
    const isReady = () =>
      globalThis
        .fetch(`${ROOT}/index.json`)
        .then((response) => response.ok)
        .catch(() => false);
    if (!(await isReady())) {
      server = spawn(process.execPath, ['visual/serve.ts'], { stdio: 'ignore' });
      for (let attempt = 0; attempt < 50 && !(await isReady()); attempt++) await setTimeout(100);
    }
    const browser = await chromium.launch();
    try {
      await Promise.all(
        [
          { theme: 'dark', language: 'ru', width: 1280 },
          { theme: 'light', language: 'en', width: 1280 },
          { theme: 'dark', language: 'en', width: 375 },
          { theme: 'light', language: 'ru', width: 375 },
        ].map(async (variant) => {
          const page = await browser.newPage({ viewport: { width: variant.width, height: 900 } });
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          try {
            for (const story of STORIES) {
              await page.goto(
                `${ROOT}/iframe.html?id=${story.id}&viewMode=story&globals=colorScheme:${variant.theme};language:${variant.language}`,
              );
              await page.waitForFunction(() =>
                ['finished', 'errored'].includes(
                  globalThis.window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
                ),
              );
              const phase = await page.evaluate(
                () => globalThis.window.__STORYBOOK_PREVIEW__.currentRender.phase,
              );
              assert.equal(phase, 'finished', `${story.id} ${JSON.stringify(variant)}`);
              assert.deepEqual(errors, [], `${story.id}: ошибки страницы`);
              const bounds = await page.locator('body').evaluate((body) => ({
                scroll: body.scrollWidth,
                width: globalThis.window.innerWidth,
              }));
              assert.ok(
                bounds.scroll <= bounds.width,
                `${story.id}: горизонтальное переполнение ${JSON.stringify(bounds)}`,
              );
              if (
                /TitleMatches$/.test(story.title) &&
                /--selected$|--bookmark-conflict$|--loading$/.test(story.id)
              ) {
                await page.screenshot({
                  path: `/tmp/tanuki-title-links-${story.id.split('--')[1]}-${variant.theme}-${variant.width}.png`,
                  fullPage: true,
                });
              }
            }
          } finally {
            await page.close();
          }
        }),
      );
    } finally {
      await browser?.close();
      server?.kill();
    }
  },
);
