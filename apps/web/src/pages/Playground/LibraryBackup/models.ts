import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

/** Чья папка побеждает у тайтла, что уже в закладках в другой папке (`RESTORE_FOLDER_POLICY`
 *  плана). */
export const FOLDER_POLICY = {
  KEEP_MINE: 'keepMine',
  FROM_BACKUP: 'fromBackup',
} as const;
export type FolderPolicy = EnumLiteralsOf<typeof FOLDER_POLICY>;

/** Чья отметка «где остановился» побеждает при расхождении (`RESTORE_PROGRESS_POLICY` плана). */
export const PROGRESS_POLICY = {
  FURTHEST: 'furthest',
  KEEP_MINE: 'keepMine',
  FROM_BACKUP: 'fromBackup',
} as const;
export type ProgressPolicy = EnumLiteralsOf<typeof PROGRESS_POLICY>;

export type RestoreChoices = {
  folderPolicy: FolderPolicy;
  progressPolicy: ProgressPolicy;
  applySettings: boolean;
};

/** По плану: ничего не заменять — «Оставить мои», «Дальше прочитанное», настройки выключены. */
export const DEFAULT_RESTORE_CHOICES: RestoreChoices = {
  folderPolicy: FOLDER_POLICY.KEEP_MINE,
  progressPolicy: PROGRESS_POLICY.FURTHEST,
  applySettings: false,
};

/** Что сервер посчитал по файлу на шаге «Сводка» (`BackupPreview` плана). */
export type BackupPreview = {
  fileName: string;
  fileSize: string;
  username: string;
  /** Дата копии словами — `formatDate` в приложении. */
  exportedAt: string;
  origin: string;
  bookmarks: { added: number; sameFolder: number; otherFolder: number; skipped: number };
  folders: { added: number; matched: number; overLimit: number };
  progress: {
    added: number;
    differs: number;
    /** Из расходящихся — у скольких копия дальше: «Дальше прочитанное» их заменит. */
    furtherInBackup: number;
  };
  chapterReads: number;
};

export type SkippedSource = {
  sourceId: string;
  bookmarks: number;
  progress: number;
  chapterReads: number;
};

/** Итог записи (`BackupRestoreResult` плана). */
export type RestoreResult = {
  username: string;
  exportedAt: string;
  bookmarksAdded: number;
  bookmarksMoved: number;
  foldersCreated: number;
  foldersOverLimit: number;
  /** Сколько тайтлов из не поместившихся папок легло в «В планах». */
  titlesToPlanned: number;
  progressAdded: number;
  progressUpdated: number;
  chapterReadsAdded: number;
  settingsApplied: boolean;
  skipped: SkippedSource[];
};

export const SUMMARY_STATE = {
  CONFLICTS: 'conflicts',
  NO_CONFLICTS: 'noConflicts',
  NOTHING_NEW: 'nothingNew',
  UNKNOWN_SOURCES: 'unknownSources',
} as const;
export type SummaryState = EnumLiteralsOf<typeof SUMMARY_STATE>;

export const RESULT_STATE = {
  AFTER_CONFLICTS: 'afterConflicts',
  NOTHING_ADDED: 'nothingAdded',
  SKIPPED: 'skipped',
} as const;
export type ResultState = EnumLiteralsOf<typeof RESULT_STATE>;

/** R — строки в «Профиль → Данные». */
export const PROFILE_VIEW = {
  CURRENT: 'current',
  PLAN: 'plan',
  DATED: 'dated',
} as const;
export type ProfileView = EnumLiteralsOf<typeof PROFILE_VIEW>;

export const PROFILE_STATE = {
  IDLE: 'idle',
  DOWNLOADING: 'downloading',
  OFFLINE: 'offline',
  NEVER: 'never',
} as const;
export type ProfileState = EnumLiteralsOf<typeof PROFILE_STATE>;

/** F — шаг «Файл». */
export const FILE_VIEW = {
  CURRENT: 'current',
  INPUT: 'input',
  DROPZONE: 'dropzone',
} as const;
export type FileView = EnumLiteralsOf<typeof FILE_VIEW>;

