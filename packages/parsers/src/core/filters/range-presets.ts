import type { FilterRangePreset } from '@tanuki/contracts';

export const CHAPTERS_COUNT_PRESETS: FilterRangePreset[] = [
  { id: 'lt-20', label: '< 20', max: 20 },
  { id: 'lt-50', label: '< 50', max: 50 },
  { id: '100-200', label: '100-200', min: 100, max: 200 },
  { id: '200-300', label: '200-300', min: 200, max: 300 },
  { id: '300-plus', label: '300+', min: 300 },
];

export const RATING_PRESETS: FilterRangePreset[] = [
  { id: '9-plus', label: '9+', min: 9 },
  { id: '8-plus', label: '8+', min: 8 },
  { id: '7-plus', label: '7+', min: 7 },
];

const DECADE_SIZE = 10;

/** "Текущий год", the current-decade-so-far, then a preset per full decade back to `cutoff`.
 *  Everything from `minYear` up to `cutoff` collapses into one trailing "Раньше <cutoff>" preset.
 *  Omit `cutoff` to keep decade buckets all the way down to `minYear` instead, with no lumped
 *  trailing bucket. */
export const getYearRangePresets = (
  minYear: number,
  maxYear: number,
  cutoff: number = minYear,
): FilterRangePreset[] => {
  const presets: FilterRangePreset[] = [
    { id: 'current-year', label: 'Текущий год', min: maxYear, max: maxYear },
  ];
  const currentDecadeStart = Math.floor(maxYear / DECADE_SIZE) * DECADE_SIZE;
  if (currentDecadeStart < maxYear) {
    presets.push({
      id: `decade-${currentDecadeStart}`,
      label: `${currentDecadeStart}–${maxYear}`,
      min: currentDecadeStart,
      max: maxYear,
    });
  }
  for (
    let decadeStart = currentDecadeStart - DECADE_SIZE;
    decadeStart >= cutoff;
    decadeStart -= DECADE_SIZE
  ) {
    presets.push({
      id: `decade-${decadeStart}`,
      label: `${decadeStart}-е`,
      min: decadeStart,
      max: decadeStart + DECADE_SIZE - 1,
    });
  }
  if (minYear < cutoff) {
    presets.push({
      id: `before-${cutoff}`,
      label: `Раньше ${cutoff}`,
      min: minYear,
      max: cutoff - 1,
    });
  }
  return presets;
};
