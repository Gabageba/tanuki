import { z } from 'zod';

/** Глава дочитана до последней страницы. Том, номер и теги сервер берёт у источника сам. */
export const ChapterReadRequestSchema = z.object({
  chapterId: z.string().min(1),
});
export type ChapterReadRequest = z.infer<typeof ChapterReadRequestSchema>;

/** Секунды активного чтения, разложенные по минутам: minute — начало минуты, `YYYY-MM-DDTHH:MM:00Z`. */
export const ReadingActivityRequestSchema = z.object({
  minutes: z
    .array(
      z.object({
        minute: z.string().datetime(),
        seconds: z.number().int().min(1).max(60),
      }),
    )
    .min(1)
    .max(1440),
});
export type ReadingActivityRequest = z.infer<typeof ReadingActivityRequestSchema>;

/** Столбик графика: день (`YYYY-MM-DD`) или месяц (первое число месяца). */
export const ChaptersReadPointSchema = z.object({
  date: z.string(),
  count: z.number().int().min(0),
});
export type ChaptersReadPoint = z.infer<typeof ChaptersReadPointSchema>;

export const TagStatisticSchema = z.object({
  name: z.string(),
  chapters: z.number().int().min(0),
});
export type TagStatistic = z.infer<typeof TagStatisticSchema>;

export const SourceStatisticSchema = z.object({
  id: z.string(),
  title: z.string(),
  chapters: z.number().int().min(0),
});
export type SourceStatistic = z.infer<typeof SourceStatisticSchema>;

/** Время чтения за текущий календарный месяц, в минутах. Пика нет, пока не читали. */
export const ReadingTimeStatisticSchema = z.object({
  totalMinutes: z.number().min(0),
  averagePerDayMinutes: z.number().min(0),
  weekdaysPerDayMinutes: z.number().min(0),
  weekendsPerDayMinutes: z.number().min(0),
  peak: z
    .object({
      /** Час начала окна, 0–23; окно — два часа и может переходить через полночь. */
      fromHour: z.number().int().min(0).max(23),
      percent: z.number().min(0).max(100),
    })
    .nullable(),
  averageSessionMinutes: z.number().min(0),
});
export type ReadingTimeStatistic = z.infer<typeof ReadingTimeStatisticSchema>;

/**
 * Статистика чтения пользователя. Сутки и месяцы — в его часовом поясе (UserSettings.timeZone).
 * Одна глава одного тайтла на связанных источниках считается один раз — по первому прочтению.
 */
export const ProfileStatisticsResponseSchema = z.object({
  /** Прочитана ли хоть одна глава — иначе показывать нечего. */
  hasActivity: z.boolean(),
  totals: z.object({ chapters: z.number().int(), titles: z.number().int() }),
  /** averagePerDay — среднее за 30 дней до сегодня, дни без чтения считаются нулями. */
  today: z.object({ chapters: z.number().int(), averagePerDay: z.number() }),
  /** baselinePerDay — среднее в день за 30 дней до начала месяца; с ним сравнивается темп месяца. */
  month: z.object({
    chapters: z.number().int(),
    daysElapsed: z.number().int(),
    baselinePerDay: z.number(),
  }),
  streak: z.object({ current: z.number().int(), best: z.number().int() }),
  /** 30 дней, последний — сегодня. */
  chaptersByDay: z.array(ChaptersReadPointSchema),
  /** 12 месяцев, последний — текущий. */
  chaptersByMonth: z.array(ChaptersReadPointSchema),
  readingTime: ReadingTimeStatisticSchema,
  tags: z.array(TagStatisticSchema),
  sources: z.array(SourceStatisticSchema),
});
export type ProfileStatisticsResponse = z.infer<typeof ProfileStatisticsResponseSchema>;
