import {
  ADULT_LEVEL,
  COPY_VARIANT,
  FRAMING,
  HEADING_VARIANT,
  TERM,
  type AdultLevel,
  type Framing,
  type LockTexts,
  type Term,
  type TermForms,
  type AdultSettings,
  type CopyVariant,
  type HeadingTexts,
  type HeadingVariant,
  type SettingsTexts,
} from './models';

export const isBlurActive = (settings: AdultSettings) =>
  !settings.showAdultSources && settings.hideAdultTitles;

const getBlurDescription = (settings: AdultSettings) => {
  if (settings.showAdultSources) return 'Не действует, пока 18+ показывается';
  return settings.hideAdultTitles
    ? 'Тайтлы 18+ с обычных источников размыты и не открываются'
    : 'Тайтлы 18+ с обычных источников видны как есть';
};

export const getSettingsTexts = (copy: CopyVariant, settings: AdultSettings): SettingsTexts => {
  switch (copy) {
    case COPY_VARIANT.PLAIN:
      return {
        groupLabel: 'Контент 18+',
        mainTitle: 'Показывать 18+',
        mainDescription: 'Источники для взрослых и откровенные тайтлы на обычных источниках',
        blurTitle: 'Размывать обложки',
        blurDescription: settings.showAdultSources
          ? 'Не действует, пока 18+ показывается'
          : 'Тайтл остаётся в каталоге и поиске, но не открывается',
      };
    case COPY_VARIANT.STATEFUL:
      return {
        groupLabel: 'Контент 18+',
        mainTitle: 'Показывать 18+',
        mainDescription: settings.showAdultSources
          ? 'Видно всё, включая источники 18+'
          : 'Источников 18+ нет в списках и поиске',
        blurTitle: 'Размывать обложки',
        blurDescription: getBlurDescription(settings),
      };
    case COPY_VARIANT.GROUP_CAPTION:
      return {
        groupLabel: 'Контент 18+',
        groupCaption:
          'Источники для взрослых видны, только когда 18+ показывается. Пока он скрыт, откровенные тайтлы с обычных источников можно размыть — тогда их страницы не откроются.',
        mainTitle: 'Показывать 18+',
        blurTitle: 'Размывать обложки',
      };
  }
};

/** Описание «Размывать обложки», пока 18+ включён и строка заблокирована. */
const LOCKED_BLUR_DESCRIPTION = 'Не действует, пока 18+ включён';

export const getHeadingTexts = (heading: HeadingVariant, settings: AdultSettings): HeadingTexts => {
  const lockedOr = (description: string) =>
    settings.showAdultSources ? LOCKED_BLUR_DESCRIPTION : description;

  switch (heading) {
    case HEADING_VARIANT.SHOW:
      return {
        mainTitle: 'Показывать 18+',
        mainDescription: 'Источники для взрослых и откровенные тайтлы на обычных источниках',
        blurTitle: 'Размывать обложки',
        blurDescription: lockedOr('Тайтл виден в каталоге, но не открывается'),
      };
    case HEADING_VARIANT.ADULT_CONTENT:
      return {
        mainTitle: 'Контент для взрослых',
        mainDescription: 'Выключено — источников 18+ нет в списках и поиске',
        blurTitle: 'Прятать обложки 18+',
        blurDescription: lockedOr('На обычных источниках: обложка размыта, страница закрыта'),
      };
    case HEADING_VARIANT.ALLOW:
      return {
        mainTitle: 'Разрешить 18+',
        mainDescription: 'Нужно для источников 18+ и тайтлов без размытия',
        blurTitle: 'Размывать, пока 18+ запрещён',
        blurDescription: settings.showAdultSources
          ? 'Не действует, пока 18+ разрешён'
          : 'Иначе тайтлы 18+ видны как есть',
      };
    case HEADING_VARIANT.SHOW_CONTENT:
      return {
        mainTitle: 'Показывать 18+ контент',
        mainDescription:
          'Выключено — источники 18+ скрыты, а тайтлы 18+ на обычных источниках размыты',
        blurTitle: 'Размывать обложки',
        blurDescription: lockedOr('Тайтл виден в списках, но не открывается'),
      };
  }
};

export const getTermForms = (term: Term): TermForms => {
  switch (term) {
    case TERM.REGULAR_SOURCES:
      return {
        title: 'Тайтлы 18+ на обычных источниках',
        inline: 'тайтлы 18+ на обычных источниках',
      };
    case TERM.SEPARATE:
      return { title: 'Отдельные тайтлы 18+', inline: 'отдельные тайтлы 18+' };
    case TERM.COMMON_CATALOG:
      return { title: 'Тайтлы 18+ в общем каталоге', inline: 'тайтлы 18+ в общем каталоге' };
  }
};

export const getTermLabel = (term: Term) => {
  switch (term) {
    case TERM.REGULAR_SOURCES:
      return 'N1 · на обычных источниках';
    case TERM.SEPARATE:
      return 'N2 · отдельные';
    case TERM.COMMON_CATALOG:
      return 'N3 · в общем каталоге';
  }
};

export const getAdultLevel = (settings: AdultSettings): AdultLevel => {
  if (settings.showAdultSources) return ADULT_LEVEL.ALL;
  return settings.hideAdultTitles ? ADULT_LEVEL.HIDDEN : ADULT_LEVEL.PARTIAL;
};

export const getLevelSettings = (level: AdultLevel): AdultSettings => {
  switch (level) {
    case ADULT_LEVEL.HIDDEN:
      return { showAdultSources: false, hideAdultTitles: true };
    case ADULT_LEVEL.PARTIAL:
      return { showAdultSources: false, hideAdultTitles: false };
    case ADULT_LEVEL.ALL:
      return { showAdultSources: true, hideAdultTitles: false };
  }
};

/** Что становится видно, когда открыты тайтлы 18+ — для модалки подтверждения. */
export const getTitlesReveal = (term: TermForms) => `${term.inline} без размытия`;

/** Что становится видно, когда включён весь контент 18+. */
export const getAllReveal = (term: TermForms) => `источники 18+ и ${term.inline} без размытия`;

export const getLockTexts = (framing: Framing, term: TermForms): LockTexts => {
  // Тайтл размыт вторым тумблером, а не выключенным 18+: тот скрывает только источники.
  const description = `Это тайтл 18+, а ${term.inline} у вас размыты — так настроено в «Контент 18+».`;
  const patch = { hideAdultTitles: false };
  const reveals = getTitlesReveal(term);

  switch (framing) {
    case FRAMING.OBJECTS:
    case FRAMING.EXCEPTION:
    case FRAMING.LEVELS:
      return { description, buttonLabel: 'Показывать такие тайтлы', patch, reveals };
    case FRAMING.TWO_SWITCHES:
      return { description, buttonLabel: 'Не размывать такие тайтлы', patch, reveals };
  }
};

export const getLevelLabel = (level: AdultLevel) => {
  switch (level) {
    case ADULT_LEVEL.HIDDEN:
      return 'Скрыто';
    case ADULT_LEVEL.PARTIAL:
      return 'Частично';
    case ADULT_LEVEL.ALL:
      return 'Всё';
  }
};

export const getLevelDescription = (level: AdultLevel, term: TermForms) => {
  switch (level) {
    case ADULT_LEVEL.HIDDEN:
      return `Источников 18+ нет, ${term.inline} размыты и не открываются`;
    case ADULT_LEVEL.PARTIAL:
      return `Источников 18+ нет, ${term.inline} видны как обычно`;
    case ADULT_LEVEL.ALL:
      return `Видны источники 18+ и ${term.inline}`;
  }
};
