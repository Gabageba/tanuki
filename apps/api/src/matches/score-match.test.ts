import { describe, expect, it } from 'vitest';
import { TITLE_TYPE, MATCH_CONFIDENCE } from '@tanuki/contracts';
import type { MatchSubject } from './models';
import { metadataBonus, scoreMatch } from './score-match';

const subject = (overrides: Partial<MatchSubject> = {}): MatchSubject => ({
  name: 'Jujutsu Kaisen',
  altNames: [],
  authors: [],
  year: null,
  type: null,
  chaptersCount: null,
  tags: [],
  ...overrides,
});

describe('scoreMatch — каналы', () => {
  it('точное совпадение по латинице даёт «точное»', () => {
    const result = scoreMatch(subject(), subject());
    expect(result?.confidence).toBe(MATCH_CONFIDENCE.EXACT);
    expect(result?.score).toBe(1);
  });

  it('совпадение по обоим скриптам весит больше, чем по одному', () => {
    const ref = subject({
      name: 'Клинок рассекающий демонов',
      altNames: ['Demon Slayer'],
    });

    // У обоих кандидатов латинский канал совпадает одинаково — различает их только то, что у
    // первого дополнительно сходится русское название.
    const both = scoreMatch(
      ref,
      subject({
        name: 'Клинок рассекающий демонов навсегда',
        altNames: ['Demon Slayer Chronicles'],
      }),
    );
    const latinOnly = scoreMatch(
      ref,
      subject({ name: 'Наруто', altNames: ['Demon Slayer Chronicles'] }),
    );

    expect(both!.score).toBeGreaterThan(latinOnly!.score);
  });

  it('одинокая нечёткая кириллица не поднимается выше «возможно»', () => {
    const result = scoreMatch(
      subject({ name: 'Истребитель демонов', altNames: [] }),
      subject({ name: 'Истребители демонов', altNames: [] }),
    );

    expect(result).not.toBeNull();
    expect(result?.confidence).toBe(MATCH_CONFIDENCE.LOW);
  });

  it('латиница снимает потолок с нечёткой кириллицы', () => {
    // Оба канала нечёткие, но каждый выше своего пола — согласие двух скриптов поднимает пару
    // до «вероятно», хотя одной кириллицы для этого не хватило бы.
    const result = scoreMatch(
      subject({ name: 'Истребитель демонов', altNames: ['Demon Slayer'] }),
      subject({ name: 'Истребители демонов', altNames: ['Demon Slayer Chronicles'] }),
    );

    expect(result?.confidence).toBe(MATCH_CONFIDENCE.HIGH);
  });

  it('точное совпадение латиницы даёт «точное» даже при нечёткой кириллице', () => {
    const result = scoreMatch(
      subject({ name: 'Истребитель демонов', altNames: ['Kimetsu no Yaiba'] }),
      subject({ name: 'Убийца демонов', altNames: ['Kimetsu no Yaiba'] }),
    );

    expect(result?.confidence).toBe(MATCH_CONFIDENCE.EXACT);
  });

  it('не матчит разные тайтлы', () => {
    expect(scoreMatch(subject({ name: 'Naruto' }), subject({ name: 'Bleach' }))).toBeNull();
  });

  it('не матчит разные части франшизы', () => {
    expect(scoreMatch(subject({ name: 'Overlord' }), subject({ name: 'Overlord II' }))).toBeNull();
  });
});

describe('scoreMatch — сценарии из плана', () => {
  const kaguyaRef = subject({
    name: 'Kaguya-sama wa Kokurasetai',
    year: 2015,
    authors: ['Aka Akasaka'],
  });

  it('подзаголовок того же тайтла вытягивается метаданными до «вероятно»', () => {
    const result = scoreMatch(
      kaguyaRef,
      subject({
        name: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen',
        year: 2015,
        authors: ['Aka Akasaka'],
      }),
    );

    expect(result?.confidence).toBe(MATCH_CONFIDENCE.HIGH);
  });

  it('продолжение с расходящимися метаданными отбрасывается', () => {
    const result = scoreMatch(
      subject({ name: 'Solo Leveling', year: 2018, authors: ['Chugong'] }),
      subject({ name: 'Solo Leveling: Ragnarok', year: 2023, authors: ['Daul'] }),
    );

    expect(result).toBeNull();
  });

  it('тот же спорный случай без метаданных остаётся в «возможных», а не отбрасывается', () => {
    const result = scoreMatch(
      subject({ name: 'Solo Leveling' }),
      subject({ name: 'Solo Leveling: Ragnarok' }),
    );

    expect(result?.confidence).toBe(MATCH_CONFIDENCE.LOW);
  });
});

