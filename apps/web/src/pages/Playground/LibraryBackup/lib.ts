import {
  FILE_STATE,
  FOLDER_POLICY,
  PROFILE_STATE,
  PROGRESS_POLICY,
  DEFAULT_RESTORE_CHOICES,
  FLOW_SPLIT,
  RESTORE_STEP,
  RESULT_STATE,
  SUMMARY_STATE,
  type BackupPreview,
  type FileState,
  type FlowSplit,
  type ProfileState,
  type RestoreChoices,
  type RestoreResult,
  type RestoreStep,
  type ResultState,
  type SummaryState,
} from './models';

/** Неразрывный пробел между числом и словом. */
export const NBSP = '\u00a0';

const PLURAL_RULES = new Intl.PluralRules('ru');
const NUMBER_FORMAT = new Intl.NumberFormat('ru');

type WordForms = { one: string; few: string; many: string };

/** «1 204» — разряды через неразрывный пробел, как в `t()` приложения. */
export const formatCount = (count: number) => NUMBER_FORMAT.format(count);

/** Слово в форме по числу — в приложении это plural-ключи i18next. */
export const pluralize = (count: number, { one, few, many }: WordForms) => {
  const rule = PLURAL_RULES.select(count);
  if (rule === 'one') return one;
  if (rule === 'few') return few;
  return many;
};

/** «42 закладки» — число с неразрывным пробелом и словом в нужной форме. */
export const formatCountWord = (count: number, forms: WordForms) =>
  `${formatCount(count)}${NBSP}${pluralize(count, forms)}`;

export const BOOKMARK_FORMS = { one: 'закладка', few: 'закладки', many: 'закладок' };
export const FOLDER_FORMS = { one: 'папка', few: 'папки', many: 'папок' };
export const MARK_FORMS = { one: 'отметка', few: 'отметки', many: 'отметок' };
export const TITLE_FORMS = { one: 'тайтл', few: 'тайтла', many: 'тайтлов' };
export const CHAPTER_FORMS = { one: 'глава', few: 'главы', many: 'глав' };

/** Части описания строки через «·», пустые выпадают. */
export const joinParts = (parts: (string | false)[]) => parts.filter(Boolean).join(' · ');

/** «Копия gabageba от 12 октября 2026 г.» — без точки в конце: после «г.» её не ставят. */
export const formatBackupOwner = (username: string, exportedAt: string) =>
  `Копия ${username} от ${exportedAt}`;

export const hasFolderConflict = (preview: BackupPreview) => preview.bookmarks.otherFolder > 0;
export const hasProgressConflict = (preview: BackupPreview) => preview.progress.differs > 0;

/** Есть ли в копии хоть что-то, чего у пользователя нет (настройки не в счёт — они по флажку). */
export const hasAnythingNew = (preview: BackupPreview) =>
  preview.bookmarks.added + preview.folders.added + preview.progress.added + preview.chapterReads >
    0 ||
  hasFolderConflict(preview) ||
  hasProgressConflict(preview);

/** Заменит ли выбор что-то уже существующее — по плану тогда модалка `warning` и совет скачать
 *  копию. «Дальше прочитанное» заменяет, только если у копии есть отметки дальше ваших. */
export const isReplacing = (preview: BackupPreview, choices: RestoreChoices) => {
  if (choices.applySettings) return true;
  if (hasFolderConflict(preview) && choices.folderPolicy === FOLDER_POLICY.FROM_BACKUP) return true;
  if (!hasProgressConflict(preview)) return false;
  switch (choices.progressPolicy) {
    case PROGRESS_POLICY.FURTHEST:
      return preview.progress.furtherInBackup > 0;
    case PROGRESS_POLICY.KEEP_MINE:
      return false;
    case PROGRESS_POLICY.FROM_BACKUP:
      return true;
  }
};

