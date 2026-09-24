import { DEFAULT_BRANCH_ID, READING_MARK_CONFIDENCE, SOURCE_ID } from '@tanuki/contracts';
import { getChapterId, minutesAgo } from './lib';
import type { DemoBranch, DemoMark, DemoSource, StackSize } from './models';

export const DEMO_BRANCHES: DemoBranch[] = [
  { id: 'ronin', name: 'Команда Ронин', isPerVolume: true },
  { id: DEFAULT_BRANCH_ID, name: 'Сквозная нумерация', isPerVolume: false },
];

const [TEAM_BRANCH, DEFAULT_BRANCH] = DEMO_BRANCHES as [DemoBranch, DemoBranch];

export const OWN_SOURCE: DemoSource = {
  id: SOURCE_ID.READMANGA_RU,
  title: 'ReadManga',
  color: 'var(--mantine-primary-color-filled)',
};

const INKSTORY: DemoSource = {
  id: SOURCE_ID.INKSTORY,
  title: 'Inkstory',
  color: 'var(--mantine-color-grape-5)',
};
const MANGALIB: DemoSource = {
  id: SOURCE_ID.MANGALIB,
  title: 'MangaLib',
  color: 'var(--mantine-color-blue-5)',
};
const REMANGA: DemoSource = {
  id: SOURCE_ID.REMANGA,
  title: 'Remanga',
  color: 'var(--mantine-color-teal-5)',
};
const MANGABUFF: DemoSource = {
  id: SOURCE_ID.MANGABUFF,
  title: 'MangaBuff',
  color: 'var(--mantine-color-yellow-5)',
};
const SENKURO: DemoSource = {
  id: SOURCE_ID.SENKURO,
  title: 'Senkuro',
  color: 'var(--mantine-color-red-5)',
};

/** Источники с дорожками — в порядке, в котором макет E раскладывает их слева направо. */
export const DEMO_SOURCES = [INKSTORY, MANGALIB, REMANGA, MANGABUFF, SENKURO];

type MarkOptions = {
  source: DemoSource;
  minutes: number;
  /** Глава в нумерации самого источника. */
  volume: number | null;
  number: number;
  title: string | null;
  /** Сквозная позиция в этом тайтле по веткам; null — место в ветке не нашлось. */
  team: number | null;
  plain: number | null;
  isApproximate?: boolean;
};

const buildMark = ({
  source,
  minutes,
  volume,
  number,
  title,
  team,
  plain,
  isApproximate = false,
}: MarkOptions): DemoMark => {
  const confidence = isApproximate
    ? READING_MARK_CONFIDENCE.APPROXIMATE
    : READING_MARK_CONFIDENCE.EXACT;

  return {
    source,
    progress: {
      sourceId: source.id,
      chapterId: `${source.id}:demo-${number}`,
      chapterVolume: volume,
      chapterNumber: number,
      chapterTitle: title,
      branchId: DEFAULT_BRANCH_ID,
      pageIndex: 0,
      updatedAt: minutesAgo(minutes),
    },
    placements: [
      ...(team === null ? [] : [{ branchId: TEAM_BRANCH.id, position: team, confidence }]),
      ...(plain === null ? [] : [{ branchId: DEFAULT_BRANCH.id, position: plain, confidence }]),
    ],
  };
};

/**
 * Свои отметки: одна на источнике тайтла. В ветке, где читали, — точно; в другой ветке её место
 * вычислено выравниванием — с иной нумерацией, поэтому примерно.
 */
export const OWN_MARK: DemoMark = {
  source: OWN_SOURCE,
  progress: {
    sourceId: OWN_SOURCE.id,
    chapterId: getChapterId(TEAM_BRANCH.id, 6),
    chapterVolume: 1,
    chapterNumber: 6,
    chapterTitle: 'Дом на холме',
    branchId: TEAM_BRANCH.id,
    pageIndex: 4,
    updatedAt: minutesAgo(60 * 24 * 3),
  },
  placements: [
    { branchId: TEAM_BRANCH.id, position: 6, confidence: READING_MARK_CONFIDENCE.EXACT },
    { branchId: DEFAULT_BRANCH.id, position: 6, confidence: READING_MARK_CONFIDENCE.APPROXIMATE },
  ],
};

/**
 * Чужие отметки, свежие первыми. stackSize — сколько из них сходятся на десятой главе:
 * остальные разбросаны по своим местам. У Remanga нумерация сдвинута на пролог, поэтому её место
 * примерное; Senkuro ушёл дальше, чем есть глав здесь, — места не нашлось.
 */
export const getDemoMarks = (stackSize: StackSize): DemoMark[] => {
  const isStacked = (from: StackSize) => stackSize >= from;

  return [
    buildMark({
      source: INKSTORY,
      minutes: 1,
      volume: null,
      number: 10,
      title: 'Разлом',
      team: 10,
      plain: 10,
    }),
    buildMark({
      source: REMANGA,
      minutes: 60 * 5,
      volume: null,
      number: isStacked(4) ? 11 : 8,
      title: null,
      team: isStacked(4) ? 10 : 7,
      plain: isStacked(4) ? 10 : 7,
      isApproximate: true,
    }),
    buildMark({
      source: MANGALIB,
      minutes: 60 * 24 * 2,
      volume: 2,
      number: isStacked(2) ? 4 : 2,
      title: isStacked(2) ? 'Разлом' : 'Старые долги',
      team: isStacked(2) ? 10 : 8,
      plain: isStacked(2) ? 10 : 8,
    }),
    buildMark({
      source: SENKURO,
      minutes: 60 * 24 * 7,
      volume: null,
      number: 15,
      title: null,
      team: null,
      plain: null,
    }),
    buildMark({
      source: MANGABUFF,
      minutes: 60 * 24 * 21,
      volume: null,
      number: isStacked(4) ? 10 : 4,
      title: null,
      team: isStacked(4) ? 10 : 4,
      plain: isStacked(4) ? 10 : 4,
      isApproximate: true,
    }),
  ];
};
