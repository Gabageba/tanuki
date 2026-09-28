import type {
  ChaptersReadPoint,
  TagStatistic,
  ProfileStatisticsResponse,
  ReadingTimeStatistic,
  SourceStatistic,
} from '@tanuki/contracts';
import { catalogEntryFor } from '@tanuki/contracts';
import type { ActivityMinute, ChapterRead } from './models';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/** Окно, с которым сравниваются «сегодня» и темп месяца. */
const BASELINE_DAYS = 30;
/** Столбиков в дневном и месячном графиках. */
const CHART_DAYS = 30;
const CHART_MONTHS = 12;
const TOP_TAGS = 6;
/** Пауза длиннее этой начинает новую сессию чтения. */
const SESSION_GAP_MS = 15 * MINUTE_MS;
/** Ширина окна «чаще всего читаете с … до …», в часах. */
const PEAK_WINDOW_HOURS = 2;

/** Formatter на каждый вызов обходится дорого, а зон у пользователей — единицы. */
const formatters = new Map<string, Intl.DateTimeFormat>();
const getFormatter = (timeZone: string) => {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
};

/** Календарная дата (`YYYY-MM-DD`) и час момента в зоне пользователя. */
export const toLocalParts = (date: Date, timeZone: string) => {
  const parts = Object.fromEntries(
    getFormatter(timeZone)
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24 };
};

/** Сдвиг календарной даты на n дней — без зон: дата уже локальная. */
export const addDays = (isoDate: string, days: number) =>
  new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

