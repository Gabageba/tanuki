import { describe, expect, it } from 'vitest';
import { CYRILLIC_FLOOR, LATIN_FLOOR } from './models';
import {
  containmentScore,
  diceBigrams,
  jaccardStems,
  seasonOf,
  titleSimilarity,
} from './similarity';

describe('diceBigrams', () => {
  it('считает по мультимножеству, а не по множеству биграмм', () => {
    // На Set-версии это дало бы 1.0 — короткая строка «покрывала» бы длинную.
    expect(diceBigrams('аааа', 'аа')).toBeLessThan(1);
  });

  it('симметричен и даёт 1 на равных строках', () => {
    expect(diceBigrams('naruto', 'naruto')).toBe(1);
    expect(diceBigrams('naruto', 'narutoo')).toBe(diceBigrams('narutoo', 'naruto'));
  });

  it('не падает и не даёт NaN на пустых строках', () => {
    expect(diceBigrams('', 'naruto')).toBe(0);
    expect(diceBigrams('', '')).toBe(0);
    expect(diceBigrams('a', 'b')).toBe(0);
  });
});

describe('jaccardStems', () => {
  it('сводит разные формы русских слов к одному значению', () => {
    expect(jaccardStems('истребитель демонов', 'истребители демонов')).toBe(1);
  });

  it('игнорирует порядок слов', () => {
    expect(jaccardStems('demon slayer', 'slayer demon')).toBe(1);
  });

  it('не обнуляется, когда стоп-слова съедают одну сторону', () => {
    expect(jaccardStems('the a of', 'the a of')).toBe(1);
  });

  it('различает разные названия', () => {
    expect(jaccardStems('naruto', 'bleach')).toBe(0);
  });
});

describe('seasonOf', () => {
  it('считает название без номера первой частью', () => {
    expect(seasonOf('overlord')).toBe(1);
    expect(seasonOf('vinland saga')).toBe(1);
    expect(seasonOf('fate stay night')).toBe(1);
  });

  it('распознаёт явные маркеры сезона', () => {
    expect(seasonOf('overlord season 2')).toBe(2);
    expect(seasonOf('оверлорд сезон 3')).toBe(3);
    expect(seasonOf('overlord 2nd season')).toBe(2);
    expect(seasonOf('магическая битва часть 2')).toBe(2);
  });

  it('распознаёт замыкающую римскую цифру', () => {
    expect(seasonOf('overlord ii')).toBe(2);
    expect(seasonOf('overlord iv')).toBe(4);
  });

  it('не принимает год за номер сезона', () => {
    expect(seasonOf('berserk 1998')).toBe(1);
  });
});

describe('containmentScore', () => {
  it('засчитывает хвост из пометок формата', () => {
    expect(containmentScore('naruto', 'naruto манга').value).toBeGreaterThan(0.9);
  });

  it('отменяет вхождение и штрафует на маркере продолжения', () => {
    const result = containmentScore('naruto', 'naruto shippuden');
    expect(result.value).toBe(0);
    expect(result.penalty).toBeLessThan(0);
  });

  it('засчитывает издание, но просит понизить уверенность', () => {
    const result = containmentScore('bleach манга', 'bleach манга colored');
    expect(result.value).toBeGreaterThan(0.9);
    expect(result.demote).toBe(true);
  });

  it('на хвосте из собственных имён не поднимается выше «возможно»', () => {
    expect(containmentScore('solo leveling', 'solo leveling ragnarok').value).toBe(0.72);
  });

  it('не срабатывает на коротком однословном названии', () => {
    expect(containmentScore('gin', 'gin tama something').value).toBe(0);
  });

  it('не срабатывает, если одно не является началом другого', () => {
    expect(containmentScore('demon slayer', 'kimetsu no yaiba').value).toBe(0);
  });
});

describe('titleSimilarity', () => {
  it('даёт единицу на точном совпадении', () => {
    expect(titleSimilarity('jujutsu kaisen', 'jujutsu kaisen').value).toBe(1);
  });

  it('схлопывает смешанный скрипт при строгом равенстве', () => {
    expect(titleSimilarity('сoло левелинг', 'соло левелинг').value).toBe(1);
  });

  it('почти не штрафует перестановку слов', () => {
    expect(titleSimilarity('demon slayer', 'slayer demon').value).toBe(0.97);
  });

  it('разводит разные части франшизы в ноль', () => {
    expect(titleSimilarity('overlord', 'overlord ii').value).toBe(0);
  });

  it('не считает продолжение тем же тайтлом', () => {
    expect(titleSimilarity('naruto', 'naruto shippuden').value).toBeLessThan(LATIN_FLOOR);
  });

  it('сводит разные любительские переводы одного названия', () => {
    expect(
      titleSimilarity('истребитель демонов', 'истребители демонов').value,
    ).toBeGreaterThanOrEqual(CYRILLIC_FLOOR);
  });

  it('оставляет спорный подзаголовок на уровне «возможно»', () => {
    expect(titleSimilarity('solo leveling', 'solo leveling ragnarok').value).toBe(0.72);
  });

  it('не сводит разные тайтлы', () => {
    expect(titleSimilarity('naruto', 'bleach').value).toBeLessThan(CYRILLIC_FLOOR);
  });
});
