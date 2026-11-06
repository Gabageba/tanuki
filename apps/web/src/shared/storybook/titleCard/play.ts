import { expect, waitFor, within } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import { TITLE_TAG_HEIGHT } from '@/entities/title/markers/models';

/** Проверяем структуру ссылки и совпадение обложек, не привязываясь к мокам доменных DTO. */
export const checkTitleCardPair = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const cards = canvasElement.querySelectorAll<HTMLElement>('[data-title-card]');
  await expect(cards).toHaveLength(2);
  const [ready, skeleton] = Array.from(cards);
  if (!ready || !skeleton) throw new Error('Не найдена пара карточка / скелетон');

  await expect(ready.querySelectorAll('a')).toHaveLength(1);
  await expect(ready.querySelector('a button')).toBeNull();
  await expect(skeleton).toHaveAttribute('inert');
  await expect(skeleton.querySelectorAll('a, button, input')).toHaveLength(0);

  await document.fonts.ready;
  await waitFor(async () => {
    const readyCover = ready.querySelector('[data-card-cover]')!.getBoundingClientRect();
    const skeletonCover = skeleton.querySelector('[data-card-cover]')!.getBoundingClientRect();
    await expect(readyCover.width).toBeCloseTo(skeletonCover.width, 0);
    await expect(readyCover.height).toBeCloseTo(skeletonCover.height, 0);
    await expect(ready.getBoundingClientRect().height).toBeCloseTo(
      skeleton.getBoundingClientRect().height,
      0,
    );

    const meta = ready.querySelector('[data-card-meta-content]')!.getBoundingClientRect();
    const row = ready.querySelector('[data-card-meta]')!.getBoundingClientRect();
    if (meta.height > 0) {
      await expect(row.height, 'Мета-строка вмещает метаданные').toBeGreaterThanOrEqual(
        meta.height,
      );
    }

    const actions = skeleton.querySelector<HTMLElement>('[data-card-actions-skeleton]');
    if (actions) {
      const placeholder = actions.querySelector('.mantine-Skeleton-root')!;
      const rect = placeholder.getBoundingClientRect();
      await expect(rect.height, 'Плашка действия помещается в строку текста').toBeLessThanOrEqual(
        Number.parseFloat(getComputedStyle(actions).lineHeight),
      );

      for (const other of skeleton.querySelectorAll('.mantine-Skeleton-root')) {
        if (other === placeholder) continue;
        const bounds = other.getBoundingClientRect();
        const overlaps =
          rect.left < bounds.right &&
          rect.right > bounds.left &&
          rect.top < bounds.bottom &&
          rect.bottom > bounds.top;
        await expect(overlaps, 'Плашка действия не перекрывает другие скелетоны').toBe(false);
      }
    }
  });
};

export const checkActionsOnlyPair = async (context: { canvasElement: HTMLElement }) => {
  await checkTitleCardPair(context);
  for (const card of context.canvasElement.querySelectorAll('[data-title-card]')) {
    const row = card.querySelector('[data-card-meta]')!;
    const name = row.nextElementSibling!;
    const actions = row.lastElementChild!;

    await waitFor(async () => {
      const nameRect = name.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      await expect(nameRect.right).toBeLessThanOrEqual(actionsRect.left);

      const nameText = name.querySelector('[data-card-name]') ?? name;
      const firstLineCenter =
        nameRect.top + Number.parseFloat(getComputedStyle(nameText).lineHeight) / 2;
      const visual = actions.querySelector('svg, .mantine-Skeleton-root')!;
      const visualRect = visual.getBoundingClientRect();
      await expect(visualRect.top + visualRect.height / 2).toBeCloseTo(firstLineCenter, 0);
    });
  }
};

export const checkBookmarkCardPair = async (context: { canvasElement: HTMLElement }) => {
  await checkTitleCardPair(context);
  const progress = context.canvasElement.querySelector<HTMLElement>('[data-card-progress]')!;
  const name = context.canvasElement.querySelector('[data-card-name]')!;
  const expected = document.createElement('span');
  expected.style.color = 'var(--mantine-color-anchor)';
  progress.append(expected);
  await expect(getComputedStyle(progress).color).toBe(getComputedStyle(expected).color);
  expected.remove();
  await expect(
    within(context.canvasElement).getByRole('img', { name: I18N.t('hasNewChapters') }),
  ).toBeInTheDocument();
  await expect(name.parentElement!.querySelector('[role="img"]')).toBeNull();
};

/** 18+ не создаёт мета-строку и остаётся у правого края названия, включая узкие карточки. */
export const checkAdultTitleCardPair = async (context: { canvasElement: HTMLElement }) => {
  await checkTitleCardPair(context);
  const card = context.canvasElement.querySelector('[data-title-card]:not([inert])')!;
  const tag = card.querySelector<HTMLElement>('[data-card-adult-tag]')!;
  const name = card.querySelector('[data-card-name]')!;
  const row = card.querySelector('[data-card-name-row]')!;
  await expect(tag).toHaveTextContent('18+');
  await expect(row).toContainElement(tag);
  await expect(card.querySelector('[data-card-meta] [data-card-adult-tag]')).toBeNull();
  await waitFor(async () => {
    const tagBounds = tag.getBoundingClientRect();
    await expect(tagBounds.height).toBe(TITLE_TAG_HEIGHT);
    await expect(tagBounds.left).toBeGreaterThanOrEqual(name.getBoundingClientRect().right);
    await expect(tagBounds.right).toBeCloseTo(row.getBoundingClientRect().right, 0);
    const firstLineCenter =
      name.getBoundingClientRect().top + Number.parseFloat(getComputedStyle(name).lineHeight) / 2;
    await expect(tagBounds.top + tagBounds.height / 2).toBeCloseTo(firstLineCenter, 0);
  });
};
