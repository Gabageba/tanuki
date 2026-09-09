export const formatRuDate = (isoDate: string) => {
  const parts = new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(isoDate));
  const part = (type: 'day' | 'month' | 'year') => parts.find((p) => p.type === type)?.value ?? '';

  return `${part('day')} ${part('month').replace('.', '')} ${part('year')}`;
};

/** «9 сент 2026, 14:32» — точный момент, когда важна не только дата, но и время. */
export const formatRuDateTime = (isoDate: string) => {
  const time = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(isoDate),
  );

  return `${formatRuDate(isoDate)}, ${time}`;
};

const RELATIVE_UNITS: readonly (readonly [seconds: number, unit: Intl.RelativeTimeFormatUnit])[] = [
  [60 * 60 * 24 * 365, 'year'],
  [60 * 60 * 24 * 30, 'month'],
  [60 * 60 * 24, 'day'],
  [60 * 60, 'hour'],
  [60, 'minute'],
];

/** «2 часа назад», «3 дня назад» — для дат, где важна давность, а не сам день. */
export const formatRelativeRu = (isoDate: string) => {
  const elapsedSeconds = (Date.now() - new Date(isoDate).getTime()) / 1000;
  const unit = RELATIVE_UNITS.find(([seconds]) => elapsedSeconds >= seconds);
  if (!unit) {
    return 'только что';
  }

  const [seconds, name] = unit;
  return new Intl.RelativeTimeFormat('ru', { numeric: 'auto' }).format(
    -Math.floor(elapsedSeconds / seconds),
    name,
  );
};
