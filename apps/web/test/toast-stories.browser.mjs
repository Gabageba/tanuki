import process from 'node:process';
import { URL } from 'node:url';
import { setTimeout } from 'node:timers';
import { log } from 'node:console';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { chromium, expect } from '@playwright/test';

const ROOT = process.env.TOAST_STORYBOOK_URL ?? 'http://127.0.0.1:6007';
const INDEX = JSON.parse(
  await readFile(new URL('../storybook-static/index.json', import.meta.url), 'utf8'),
);
const STORIES = Object.values(INDEX.entries).filter(
  (entry) =>
    entry.type === 'story' &&
    /ToastCard|ToastHost|ToastAction|PwaOfferMessage|UndoToastMessage|Тосты\/Уведомления/.test(
      entry.title,
    ),
);

test(
  'истории общих тостов: темы, языки, телефон, модалка и drawer',
  { timeout: 180_000 },
  async () => {
    let staticServer;
    if (
      !(await globalThis
        .fetch(`${ROOT}/index.json`)
        .then((response) => response.ok)
        .catch(() => false))
    ) {
      staticServer = spawn(process.execPath, ['visual/serve.ts'], { stdio: 'ignore' });
      for (let attempt = 0; attempt < 50; attempt++) {
        if (
          await globalThis
            .fetch(`${ROOT}/index.json`)
            .then((response) => response.ok)
            .catch(() => false)
        )
          break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    const browser = await chromium.launch();
    try {
      await Promise.all(
        [
          { theme: 'dark', language: 'ru', width: 1280, height: 800 },
          { theme: 'light', language: 'en', width: 1280, height: 800 },
          { theme: 'dark', language: 'en', width: 360, height: 740 },
          { theme: 'light', language: 'ru', width: 360, height: 740 },
        ].map(async (variant) => {
          const page = await browser.newPage({
            viewport: { width: variant.width, height: variant.height },
          });
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
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
            assert.equal((await page.locator('[data-toast-id]').count()) <= 3, true);
            const boxes = await page.locator('[data-toast-id]').evaluateAll((nodes) =>
              nodes.map((node) => {
                const box = node.getBoundingClientRect();
                return {
                  left: box.left,
                  right: box.right,
                  top: box.top,
                  bottom: box.bottom,
                  width: box.width,
                };
              }),
            );
            for (const box of boxes) {
              assert.ok(
                box.left >= 7 && box.right <= variant.width - 7,
                `${story.id}: horizontal bounds ${JSON.stringify(box)}`,
              );
              assert.ok(
                box.bottom <= variant.height,
                `${story.id}: vertical bounds ${JSON.stringify(box)}`,
              );
            }
            if (story.id === 'тосты-toasthost--mixed' && variant.language === 'ru') {
              await page.screenshot({
                path: `/tmp/tanuki-toasts-${variant.theme}-${variant.width}.png`,
              });
            }
            if (/--modal$|--drawer$/.test(story.id)) {
              await expect(page.locator('[role="dialog"] [data-toast-id]')).toHaveCount(1);
              const close = page.locator('[data-toast-id] button').last();
              await close.focus();
              await expect(close).toBeFocused();
              await page.keyboard.press('Tab');
              assert.ok(
                await page
                  .locator('[role="dialog"]')
                  .evaluate((dialog) => dialog.contains(globalThis.document.activeElement)),
                'Tab остаётся внутри модалки вместе с тостом',
              );
            }
          }
          assert.deepEqual(errors, []);
          log(
            `Проверены ${STORIES.length} историй: ${variant.theme}, ${variant.language}, ${variant.width}px`,
          );
          await page.close();
        }),
      );
      const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
      await page.goto(
        `${ROOT}/iframe.html?id=тосты-toasthost--modal&viewMode=story&globals=language:ru`,
      );
      await page.waitForFunction(
        () => globalThis.window.__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished',
      );
      const save = page.getByRole('button', { name: 'Сохранить', exact: true });
      await save.scrollIntoViewIfNeeded();
      const saveBox = await save.boundingBox();
      const toastBox = await page.locator('[data-toast-id]').boundingBox();
      await page.screenshot({ path: '/tmp/tanuki-toasts-modal-low.png' });
      assert.ok(
        saveBox.y + saveBox.height <= toastBox.y,
        'кнопка сохранения прокручивается над тостом',
      );
      await page.close();
    } finally {
      await browser.close();
      staticServer?.kill();
    }
  },
);