const addMonths = (isoDate: string, months: number) => {
  const date = new Date(`${isoDate.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};

const isWeekend = (isoDate: string) => {
  const weekday = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return weekday === 0 || weekday === 6;
};

/**
 * Ключ главы для склейки: группа тайтла плюс том и номер — по ним одна и та же глава узнаётся на
 * разных источниках. Без номера сравнивать не с чем, и глава остаётся сама по себе.
 */
const chapterKeyOf = (read: ChapterRead, canonicalKey: string) =>
  read.chapterNumber === null
    ? read.chapterId
    : `${canonicalKey}|${read.chapterVolume ?? ''}:${read.chapterNumber}`;

/**
 * Первые прочтения каждой главы после склейки связанных источников. Из дублей остаётся самое
 * раннее: оно и дата прочтения, и источник, на котором главу прочитали.
 */
export const dedupeChapterReads = (reads: ChapterRead[], canonicalKeys: Map<string, string>) => {
  const sorted = [...reads].sort((a, b) => a.readAt.getTime() - b.readAt.getTime());
  const seen = new Set<string>();
  const result: (ChapterRead & { canonicalKey: string })[] = [];

  for (const read of sorted) {
    const canonicalKey = canonicalKeys.get(read.titleKey) ?? read.titleKey;
    const key = chapterKeyOf(read, canonicalKey);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...read, canonicalKey });
  }
  return result;
};

const sumDays = (counts: Map<string, number>, from: string, days: number) => {
  let total = 0;
  for (let offset = 0; offset < days; offset += 1) total += counts.get(addDays(from, offset)) ?? 0;
  return total;
};

/**
 * Серия дней подряд хотя бы с одной главой. Пока сегодня ещё не читали, серия считается до вчера и
 * не обнуляется — рвёт её только целиком пропущенный день.
 */
export const computeStreak = (activeDates: Set<string>, today: string) => {
  let current = 0;
  let day = activeDates.has(today) ? today : addDays(today, -1);
  while (activeDates.has(day)) {
    current += 1;
    day = addDays(day, -1);
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of [...activeDates].sort()) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  return { current, best };
};

/** Тег на разных источниках пишут по-разному — сравниваются без регистра, ё и крайних пробелов. */
const normalizeTagName = (name: string) => name.trim().toLowerCase().replace(/ё/gu, 'е');

/** Теги по прочитанным главам. Название — то написание тега, что встречалось чаще. */
export const computeTags = (reads: ChapterRead[]): TagStatistic[] => {
  const stats = new Map<string, { chapters: number; spellings: Map<string, number> }>();

  for (const read of reads) {
    const readTags = new Map(read.tags.map((tag) => [normalizeTagName(tag), tag.trim()]));
    for (const [key, spelling] of readTags) {
      if (!key) continue;
      const stat = stats.get(key) ?? { chapters: 0, spellings: new Map() };
      stat.chapters += 1;
      stat.spellings.set(spelling, (stat.spellings.get(spelling) ?? 0) + 1);
      stats.set(key, stat);
    }
  }

  return [...stats.values()]
    .map(({ chapters, spellings }) => ({
      name: [...spellings].sort((a, b) => b[1] - a[1])[0]![0],
      chapters,
    }))
    .sort((a, b) => b.chapters - a.chapters || a.name.localeCompare(b.name))
    .slice(0, TOP_TAGS);
};

const sourceTitleOf = (sourceId: string) => {
  try {
    return catalogEntryFor(sourceId).title;
  } catch {
    // Источник убрали из каталога, а прочтения с него остались.
    return sourceId;
  }
};

export const computeSources = (reads: ChapterRead[]): SourceStatistic[] => {
  const counts = new Map<string, number>();
  for (const read of reads) counts.set(read.sourceId, (counts.get(read.sourceId) ?? 0) + 1);

  return [...counts]
    .map(([id, chapters]) => ({ id, title: sourceTitleOf(id), chapters }))
    .sort((a, b) => b.chapters - a.chapters);
};

/** Средняя длина сессии в секундах: минуты чтения, между которыми пауза не длиннее 15 минут. */
export const computeAverageSessionSeconds = (minutes: ActivityMinute[]) => {
  if (minutes.length === 0) return 0;

  const sorted = [...minutes].sort((a, b) => a.minute.getTime() - b.minute.getTime());
  const sessions: number[] = [];
  let previousEnd = Number.NEGATIVE_INFINITY;

  for (const { minute, seconds } of sorted) {
    const start = minute.getTime();
    if (start - previousEnd > SESSION_GAP_MS) sessions.push(seconds);
    else sessions[sessions.length - 1]! += seconds;
    previousEnd = start + MINUTE_MS;
  }

  return sessions.reduce((sum, value) => sum + value, 0) / sessions.length;
};

/** Два соседних часа (и через полночь тоже), на которые пришлась наибольшая доля времени. */
export const computePeak = (secondsByHour: number[]) => {
  const total = secondsByHour.reduce((sum, value) => sum + value, 0);
  if (total === 0) return null;

  let fromHour = 0;
  let best = -1;
  for (let hour = 0; hour < 24; hour += 1) {
    let window = 0;
    for (let offset = 0; offset < PEAK_WINDOW_HOURS; offset += 1) {
      window += secondsByHour[(hour + offset) % 24]!;
    }
    if (window > best) {
      best = window;
      fromHour = hour;
    }
  }

  return { fromHour, percent: Math.round((best / total) * 100) };
};

const toMinutes = (seconds: number) => Math.round(seconds / 60);

/**
 * Время чтения за текущий календарный месяц. Средние в день делятся на все прошедшие дни месяца
 * (дни без чтения — нули), будни и выходные — на прошедшие дни своего типа.
 */
export const computeReadingTime = (
  activity: ActivityMinute[],
  timeZone: string,
  today: string,
): ReadingTimeStatistic => {
  const monthStart = `${today.slice(0, 7)}-01`;
  const secondsByHour = Array.from({ length: 24 }, () => 0);
  const monthMinutes: ActivityMinute[] = [];
  let weekdaysSeconds = 0;
  let weekendsSeconds = 0;

  for (const item of activity) {
    const { date, hour } = toLocalParts(item.minute, timeZone);
    if (date < monthStart || date > today) continue;
    monthMinutes.push(item);
    secondsByHour[hour]! += item.seconds;
    if (isWeekend(date)) weekendsSeconds += item.seconds;
    else weekdaysSeconds += item.seconds;
  }

  let weekdays = 0;
  let weekends = 0;
  for (let day = monthStart; day <= today; day = addDays(day, 1)) {
    if (isWeekend(day)) weekends += 1;
    else weekdays += 1;
  }

  const totalSeconds = weekdaysSeconds + weekendsSeconds;
  return {
    totalMinutes: toMinutes(totalSeconds),
    averagePerDayMinutes: toMinutes(totalSeconds / (weekdays + weekends)),
    weekdaysPerDayMinutes: weekdays > 0 ? toMinutes(weekdaysSeconds / weekdays) : 0,
    weekendsPerDayMinutes: weekends > 0 ? toMinutes(weekendsSeconds / weekends) : 0,
    peak: computePeak(secondsByHour),
    averageSessionMinutes: toMinutes(computeAverageSessionSeconds(monthMinutes)),
  };
};

type Params = {
  reads: ChapterRead[];
  activity: ActivityMinute[];
  canonicalKeys: Map<string, string>;
  timeZone: string;
  now: Date;
};

export const computeStatistics = ({
  reads,
  activity,
  canonicalKeys,
  timeZone,
  now,
}: Params): ProfileStatisticsResponse => {
  const firstReads = dedupeChapterReads(reads, canonicalKeys);
  const today = toLocalParts(now, timeZone).date;
  const monthStart = `${today.slice(0, 7)}-01`;

  const byDay = new Map<string, number>();
  const byMonth = new Map<string, number>();
  for (const read of firstReads) {
    const { date } = toLocalParts(read.readAt, timeZone);
    byDay.set(date, (byDay.get(date) ?? 0) + 1);
    const month = `${date.slice(0, 7)}-01`;
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }

  const chaptersByDay: ChaptersReadPoint[] = Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = addDays(today, index - (CHART_DAYS - 1));
    return { date, count: byDay.get(date) ?? 0 };
  });
  const chaptersByMonth: ChaptersReadPoint[] = Array.from({ length: CHART_MONTHS }, (_, index) => {
    const date = addMonths(monthStart, index - (CHART_MONTHS - 1));
    return { date, count: byMonth.get(date) ?? 0 };
  });

  return {
    hasActivity: firstReads.length > 0 || activity.length > 0,
    totals: {
      chapters: firstReads.length,
      titles: new Set(firstReads.map((read) => read.canonicalKey)).size,
    },
    today: {
      chapters: byDay.get(today) ?? 0,
      averagePerDay: sumDays(byDay, addDays(today, -BASELINE_DAYS), BASELINE_DAYS) / BASELINE_DAYS,
    },
    month: {
      chapters: byMonth.get(monthStart) ?? 0,
      daysElapsed: Number(today.slice(8, 10)),
      baselinePerDay:
        sumDays(byDay, addDays(monthStart, -BASELINE_DAYS), BASELINE_DAYS) / BASELINE_DAYS,
    },
    streak: computeStreak(new Set(byDay.keys()), today),
    chaptersByDay,
    chaptersByMonth,
    readingTime: computeReadingTime(activity, timeZone, today),
    tags: computeTags(firstReads),
    sources: computeSources(firstReads),
  };
};
