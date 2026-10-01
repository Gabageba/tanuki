import type { Branch, Chapter } from '@tanuki/contracts';
import { PREVIEW_CHAPTERS_LIMIT } from './models';

const DAY_MS = 24 * 60 * 60 * 1000;

export const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

/** «197 гл.» — число и сокращение через неразрывный пробел. */
export const formatChaptersCount = (count: number) => `${count}\u00a0гл.`;

/** Последние главы ветки, от новой к старой — столько, сколько влезет в превью. */
export const buildChapters = (branch: Branch): Chapter[] =>
  Array.from({ length: Math.min(branch.chaptersCount, PREVIEW_CHAPTERS_LIMIT) }, (_, index) => {
    const number = branch.chaptersCount - index;

    return {
      id: `${branch.id}-${number}`,
      titleId: 'demo',
      number,
      volume: null,
      title: index % 3 === 0 ? null : `Глава о том, что было дальше ${number}`,
      branch: branch.name,
      scanlator: branch.scanlator,
      uploadedAt: daysAgo(index * 4 + 1),
      url: '',
    };
  });

/** У ветки без команды имени нет — в списке ей всё равно нужна подпись. */
export const getBranchName = (branch: Branch) => branch.name ?? 'Без названия';
