import type {
  Chapter,
  EnumLiteralsOf,
  ReadingMarkConfidence,
  ReadingProgress,
  SortDirection,
  SourceId,
} from '@tanuki/contracts';

/**
 * Как в строке главы видно, что место перенесено примерно. Диапазон рисует только A4 — там у
 * стопки своя колонка вдоль линии; остальные макеты показывают вместо него бейдж «?».
 */
export const APPROXIMATE_STYLE = {
  DIMMED: 'dimmed',
  QUESTION_BADGE: 'questionBadge',
  CAPTION: 'caption',
  RANGE: 'range',
} as const;
export type ApproximateStyle = EnumLiteralsOf<typeof APPROXIMATE_STYLE>;

/** Сколько источников в моках сходятся на одной главе. */
export const STACK_SIZES = [1, 2, 4] as const;
export type StackSize = (typeof STACK_SIZES)[number];

export type DemoSource = {
  id: SourceId;
  title: string;
  /** Цвет дорожки и точки источника — только в макетах C и E. */
  color: string;
};

export type DemoBranch = {
  id: string;
  name: string;
  /** Главы по томам (Т. 1 Гл. 1–6, Т. 2 Гл. 1–6) или сквозной номер 1–12. */
  isPerVolume: boolean;
};

/** Куда отметка попала в ветке: сквозная позиция главы (1–12) и точность переноса. */
export type DemoPlacement = {
  branchId: string;
  position: number;
  confidence: ReadingMarkConfidence;
};

/** Отметка источника: глава в нумерации самого источника и места в ветках этого тайтла. */
export type DemoMark = {
  source: DemoSource;
  progress: ReadingProgress;
  placements: DemoPlacement[];
};

/** Отметка, найденная в выбранной ветке. */
export type PlacedMark = {
  mark: DemoMark;
  chapter: Chapter;
  confidence: ReadingMarkConfidence;
};

export type SourceStackItem = {
  source: DemoSource;
  /** undefined — место отметки в ветке не нашлось. */
  confidence: ReadingMarkConfidence | undefined;
};

/** Всё, что макетам нужно знать о выбранном состоянии панели управления. */
export type DemoState = {
  /** Главы в порядке показа (direction). */
  chapters: Chapter[];
  direction: SortDirection;
  approximateStyle: ApproximateStyle;
  /** Строка-легенда над списком глав: объясняет, как выглядит примерное место. */
  withLegend: boolean;
  own: PlacedMark | undefined;
  /** Чужие отметки, нашедшие место в ветке, свежие первыми. */
  placed: PlacedMark[];
  /** Все чужие отметки, свежие первыми, — и те, чьё место в ветке не нашлось. */
  marks: DemoMark[];
  highlightedChapterId: string | undefined;
  /** scope — где искать строку: у виджета со своим списком прокручивается он, а не первый на странице. */
  onGoToChapter: (chapterId: string, scope?: HTMLElement | null) => void;
};

/** J: статус главы на общем таймлайне — своё прочитанное и то, что дочитали на других источниках. */
export const TIMELINE_ZONE = {
  READ: 'read',
  CURRENT: 'current',
  ELSEWHERE: 'elsewhere',
  UNREAD: 'unread',
} as const;
export type TimelineZone = EnumLiteralsOf<typeof TIMELINE_ZONE>;
