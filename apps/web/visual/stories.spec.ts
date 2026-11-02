import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';
import {
  DESKTOP_VIEWPORT,
  FIXED_NOW,
  INDEX_ENTRY_TYPE,
  MOBILE_VIEWPORT,
  MOBILE_VIEWPORT_ID,
  RENDER_PHASE,
  STORYBOOK_STATIC_URL,
  type IndexEntry,
  type StorybookWindow,
} from './models';

const INDEX = JSON.parse(readFileSync(new URL('index.json', STORYBOOK_STATIC_URL), 'utf8')) as {
  entries: Record<string, IndexEntry>;
};

/** Каждая история снимается в обеих темах. */
const COLOR_SCHEMES = [COLOR_SCHEME.DARK, COLOR_SCHEME.LIGHT];

const STORIES = Object.values(INDEX.entries).filter(
  (entry) => entry.type === INDEX_ENTRY_TYPE.STORY,
);

/** Открывает историю и ждёт, пока она отрисуется, отработает `play` и догрузятся шрифты и картинки. */
const openStory = async (page: Page, id: string, colorScheme: ColorScheme) => {
  await page.goto(`iframe.html?id=${id}&viewMode=story&globals=colorScheme:${colorScheme}`);

  const phase = await page.waitForFunction(
    (phases: string[]) => {
      const current = (window as StorybookWindow).__STORYBOOK_PREVIEW__?.currentRender?.phase;
      return phases.includes(current ?? '') && current;
    },
    [RENDER_PHASE.FINISHED, RENDER_PHASE.ERRORED],
  );
  expect(await phase.jsonValue(), 'история упала при отрисовке или в play').toBe(
    RENDER_PHASE.FINISHED,
  );

  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.images);
    // Ленивая картинка за краем экрана не грузится вовсе, а снимок страницы целиком её покажет.
    images.forEach((image) => image.setAttribute('loading', 'eager'));
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  });
};

/** Вьюпорт, который история задаёт себе через `globals` (`MOBILE_GLOBALS`). */
const getStoryViewport = (page: Page) =>
  page.evaluate(
    () =>
      (window as StorybookWindow).__STORYBOOK_PREVIEW__?.currentRender?.story?.storyGlobals
        ?.viewport?.value,
  );

for (const story of STORIES) {
  for (const colorScheme of COLOR_SCHEMES) {
    test(`${story.title} › ${story.name} › ${colorScheme}`, async ({ page }) => {
      await page.clock.setFixedTime(FIXED_NOW);
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await openStory(page, story.id, colorScheme);

      // Ширину телефона история узнаёт только после загрузки — тогда открываем её заново, уже
      // в нужном вьюпорте, чтобы медиазапросы сработали с первой отрисовки.
      if ((await getStoryViewport(page)) === MOBILE_VIEWPORT_ID) {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await openStory(page, story.id, colorScheme);
      }

      // Long reader feeds exceed Chromium's screenshot height limit; inspect their viewport.
      // reader.spec.ts separately checks scrolling and the mounted image window.
      const fullPage = await page.evaluate(() => document.documentElement.scrollHeight < 30_000);
      await expect(page).toHaveScreenshot([story.id, `${colorScheme}.png`], { fullPage });
    });
  }
}