describe('metadataBonus', () => {
  it('расхождение в год не штрафует, в два — штрафует', () => {
    const tolerated = metadataBonus(subject({ year: 2015 }), subject({ year: 2016 }));
    const conflicting = metadataBonus(subject({ year: 2015 }), subject({ year: 2020 }));

    expect(tolerated.bonus).toBe(0);
    expect(tolerated.yearConflicts).toBe(false);
    expect(conflicting.bonus).toBeLessThan(0);
    expect(conflicting.yearConflicts).toBe(true);
  });

  it('узнаёт одного автора, записанного по-разному', () => {
    const result = metadataBonus(
      subject({ authors: ['Такэути Наоко'] }),
      subject({ authors: ['Naoko Takeuchi'] }),
    );

    expect(result.authorsAgree).toBe(true);
    expect(result.bonus).toBeGreaterThan(0);
  });

  it('не штрафует за расхождение авторов', () => {
    const result = metadataBonus(subject({ authors: ['Kubo'] }), subject({ authors: ['Oda'] }));

    expect(result.authorsAgree).toBe(false);
    expect(result.bonus).toBe(0);
  });

  it('сильно разное число глав не даёт ни бонуса, ни штрафа', () => {
    const diverged = metadataBonus(subject({ chaptersCount: 200 }), subject({ chaptersCount: 30 }));
    const missing = metadataBonus(
      subject({ chaptersCount: null }),
      subject({ chaptersCount: null }),
    );

    expect(diverged.bonus).toBe(missing.bonus);
    expect(diverged.agreements).toBe(missing.agreements);
  });

  it('близкое число глав даёт небольшой бонус', () => {
    const result = metadataBonus(subject({ chaptersCount: 100 }), subject({ chaptersCount: 95 }));
    expect(result.bonus).toBeGreaterThan(0);
  });

  it('совпавший тип даёт согласие', () => {
    const result = metadataBonus(
      subject({ type: TITLE_TYPE.MANHWA }),
      subject({ type: TITLE_TYPE.MANHWA }),
    );
    expect(result.agreements).toBe(1);
  });
});

describe('scoreMatch — устойчивость', () => {
  it('пустые метаданные кандидата не ломают скоринг', () => {
    const result = scoreMatch(
      subject({ name: 'Jujutsu Kaisen', year: 2018, authors: ['Gege Akutami'] }),
      subject({ name: 'Jujutsu Kaisen' }),
    );

    expect(result?.confidence).toBe(MATCH_CONFIDENCE.EXACT);
  });

  it('число глав не влияет на итоговый скор при сильном расхождении', () => {
    const withChapters = scoreMatch(
      subject({ chaptersCount: 200 }),
      subject({ chaptersCount: 30 }),
    );
    const withoutChapters = scoreMatch(subject(), subject());

    expect(withChapters?.score).toBe(withoutChapters?.score);
  });
});

describe('scoreMatch — противоречие каналов', () => {
  it('не выдаёт точное совпадение, когда каналы расходятся', () => {
    // Спин-офф несёт альтернативное название всей франшизы, поэтому латиница совпадает точно,
    // а русские названия расходятся подзаголовком.
    const result = scoreMatch(
      subject({ name: 'Магическая битва', altNames: ['Jujutsu Kaisen'] }),
      subject({ name: 'Магическая битва: Модуль', altNames: ['Jujutsu Kaisen'] }),
    );

    expect(result?.confidence).toBe(MATCH_CONFIDENCE.HIGH);
  });

  it('не считает противоречием несовпавшую кириллицу', () => {
    // Разные переводы одного названия — норма, латиница тут единственный надёжный сигнал.
    const result = scoreMatch(
      subject({ name: 'Клинок рассекающий демонов', altNames: ['Kimetsu no Yaiba'] }),
      subject({ name: 'Убийца демонов', altNames: ['Kimetsu no Yaiba'] }),
    );

    expect(result?.confidence).toBe(MATCH_CONFIDENCE.EXACT);
  });
});