/** Итог записи по сводке и выбору — в приложении его считает сервер. */
export const buildRestoreResult = (
  preview: BackupPreview,
  choices: RestoreChoices,
): RestoreResult => {
  const getProgressUpdated = () => {
    switch (choices.progressPolicy) {
      case PROGRESS_POLICY.FURTHEST:
        return preview.progress.furtherInBackup;
      case PROGRESS_POLICY.KEEP_MINE:
        return 0;
      case PROGRESS_POLICY.FROM_BACKUP:
        return preview.progress.differs;
    }
  };

  return {
    username: preview.username,
    exportedAt: preview.exportedAt,
    bookmarksAdded: preview.bookmarks.added,
    bookmarksMoved:
      choices.folderPolicy === FOLDER_POLICY.FROM_BACKUP ? preview.bookmarks.otherFolder : 0,
    foldersCreated: preview.folders.added,
    foldersOverLimit: preview.folders.overLimit,
    titlesToPlanned: preview.folders.overLimit > 0 ? preview.bookmarks.added : 0,
    progressAdded: preview.progress.added,
    progressUpdated: getProgressUpdated(),
    chapterReadsAdded: preview.chapterReads,
    settingsApplied: choices.applySettings,
    skipped:
      preview.bookmarks.skipped > 0
        ? [
            {
              sourceId: 'remanga',
              bookmarks: preview.bookmarks.skipped,
              progress: 0,
              chapterReads: 0,
            },
          ]
        : [],
  };
};

/** Шаги итога, которыми ★1 и ★2 различаются: «Файл» и «Готово» у них одинаковые. Шаг вопросов
 *  есть только при конфликтах, предупреждение — только если выбор по умолчанию что-то заменяет. */
export const getDistinctFlowSteps = (
  split: FlowSplit,
  preview: BackupPreview,
  withConfirm: boolean,
) => {
  const hasConflicts = hasFolderConflict(preview) || hasProgressConflict(preview);
  const hasQuestionsStep = split === FLOW_SPLIT.QUESTIONS_STEP && hasConflicts;
  const steps: { step: RestoreStep; caption: string }[] = [
    {
      step: RESTORE_STEP.SUMMARY,
      caption: hasQuestionsStep ? 'Шаг 2 · Сводка' : 'Шаг 2 · Сводка с вопросами',
    },
  ];
  if (hasQuestionsStep) {
    steps.push({ step: RESTORE_STEP.QUESTIONS, caption: 'Шаг 3 · Вопросы' });
  }
  if (withConfirm && isReplacing(preview, DEFAULT_RESTORE_CHOICES)) {
    steps.push({
      step: RESTORE_STEP.CONFIRM,
      caption: `Шаг ${steps.length + 2} · Предупреждение`,
    });
  }
  return steps;
};

export const getSummaryStateLabel = (state: SummaryState) => {
  switch (state) {
    case SUMMARY_STATE.CONFLICTS:
      return 'С конфликтами';
    case SUMMARY_STATE.NO_CONFLICTS:
      return 'Без конфликтов';
    case SUMMARY_STATE.NOTHING_NEW:
      return 'Всё из копии уже есть';
    case SUMMARY_STATE.UNKNOWN_SOURCES:
      return 'Чужой инстанс, неизвестные источники, лимит папок';
  }
};

export const getResultStateLabel = (state: ResultState) => {
  switch (state) {
    case RESULT_STATE.AFTER_CONFLICTS:
      return 'После сводки с конфликтами';
    case RESULT_STATE.NOTHING_ADDED:
      return 'Ничего не добавилось';
    case RESULT_STATE.SKIPPED:
      return 'Пропуски и лимит папок';
  }
};

export const getProfileStateLabel = (state: ProfileState) => {
  switch (state) {
    case PROFILE_STATE.IDLE:
      return 'Обычное';
    case PROFILE_STATE.DOWNLOADING:
      return 'Сервер собирает файл';
    case PROFILE_STATE.OFFLINE:
      return 'Без сети';
    case PROFILE_STATE.NEVER:
      return 'Копию ещё не делали';
  }
};

export const getFileStateLabel = (state: FileState) => {
  switch (state) {
    case FILE_STATE.EMPTY:
      return 'Файл не выбран';
    case FILE_STATE.CHOSEN:
      return 'Файл выбран';
    case FILE_STATE.SENDING:
      return 'Файл выбран, сервер считает сводку';
    case FILE_STATE.ERROR:
      return 'Чужой файл';
  }
};