export const FILE_STATE = {
  EMPTY: 'empty',
  CHOSEN: 'chosen',
  SENDING: 'sending',
  ERROR: 'error',
} as const;
export type FileState = EnumLiteralsOf<typeof FILE_STATE>;

/** H — шапка сводки «чья копия и откуда». */
export const HEADER_VIEW = {
  PHRASE: 'phrase',
  CARD: 'card',
  TITLE: 'title',
} as const;
export type HeaderView = EnumLiteralsOf<typeof HEADER_VIEW>;

/** S — счётчики сводки. */
export const COUNTERS_VIEW = {
  ROWS: 'rows',
  TABLE: 'table',
  TEXT: 'text',
} as const;
export type CountersView = EnumLiteralsOf<typeof COUNTERS_VIEW>;

/** Q — где число у вопроса о конфликте. */
export const QUESTION_VIEW = {
  COUNT_IN_TITLE: 'countInTitle',
  COUNT_IN_CARD: 'countInCard',
} as const;
export type QuestionView = EnumLiteralsOf<typeof QUESTION_VIEW>;

/** W — совет скачать текущую копию при заменяющем выборе. */
export const ADVICE_VIEW = {
  TEXT: 'text',
  ROW: 'row',
  BUTTON: 'button',
  LINK: 'link',
} as const;
export type AdviceView = EnumLiteralsOf<typeof ADVICE_VIEW>;

/** D — шаг «Готово». */
export const DONE_VIEW = {
  ROWS: 'rows',
  SHORT: 'short',
  BY_SOURCE: 'bySource',
} as const;
export type DoneView = EnumLiteralsOf<typeof DONE_VIEW>;

/** Шаги модалки в итоге: «Вопросы» есть только у ★1 и только при конфликтах, «Предупреждение» —
 *  только при заменяющем выборе. */
export const RESTORE_STEP = {
  FILE: 'file',
  SUMMARY: 'summary',
  QUESTIONS: 'questions',
  CONFIRM: 'confirm',
  DONE: 'done',
} as const;
export type RestoreStep = EnumLiteralsOf<typeof RESTORE_STEP>;

/** Как в итоге разделена сводка. */
export const FLOW_SPLIT = {
  /** ★1 — «Сводка» → «Вопросы» → предупреждение. */
  QUESTIONS_STEP: 'questionsStep',
  /** ★2 — «Сводка с вопросами» → предупреждение. */
  CONFIRM_STEP: 'confirmStep',
} as const;
export type FlowSplit = EnumLiteralsOf<typeof FLOW_SPLIT>;

/** Как собрана сводка: по одному варианту каждой оси. */
export type SummaryLayout = {
  header: HeaderView;
  counters: CountersView;
  question: QuestionView;
  advice: AdviceView;
  /** T2 — стрелка «назад» в заголовке вместо иконки тона. */
  withBack: boolean;
};

export const DEFAULT_SUMMARY_LAYOUT: SummaryLayout = {
  header: HEADER_VIEW.PHRASE,
  counters: COUNTERS_VIEW.ROWS,
  question: QUESTION_VIEW.COUNT_IN_TITLE,
  advice: ADVICE_VIEW.TEXT,
  withBack: false,
};

export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Итог', axes: [{ letter: '★', title: 'Выбранная комбинация' }] },
  { title: 'Профиль', axes: [{ letter: 'R', title: 'Строки «Импорт и экспорт»' }] },
  { title: 'Шаг «Файл»', axes: [{ letter: 'F', title: 'Выбор файла' }] },
  {
    title: 'Шаг «Сводка»',
    axes: [
      { letter: 'T', title: 'Тон и путь назад' },
      { letter: 'H', title: 'Чья копия и откуда' },
      { letter: 'S', title: 'Счётчики' },
      { letter: 'Q', title: 'Вопросы о конфликтах' },
      { letter: 'W', title: 'Совет скачать копию' },
    ],
  },
  { title: 'Шаг «Готово»', axes: [{ letter: 'D', title: 'Итог' }] },
];
