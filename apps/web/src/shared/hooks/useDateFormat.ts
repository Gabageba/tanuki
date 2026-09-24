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

  return {
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
