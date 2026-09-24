import { describe, expect, it } from 'vitest';
import { READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import type { RawChapter } from '../parsers-client/parsers-client.types';
import {
  alignBySnapshot,
  alignChapter,
  normalizeChapterTitle,
  toReadingOrder,
} from './chapter-alignment';
import { CHAPTER_NUMBERING } from '@tanuki/contracts';
import { detectNumbering } from '../common/normalize';

let nextId = 1;

const chapter = (
  number: number | null,
  title: string | null = null,
  volume: number | null = null,
): RawChapter => ({
  id: nextId++,
  number,
  title,
  volume,
  url: `/c/${nextId}`,
  scanlator: null,
  uploadDate: 0,
  branch: null,
  source: 'test',
});

const range = (from: number, to: number, volume: number | null = null) =>
  Array.from({ length: to - from + 1 }, (_, index) => chapter(from + index, null, volume));

describe('detectNumbering', () => {
  it('номер, сбросившийся в новом томе, — нумерация по томам', () => {
    const chapters = [...range(1, 3, 1), ...range(1, 3, 2)];
    expect(detectNumbering(toReadingOrder(chapters))).toBe(CHAPTER_NUMBERING.PER_VOLUME);
  });

  it('одна глава с ошибочным томом сквозную нумерацию не ломает', () => {
    const chapters = [
      ...range(1, 5, 1),
      ...range(6, 10, 2),
      chapter(3.5, null, 3),
      ...range(11, 15, 3),
    ];
    expect(detectNumbering(chapters)).toBe(CHAPTER_NUMBERING.GLOBAL);
    expect(toReadingOrder(chapters)[3]?.number).toBe(3.5);
  });

  it('тома со сквозным номером и главы без тома — сквозная', () => {
    expect(detectNumbering(toReadingOrder([...range(1, 3, 1), ...range(4, 6, 2)]))).toBe(
      CHAPTER_NUMBERING.GLOBAL,
    );
    expect(detectNumbering(toReadingOrder(range(1, 5)))).toBe(CHAPTER_NUMBERING.GLOBAL);
  });
});

describe('normalizeChapterTitle', () => {
  it('срезает служебный префикс, регистр и пунктуацию', () => {
    expect(normalizeChapterTitle('Т.3 Гл.12: Буря!')).toBe('буря');
    expect(normalizeChapterTitle('Chapter 5 — The Storm')).toBe('the storm');
    expect(normalizeChapterTitle('Ёжик')).toBe('ежик');
  });

  it('срезает префиксы в любом из форматов источников', () => {
    expect(normalizeChapterTitle('1 - 1 Жестокость')).toBe('жестокость');
    expect(normalizeChapterTitle('1. Глава 8.5 Экстра')).toBeNull();
    expect(normalizeChapterTitle('12 Экстра Униформа Митсури-тян')).toBe('униформа митсури тян');
    expect(normalizeChapterTitle('Экстра: Омаке')).toBe('омаке');
  });

  it('название из одного номера названием не считается', () => {
    expect(normalizeChapterTitle('Глава 12')).toBeNull();
    expect(normalizeChapterTitle('12')).toBeNull();
  });
});

describe('alignChapter', () => {
  it('сквозная ↔ сквозная — точно по номеру', () => {
    const source = range(1, 50);
    const target = range(1, 48);
    const mark = source[29];

    expect(alignChapter(source, mark?.id ?? 0, target)).toMatchObject({
      chapter: { number: 30 },
      confidence: READING_MARK_CONFIDENCE.EXACT,
    });
  });

  it('по томам ↔ по томам — точно по тому и номеру', () => {
    const source = [...range(1, 10, 1), ...range(1, 10, 2)];
    const target = [...range(1, 10, 1), ...range(1, 10, 2)];
    const mark = source[14]; // Т.2 Гл.5

    expect(alignChapter(source, mark?.id ?? 0, target)).toMatchObject({
      chapter: { volume: 2, number: 5 },
      confidence: READING_MARK_CONFIDENCE.EXACT,
    });
  });

  it('по томам ↔ сквозная — номера не сравниваются, совпадение по названиям', () => {
    const titles = ['Начало', 'Встреча', 'Буря', 'Затишье', 'Возвращение', 'Финал'];
    const source = titles.map((title, index) => chapter((index % 3) + 1, title, index < 3 ? 1 : 2));
    const target = titles.map((title, index) => chapter(index + 1, `Глава ${index + 1}: ${title}`));
    const mark = source[4]; // Т.2 Гл.2 «Возвращение»

    expect(alignChapter(source, mark?.id ?? 0, target)).toMatchObject({
      chapter: { number: 5 },
      confidence: READING_MARK_CONFIDENCE.EXACT,
    });
  });

  it('по томам ↔ сквозная без названий — перевод номера, примерно и с отступом назад', () => {
    const source = [...range(1, 10, 1), ...range(1, 10, 2)];
    const target = range(1, 20);
    const mark = source[14]; // Т.2 Гл.5 — сквозная 15-я

    expect(alignChapter(source, mark?.id ?? 0, target)).toMatchObject({
      chapter: { number: 12 },
      confidence: READING_MARK_CONFIDENCE.APPROXIMATE,
    });
    // В первом томе переводить нечего — и отступать тоже.
    expect(alignChapter(source, source[4]?.id ?? 0, target)?.chapter.number).toBe(5);
  });

  it('сквозная ↔ по томам без названий — последняя глава не дальше отметки', () => {
    const source = range(1, 20);
    const target = [...range(1, 10, 1), ...range(1, 10, 2)];
    const mark = source[14]; // 15-я — Т.2 Гл.5

    expect(alignChapter(source, mark?.id ?? 0, target)).toMatchObject({
      chapter: { volume: 2, number: 5 },
      confidence: READING_MARK_CONFIDENCE.APPROXIMATE,
    });
  });

  it('глава, которой нет во втором списке, — ближайшая раньше неё, примерно', () => {
    const source = [...range(1, 10), chapter(10.5), ...range(11, 20)];
    const target = range(1, 20);
    const mark = source.find((item) => item.number === 10.5);

    expect(alignChapter(source, mark?.id ?? 0, target)).toMatchObject({
      chapter: { number: 10 },
      confidence: READING_MARK_CONFIDENCE.APPROXIMATE,
    });
  });

  it('безномерная экстра между главами переносится между соседями', () => {
    const extra = chapter(null, 'Экстра');
    const source = [...range(1, 10), extra];
    const target = range(1, 12);

    // Без номера экстра уходит в хвост порядка чтения — после десятой главы.
    expect(alignChapter(source, extra.id, target)).toMatchObject({
      confidence: READING_MARK_CONFIDENCE.APPROXIMATE,
    });
  });

  it('ложное совпадение названия против порядка чтения отбрасывается', () => {
    const titles = ['Пролог', 'Встреча', 'Буря', 'Затишье', 'Возвращение', 'Финал'];
    const source = [
      ...titles.map((title, index) => chapter((index % 3) + 1, title, index < 3 ? 1 : 2)),
    ];
    // «Финал» во втором списке стоит первым — это другой «Финал», он противоречит остальным.
    const target = [
      chapter(1, 'Финал'),
      ...titles.slice(0, 5).map((title, index) => chapter(index + 2, title)),
    ];
    const mark = source[5]; // «Финал»

    const aligned = alignChapter(source, mark?.id ?? 0, target);
    expect(aligned?.chapter.number).not.toBe(1);
    expect(aligned?.confidence).toBe(READING_MARK_CONFIDENCE.APPROXIMATE);
  });

  it('лишняя глава у одного источника: номер уступает названию', () => {
    const titles = ['Кинг', 'Зомбимэн', 'Милая маска', 'Сверхчеловек', 'Рандеву'];
    const source = titles.map((title, index) => chapter(index + 1, title));
    // Во втором источнике после «Кинга» есть глава, которой в первом нет: дальше номера на
    // единицу больше, и глава 2 там — совсем другая глава.
    const target = [
      chapter(1, 'Кинг'),
      chapter(2, 'Утраченное хладнокровие'),
      ...titles.slice(1).map((title, index) => chapter(index + 3, title)),
    ];

    expect(alignChapter(source, source[1]?.id ?? 0, target)).toMatchObject({
      chapter: { number: 3, title: 'Зомбимэн' },
      confidence: READING_MARK_CONFIDENCE.EXACT,
    });
  });

  it('экстры, пронумерованные источниками наоборот, узнаются по названию', () => {
    const source = [
      chapter(1, 'Начало'),
      chapter(1.5, 'Создание группы'),
      chapter(1.6, 'Омаке'),
      chapter(2, 'Конец'),
    ];
    const target = [
      chapter(1, 'Начало'),
      chapter(1.5, 'Омаке'),
      chapter(1.6, 'Экстра — Создание группы'),
      chapter(2, 'Конец'),
    ];

    expect(alignChapter(source, source[1]?.id ?? 0, target)).toMatchObject({
      chapter: { number: 1.6 },
      confidence: READING_MARK_CONFIDENCE.EXACT,
    });
  });

  it('одинаковое название далеко по номеру — не та же глава', () => {
    const source = [...range(1, 29), chapter(30, 'Конец')];
    const target = [...range(1, 9), chapter(10, 'Конец')];

    // «Конец» десятой главы второго списка не отбирает её у десятой главы первого.
    expect(alignChapter(source, source[9]?.id ?? 0, target)).toMatchObject({
      chapter: { number: 10 },
      confidence: READING_MARK_CONFIDENCE.EXACT,
    });
  });

  it('ветка, начинающаяся с середины, — до первого якоря на столько же глав назад', () => {
    const source = [
      chapter(120, 'Монстры против героев'),
      chapter(121, 'Окружённый'),
      ...range(122, 130),
    ];
    const target = [
      ...range(1, 119),
      chapter(120, 'Захват'),
      chapter(121, 'Окруженный'),
      ...range(122, 130),
    ];

    // Ни номер 120 (названия разные), ни что-то до него не совпало — но отметка не улетает в
    // начало второго списка, а встаёт на главу раньше первого якоря.
    const aligned = alignChapter(source, source[0]?.id ?? 0, target);
    expect(aligned?.chapter.number).toBeGreaterThanOrEqual(119);
  });

  it('отметка до первой общей главы — не найдено', () => {
    const source = range(1, 20);
    const target = range(10, 20);
    const mark = source[2];

    expect(alignChapter(source, mark?.id ?? 0, target)).toBeNull();
  });

  it('интерполяция между якорями при разной частоте глав', () => {
    // Во втором источнике каждая глава разбита на две половины без названий и номеров-совпадений.
    const source = [chapter(1, 'Альфа'), ...range(2, 9), chapter(10, 'Омега')];
    const target = [
      chapter(1, 'Альфа'),
      ...Array.from({ length: 16 }, (_, index) => chapter(1.1 + index * 0.5)),
      chapter(9.1, 'Омега'),
    ];
    const mark = source[5]; // середина между якорями

    const aligned = alignChapter(source, mark?.id ?? 0, target);
    expect(aligned?.confidence).toBe(READING_MARK_CONFIDENCE.APPROXIMATE);
    const index = target.findIndex((item) => item.id === aligned?.chapter.id);
    expect(index).toBeGreaterThan(5);
    expect(index).toBeLessThan(12);
  });
});

describe('alignBySnapshot', () => {
  it('том и номер, затем название', () => {
    const target = [...range(1, 5, 1), chapter(1, 'Буря', 2)];

    expect(alignBySnapshot({ volume: 1, number: 3, title: null }, target)?.chapter.number).toBe(3);
    expect(alignBySnapshot({ volume: 9, number: 9, title: 'буря.' }, target)?.chapter.volume).toBe(
      2,
    );
  });

  it('номер без тома сравнивается только со сквозной нумерацией', () => {
    expect(alignBySnapshot({ volume: null, number: 4, title: null }, range(1, 10))).toMatchObject({
      chapter: { number: 4 },
    });

    const perVolume = [...range(1, 5, 1), ...range(1, 5, 2)];
    expect(alignBySnapshot({ volume: null, number: 4, title: null }, perVolume)).toBeNull();
  });
});
