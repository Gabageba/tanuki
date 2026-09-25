import { useTranslation } from 'react-i18next';

function useDateFormat() {
  const { t, i18n } = useTranslation();

  const formatDate = (isoDate: string) => {
    const parts = new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).formatToParts(new Date(isoDate));
    const part = (type: 'day' | 'month' | 'year') =>
      parts.find((p) => p.type === type)?.value ?? '';

    return `${part('day')} ${part('month').replace('.', '')} ${part('year')}`;
  };

  /** «10.12.2002» — фиксированный числовой формат для колонок, где даты идут подряд. */
  const formatDateNumeric = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${day}.${month}.${date.getFullYear()}`;
  };

  /** «9 сент 2026, 14:32» — точный момент, когда важна не только дата, но и время. */
  const formatDateTime = (isoDate: string) => {
    const time = new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));

    return `${formatDate(isoDate)}, ${time}`;
  };

  /** «10 сент» — год опускается, если дата из текущего года. */
  const formatDateCompact = (isoDate: string) => {
    const date = new Date(isoDate);
    if (date.getFullYear() !== new Date().getFullYear()) {
      return formatDate(isoDate);
    }

    const parts = new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
    }).formatToParts(date);
    const part = (type: 'day' | 'month') => parts.find((p) => p.type === type)?.value ?? '';

    return `${part('day')} ${part('month').replace('.', '')}`;
  };

  /**
   * «5мин назад», «2ч назад», «3д назад» — для дат, где важна давность, а не сам день.
   * Начиная с недели давность уже не читается с одного взгляда — показываем дату: «10 сент».
   */
  const formatRelative = (isoDate: string) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000);
    if (elapsedMinutes < 1) {
      return t('justNow');
    }
    if (elapsedMinutes < 60) {
      return t('minutesAgoAbbrev', { count: elapsedMinutes });
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return t('hoursAgoAbbrev', { count: elapsedHours });
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) {
      return t('daysAgoAbbrev', { count: elapsedDays });
    }

    return formatDateCompact(isoDate);
  };

  /**
   * «3 ч 12 м», «45 м» — длительность в минутах; часы опускаются, пока их нет.
   * `separator` — то, что стоит между часами и минутами: по умолчанию обычный пробел, для крупного
   * моноширинного текста можно передать более узкий, например `'\u2009'` (тонкий пробел).
   */
  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours
      ? t('hoursMinutesAbbrev', { hours, minutes })
      : t('minutesAbbrev', { count: minutes });
  };

  /**
   * «марта 2024» — месяц и год без дня. Месяц берётся из полной даты, а не из `{ month: 'long' }`
   * отдельно: так Intl отдаёт его в родительном падеже, который нужен после «с».
   */
  const formatMonthYear = (isoDate: string) => {
    const parts = new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(new Date(isoDate));
    const part = (type: 'month' | 'year') => parts.find((p) => p.type === type)?.value ?? '';

    return `${part('month')} ${part('year')}`;
  };

  /** «сентябрь» — название текущего месяца в именительном падеже. */
  const getCurrentMonthName = () =>
    new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date());

  return {
    formatDuration,
    getCurrentMonthName,
    formatDate: (isoDate: string | null) => {
      if (!isoDate) {
        return null;
      }
      return formatDate(isoDate);
    },
    formatDateTime: (isoDate: string | null) => {
      if (!isoDate) {
        return null;
      }
      return formatDateTime(isoDate);
    },
    formatMonthYear: (isoDate: string | null) => {
      if (!isoDate) {
        return null;
      }
      return formatMonthYear(isoDate);
    },
    formatDateNumeric: (isoDate: string | null) => {
      if (!isoDate) {
        return null;
      }
      return formatDateNumeric(isoDate);
    },
    formatRelative: (isoDate: string | null) => {
      if (!isoDate) {
        return null;
      }
      return formatRelative(isoDate);
    },
  };
}

export default useDateFormat;
