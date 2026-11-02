import { expect, test, type Page } from '@playwright/test';
import type { ReaderTestWindow } from './models';

const openReader = async (page: Page, story: string) => {
  await page.goto(`iframe.html?id=страницы-читалка--${story}&viewMode=story`);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('header')).toContainText('Берсерк');
};
const counter = (page: Page) => page.locator('.mantine-AppShell-header');
const pageSlots = (page: Page) => page.locator('main [data-reader-page-key]');

for (const width of [1280, 375]) {
  for (const story of ['horizontal', 'loading-horizontal']) {
    test(`смена темы доступна при чтении и загрузке: ${width}px, ${story}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.setViewportSize({ width, height: 800 });
      await page.goto(
        `iframe.html?id=страницы-читалка--${story}&viewMode=story&globals=colorScheme:light`,
      );
      const darkTheme = page.getByRole('button', { name: 'Переключить на тему «Тёмная»' });
      await expect(darkTheme).toHaveCount(1);
      await expect(darkTheme).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      const lightBackground = await page
        .locator('main')
        .evaluate((main) => getComputedStyle(main).backgroundColor);
      await darkTheme.click();
      await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'dark');
      const darkBackground = await page
        .locator('main')
        .evaluate((main) => getComputedStyle(main).backgroundColor);
      expect(darkBackground).not.toBe(lightBackground);

      await page.getByRole('button', { name: 'Переключить на тему «Системная»' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'light');
      await expect
        .poll(() =>
          page.evaluate(() => JSON.parse(localStorage.getItem('tanuki-settings')!).colorScheme),
        )
        .toBe('auto');
      await page.getByRole('button', { name: 'Переключить на тему «Светлая»' }).click();
      await expect
        .poll(() =>
          page.evaluate(() => JSON.parse(localStorage.getItem('tanuki-settings')!).colorScheme),
        )
        .toBe('light');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}

test('RTL: порядок страниц, шаг разворота и нечётный конец главы', async ({ page }) => {
  await openReader(page, 'rtl-spread');
  await expect(counter(page)).toContainText('1–2 / 8');
  const first = await pageSlots(page).nth(0).boundingBox();
  const second = await pageSlots(page).nth(1).boundingBox();
  expect(first!.x).toBeGreaterThan(second!.x);
  await page.keyboard.press('ArrowLeft');
  await expect(counter(page)).toContainText('3–4 / 8');
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toContainText('1–2 / 8');
  await page.keyboard.press('End');
  await expect(counter(page)).toContainText('7–8 / 8');
  await openReader(page, 'odd-last-page');
  await expect(counter(page)).toContainText('5 / 5');
  await expect(pageSlots(page)).toHaveCount(1);
  const box = await pageSlots(page).first().boundingBox();
  expect(Math.abs(box!.x + box!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(2);
});

test('граница глав: назад открывается последняя пара, вперёд — первая', async ({ page }) => {
  await openReader(page, 'rtl-spread');
  await expect(counter(page)).toContainText('1–2 / 8');
  const chapter = await pageSlots(page).first().getAttribute('data-chapter-id');
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toContainText('7–8 / 8');
  expect(await pageSlots(page).first().getAttribute('data-chapter-id')).not.toBe(chapter);
  await page.keyboard.press('ArrowLeft');
  await expect(counter(page)).toContainText('1–2 / 8');
  await expect(pageSlots(page).first()).toHaveAttribute('data-chapter-id', chapter!);
});

test('последняя страница пары отмечает главу, прогресс сохраняет первую', async ({ page }) => {
  const reads: unknown[] = [];
  const saves: { pageIndex: number }[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/chapter-reads'))
      reads.push(request.postDataJSON());
    if (request.method() === 'PUT' && request.url().endsWith('/progress'))
      saves.push(request.postDataJSON());
  });
  await openReader(page, 'rtl-spread');
  await expect(counter(page)).toContainText('1–2 / 8');
  await page.keyboard.press('End');
  await expect(counter(page)).toContainText('7–8 / 8');
  await expect.poll(() => reads.length).toBeGreaterThan(0);
  await expect.poll(() => saves.at(-1)?.pageIndex).toBe(6);
});

test('смена режима сохраняет позицию; клавиатура не вмешивается в drawer', async ({ page }) => {
  await openReader(page, 'rtl-spread');
  await expect(counter(page)).toContainText('1–2 / 8');
  await page.keyboard.press('ArrowLeft');
  await expect(counter(page)).toContainText('3–4 / 8');
  await page.keyboard.press('m');
  await expect(counter(page)).toContainText('3 / 8');
  await expect
    .poll(async () => (await page.locator('[data-page-index="2"]').boundingBox())?.y)
    .toBeLessThan(5);
  await page.keyboard.press('m');
  await expect(counter(page)).toContainText('3–4 / 8');
  await page.getByRole('button', { name: 'Настройки читалки', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('End');
  await page.keyboard.press('m');
  await expect(counter(page)).toContainText('3–4 / 8');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Control+ArrowLeft');
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', repeat: true })),
  );
  await expect(counter(page)).toContainText('3–4 / 8');
});

test('200 страниц: тяжёлое окно ограничено, нулевая предзагрузка не делает лишних запросов', async ({
  page,
}) => {
  const images = new Set<string>();
  const chapters = new Set<string>();
  page.on('request', (request) => {
    if (request.url().includes('/img?chapter=')) images.add(request.url());
    if (request.url().endsWith('/pages')) chapters.add(request.url());
  });
  await openReader(page, 'no-prefetch');
  await expect(pageSlots(page)).toHaveCount(200);
  await expect(page.locator('main img')).toHaveCount(1);
  await page.waitForTimeout(400);
  expect(images.size).toBe(1);
  expect(chapters.size).toBe(1);
  await page.keyboard.press('End');
  await expect(counter(page)).toContainText('200 / 200');
  await expect.poll(() => page.locator('main img').count()).toBeLessThanOrEqual(2);
  await page.waitForTimeout(400);
  expect(images.size).toBeLessThanOrEqual(3);
  expect(chapters.size).toBe(1);
});

test('прямая ссылка и неизвестные размеры удерживают страницу 151', async ({ page }) => {
  await openReader(page, 'unknown-sizes');
  await expect(counter(page)).toContainText('151 / 200');
  await expect(pageSlots(page)).toHaveCount(200);
  await expect
    .poll(async () => (await page.locator('[data-page-index="150"]').boundingBox())?.y)
    .toBeLessThan(5);
  await page.waitForTimeout(500);
  await expect(counter(page)).toContainText('151 / 200');
  expect(await page.locator('main img').count()).toBeLessThanOrEqual(8);
  await page.keyboard.press('m');
  await expect(counter(page)).toContainText('151 / 200');
  await expect(pageSlots(page)).toHaveCount(1);
  await page.keyboard.press('m');
  await expect
    .poll(async () => {
      const box = await page.locator('[data-page-index="150"]').boundingBox();
      return box ? Math.abs(box.y) : Infinity;
    })
    .toBeLessThan(5);
});

test('разворот выровнен сверху на телефоне и компьютере', async ({ page }) => {
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await openReader(page, 'mixed-spread');
    await expect(page.locator('main img')).toHaveCount(2);
    await expect
      .poll(async () =>
        page
          .locator('main img')
          .evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)),
      )
      .toBe(true);
    const first = (await pageSlots(page).nth(0).boundingBox())!;
    const second = (await pageSlots(page).nth(1).boundingBox())!;
    expect(Math.abs(first.y - second.y)).toBeLessThan(1);
    expect(first.height).not.toBe(second.height);
    expect(first.height).toBeLessThanOrEqual(800);
    expect(second.height).toBeLessThanOrEqual(800);
    expect(first.width + second.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

test('неподдерживаемый fullscreen скрыт, отказ API не прерывает чтение', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false }),
  );
  await openReader(page, 'horizontal');
  await expect(counter(page)).toContainText('1 / 8');
  await expect(page.getByRole('button', { name: 'На весь экран', exact: true })).toHaveCount(0);
  await page.keyboard.press('f');
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toContainText('2 / 8');
});

test('двойной тап увеличивает изображение, панорамирование не перелистывает', async ({ page }) => {
  await openReader(page, 'horizontal');
  await expect(counter(page)).toContainText('1 / 8');
  await page.mouse.dblclick(640, 400, { delay: 70 });
  await expect(page.locator('main [style*="scale(2)"]')).toHaveCount(1);
  await page.mouse.move(800, 400);
  await page.mouse.down();
  await page.mouse.move(350, 400, { steps: 6 });
  await page.mouse.up();
  await expect(counter(page)).toContainText('1 / 8');
  await page.mouse.dblclick(640, 400, { delay: 70 });
  await expect(page.locator('main [style*="scale(2)"]')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toContainText('2 / 8');
});

test('высокая страница в постраничном режиме прокручивается пальцем', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 400 });
  await openReader(page, 'default');
  await expect(counter(page)).toContainText('1 / 8');
  await page.keyboard.press('m');
  await expect(pageSlots(page)).toHaveCount(1);
  const slot = pageSlots(page).first();
  const box = (await slot.boundingBox())!;
  expect(box.height).toBeGreaterThan(400);
  const initialScroll = await page.evaluate(() => window.scrollY);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 180, y: 280, id: 1 }],
  });
  for (const y of [250, 220, 190, 160, 130]) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 180, y, id: 1 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(initialScroll + 50);
  await expect(counter(page)).toContainText('1 / 8');
});

test('свайп и pinch через реальные touch-события', async ({ page, context }) => {
  await openReader(page, 'horizontal');
  await expect(counter(page)).toContainText('1 / 8');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 900, y: 400, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 300, y: 400, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(counter(page)).toContainText('2 / 8');
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: 500, y: 400, id: 1 },
      { x: 700, y: 400, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: 400, y: 400, id: 1 },
      { x: 800, y: 400, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('main [style*="scale(2)"]')).toHaveCount(1);
  await expect(counter(page)).toContainText('2 / 8');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('main [style*="scale(2)"]')).toHaveCount(0);
  await expect(counter(page)).toContainText('3 / 8');
});

const installScreenProbe = (page: Page, reject = false) =>
  page.addInitScript((rejectRequests) => {
    const probe = {
      wakeRequests: 0,
      releases: 0,
      fullscreenRequests: 0,
      fullscreen: false,
      reject: rejectRequests,
    };
    (window as unknown as ReaderTestWindow).readerScreen = probe;
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          probe.wakeRequests++;
          if (probe.reject) throw new Error('denied');
          const lock = {
            released: false,
            release: async () => {
              if (!lock.released) {
                lock.released = true;
                probe.releases++;
              }
            },
          };
          return lock;
        },
      },
    });
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => true });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => (probe.fullscreen ? document.documentElement : null),
    });
    Element.prototype.requestFullscreen = async () => {
      probe.fullscreenRequests++;
      if (probe.reject) throw new Error('denied');
      probe.fullscreen = true;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
    document.exitFullscreen = async () => {
      probe.fullscreen = false;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
  }, reject);

for (const width of [1280, 375]) {
  test(`fullscreen доступен во время загрузки: ${width}px`, async ({ page }) => {
    await installScreenProbe(page);
    await page.setViewportSize({ width, height: 800 });
    await page.goto('iframe.html?id=страницы-читалка--loading-horizontal&viewMode=story');
    const enter = page.getByRole('button', { name: 'На весь экран', exact: true });
    await expect(enter).toHaveCount(1);
    await expect(enter).toBeVisible();
    const box = (await enter.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await enter.click();
    const exit = page.getByRole('button', { name: 'Выйти из полноэкранного режима', exact: true });
    await expect(exit).toHaveAttribute('aria-pressed', 'true');
    expect(
      await page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.fullscreen),
    ).toBe(true);
    await exit.click();
    await expect(enter).toHaveAttribute('aria-pressed', 'false');
    expect(
      await page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.fullscreen),
    ).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('fullscreen без поддержки скрыт и во время загрузки', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
  });
  await page.goto('iframe.html?id=страницы-читалка--loading-horizontal&viewMode=story');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('button', { name: 'На весь экран', exact: true })).toHaveCount(0);
});

test('Wake Lock освобождается при скрытии, восстанавливается при возврате и выключается', async ({
  page,
}) => {
  await installScreenProbe(page);
  await openReader(page, 'horizontal');
  await page.getByRole('button', { name: 'Настройки читалки', exact: true }).click();
  await page.getByText('Не гасить экран', { exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.wakeRequests),
    )
    .toBe(1);
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.releases))
    .toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.wakeRequests),
    )
    .toBe(2);
  await page.getByRole('button', { name: 'Настройки читалки', exact: true }).click();
  await page.getByText('Не гасить экран', { exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.releases))
    .toBe(2);
});

test('fullscreen синхронизирует кнопку с внешним выходом и закрывается при уходе', async ({
  page,
}) => {
  await installScreenProbe(page);
  await openReader(page, 'horizontal');
  await page.getByRole('button', { name: 'На весь экран', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Выйти из полноэкранного режима', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.getByRole('button', { name: 'На весь экран', exact: true })).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await page.keyboard.press('f');
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.fullscreen),
    )
    .toBe(true);
  await page.locator('header button').first().click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.fullscreen),
    )
    .toBe(false);
});

test('отказы fullscreen и Wake Lock не создают необработанных ошибок', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await installScreenProbe(page, true);
  await openReader(page, 'horizontal');
  await page.getByRole('button', { name: 'На весь экран', exact: true }).click();
  await page.getByRole('button', { name: 'Настройки читалки', exact: true }).click();
  await page.getByText('Не гасить экран', { exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as ReaderTestWindow).readerScreen.wakeRequests),
    )
    .toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toContainText('2 / 8');
  expect(errors).toEqual([]);
});

test('офлайн: скачанные страницы читаются по ключам кеша, следующая глава недоступна', async ({
  page,
}) => {
  const metadata = new Set<string>();
  page.on('request', (request) => {
    if (request.url().endsWith('/pages')) metadata.add(request.url());
  });
  await openReader(page, 'downloaded-offline');
  await expect(counter(page)).toContainText('1–2 / 8');
  await expect(page.locator('main img').first()).toHaveAttribute('src', /^\/offline\//);
  await page.keyboard.press('End');
  await expect(counter(page)).toContainText('7–8 / 8');
  await page.keyboard.press('Space');
  await expect(page.locator('main')).toContainText('Следующая глава не скачана');
  expect(metadata.size).toBe(0);
});

test('нулевая предзагрузка разрешает метаданные автоперехода; выключение скрывает следующую главу', async ({
  page,
}) => {
  const images = new Set<string>();
  const metadata = new Set<string>();
  page.on('request', (request) => {
    if (request.url().includes('/img?chapter=')) images.add(request.url());
    if (request.url().endsWith('/pages')) metadata.add(request.url());
  });
  await openReader(page, 'no-prefetch');
  await expect(pageSlots(page)).toHaveCount(200);
  await page.keyboard.press('End');
  await expect(counter(page)).toContainText('200 / 200');
  await page.getByRole('button', { name: 'Настройки читалки', exact: true }).click();
  await page.getByText('Открывать следующую главу сразу', { exact: true }).click();
  await expect.poll(() => metadata.size).toBe(2);
  await expect(pageSlots(page)).toHaveCount(400);
  expect(images.size).toBeLessThanOrEqual(3);
  await page.getByText('Открывать следующую главу сразу', { exact: true }).click();
  await expect(pageSlots(page)).toHaveCount(200);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('Конец главы');
});
