export const formatDate = (isoDate: string, locale: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(isoDate));
  const part = (type: 'day' | 'month' | 'year') => parts.find((p) => p.type === type)?.value ?? '';

  return `${part('day')} ${part('month').replace('.', '')} ${part('year')}`;
};

/** «9 сент 2026, 14:32» — точный момент, когда важна не только дата, но и время. */
export const formatDateTime = (isoDate: string, locale: string) => {
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(isoDate),
  );

  return `${formatDate(isoDate, locale)}, ${time}`;
};

const RELATIVE_UNITS: readonly (readonly [seconds: number, unit: Intl.RelativeTimeFormatUnit])[] = [
  [60 * 60 * 24 * 365, 'year'],
  [60 * 60 * 24 * 30, 'month'],
  [60 * 60 * 24, 'day'],
  [60 * 60, 'hour'],
  [60, 'minute'],
];

/** «2 часа назад», «3 дня назад» — для дат, где важна давность, а не сам день. */
export const formatRelative = (isoDate: string, locale: string, justNow: string) => {
  const elapsedSeconds = (Date.now() - new Date(isoDate).getTime()) / 1000;
  const unit = RELATIVE_UNITS.find(([seconds]) => elapsedSeconds >= seconds);
  if (!unit) {
    return justNow;
  }

  const [seconds, name] = unit;
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    -Math.floor(elapsedSeconds / seconds),
    name,
  );
};
