export const formatRuDate = (isoDate: string) => {
  const parts = new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(isoDate));
  const part = (type: 'day' | 'month' | 'year') => parts.find((p) => p.type === type)?.value ?? '';

  return `${part('day')} ${part('month').replace('.', '')} ${part('year')}`;
};
