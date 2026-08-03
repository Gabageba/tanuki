import { describe, expect, it } from 'vitest';
import { parseRuRelativeDate, parseGroupleDate } from '../src/core/text/dates';

describe('parseRuRelativeDate', () => {
  const now = new Date(2026, 6, 15, 12, 0, 0); // Wed 2026-07-15 (local)

  it('returns 0 for unparseable input', () => {
    expect(parseRuRelativeDate(null)).toBe(0);
    expect(parseRuRelativeDate('')).toBe(0);
    expect(parseRuRelativeDate('garbage')).toBe(0);
  });

  it('parses "Сегодня в HH:mm" as today', () => {
    const ms = parseRuRelativeDate('Сегодня в 23:45', now);
    const d = new Date(ms);
    expect(d.getDate()).toBe(now.getDate());
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(45);
  });

  it('parses "Вчера в HH:mm" as yesterday', () => {
    const ms = parseRuRelativeDate('Вчера в 08:05', now);
    const d = new Date(ms);
    expect(d.getDate()).toBe(now.getDate() - 1);
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(5);
  });

  it('parses a weekday name as the nearest past occurrence, never today', () => {
    // `now` is a Wednesday — asking for "Среда" (Wednesday) must still step back a full week,
    // matching the Kotlin do-while that always decrements at least once.
    const ms = parseRuRelativeDate('Среда в 00:13', now);
    const d = new Date(ms);
    expect(d.getDay()).toBe(3); // Wednesday
    expect(d.getTime()).toBeLessThan(now.getTime() - 24 * 3600 * 1000);
  });

  it('parses an absolute Russian date', () => {
    const ms = parseRuRelativeDate('9 ноя 2022 в 22:13', now);
    const d = new Date(ms);
    expect(d.getFullYear()).toBe(2022);
    expect(d.getMonth()).toBe(10); // November
    expect(d.getDate()).toBe(9);
    expect(d.getHours()).toBe(22);
    expect(d.getMinutes()).toBe(13);
  });

  it('returns 0 for an unrecognized month name', () => {
    expect(parseRuRelativeDate('9 нейа 2022 в 22:13', now)).toBe(0);
  });
});

describe('parseGroupleDate', () => {
  it('returns 0 for unparseable input', () => {
    expect(parseGroupleDate(null)).toBe(0);
    expect(parseGroupleDate('')).toBe(0);
    expect(parseGroupleDate('not a date')).toBe(0);
  });

  it('parses the primary dd.MM.yy format', () => {
    const ms = parseGroupleDate('05.03.24');
    const d = new Date(ms);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDate()).toBe(5);
  });

  it('parses ISO-ish fallback formats', () => {
    expect(new Date(parseGroupleDate('2024-03-05 12:30:00.000')).getFullYear()).toBe(2024);
    expect(new Date(parseGroupleDate('2024-03-05T12:30:00.000Z')).getDate()).toBe(5);
    expect(new Date(parseGroupleDate('2024-03-05T12:30:00Z')).getMonth()).toBe(2);
    expect(new Date(parseGroupleDate('2024-03-05')).getFullYear()).toBe(2024);
  });

  it('always returns epoch millis, not seconds', () => {
    const ms = parseGroupleDate('05.03.24');
    expect(ms).toBeGreaterThan(1e12);
  });
});
