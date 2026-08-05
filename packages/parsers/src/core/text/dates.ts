const MONTHS_RU: Record<string, number> = {
  янв: 0,
  фев: 1,
  мар: 2,
  апр: 3,
  май: 4,
  июн: 5,
  июл: 6,
  авг: 7,
  сен: 8,
  окт: 9,
  ноя: 10,
  дек: 11,
};

/** JS Date.getDay() numbering: Sunday = 0 .. Saturday = 6. */
const WEEKDAYS_RU: Record<string, number> = {
  воскресенье: 0,
  понедельник: 1,
  вторник: 2,
  среда: 3,
  четверг: 4,
  пятница: 5,
  суббота: 6,
};

/**
 * Desu chapter dates: "Сегодня в 23:45", "Вчера в 23:45", "Четверг в 00:13" (nearest past
 * occurrence of that weekday), or "9 ноя 2022 в 22:13". Ported from DesuMeParser.parseChapterDate
 * — no library in the ecosystem handles Russian relative dates. Returns epoch millis, 0 = unknown.
 */
export function parseRuRelativeDate(raw: string | null | undefined, now = new Date()): number {
  const text = raw?.trim() ?? '';
  const parts = text.split(' в ');
  if (parts.length !== 2) return 0;
  const [datePart, timePart] = parts as [string, string];

  const timeMatch = /(\d{1,2}):(\d{2})/.exec(timePart);
  if (!timeMatch) return 0;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  const lowerDate = datePart.toLowerCase();
  if (lowerDate === 'сегодня') {
    // no-op — already today
  } else if (lowerDate === 'вчера') {
    result.setDate(result.getDate() - 1);
  } else if (lowerDate in WEEKDAYS_RU) {
    const targetDay = WEEKDAYS_RU[lowerDate];
    do {
      result.setDate(result.getDate() - 1);
    } while (result.getDay() !== targetDay);
  } else {
    const dateMatch = /(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i.exec(datePart);
    if (!dateMatch) return 0;
    const day = Number(dateMatch[1]);
    const monthKey = dateMatch[2]!.toLowerCase().slice(0, 3);
    const month = MONTHS_RU[monthKey];
    if (month === undefined) return 0;
    const year = Number(dateMatch[3]);
    result.setFullYear(year, month, day);
  }
  return result.getTime();
}

const SHORT_DATE = /^(\d{2})\.(\d{2})\.(\d{2})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?)?Z?$/;

/**
 * Grouple chapter dates: primary "dd.MM.yy", with ISO-ish fallbacks
 * ("yyyy-MM-dd[ HH:mm:ss[.SSS]]", "yyyy-MM-dd'T'HH:mm:ss[.SSS]['Z']"). Ported from
 * GroupleParser.parseChapterAnyDate. Returns epoch millis, 0 = unknown/unparseable.
 */
export function parseGroupleDate(raw: string | null | undefined): number {
  const text = raw?.trim();
  if (!text) return 0;

  const shortMatch = SHORT_DATE.exec(text);
  if (shortMatch) {
    const day = Number(shortMatch[1]);
    const month = Number(shortMatch[2]) - 1;
    const year = 2000 + Number(shortMatch[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  const isoMatch = ISO_DATE.exec(text);
  if (isoMatch) {
    const [, y, mo, d, h = '0', mi = '0', s = '0', ms = '0'] = isoMatch;
    const date = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s),
      Number(ms),
    );
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  return 0;
}

const DD_MM_YYYY = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/** "dd.MM.yyyy" (full 4-digit year) — MangaBuff and Com-X chapter dates. Returns epoch millis, 0 = unknown. */
export function parseDdMmYyyy(raw: string | null | undefined): number {
  const text = raw?.trim();
  if (!text) return 0;
  const match = DD_MM_YYYY.exec(text);
  if (!match) return 0;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
