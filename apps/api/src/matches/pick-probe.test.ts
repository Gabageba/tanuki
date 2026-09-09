import { describe, expect, it } from 'vitest';
import type { MatchSubject } from './models';
import { MATCH_WAVE, pickProbe } from './pick-probe';

const subject = (overrides: Partial<MatchSubject> = {}): MatchSubject => ({
  title: 'Jujutsu Kaisen',
  altTitles: [],
  authors: [],
  year: null,
  type: null,
  chaptersCount: null,
  tags: [],
  ...overrides,
});

describe('pickProbe — первая волна', () => {
  it('предпочитает латинское название русскому', () => {
    const probe = pickProbe(
      subject({ title: 'Магическая битва', altTitles: ['Jujutsu Kaisen'] }),
      MATCH_WAVE.PRIMARY,
    );

    expect(probe).toBe('jujutsu kaisen');
  });

  it('берёт русское, если латинского нет', () => {
    const probe = pickProbe(subject({ title: 'Магическая битва' }), MATCH_WAVE.PRIMARY);
    expect(probe).toBe('магическая битва');
  });

  it('не использует транслитерацию как запрос', () => {
    // «solo leveling» мы придумали сами — в чужом поисковом индексе такой строки нет.
    const probe = pickProbe(subject({ title: 'Соло Левелинг' }), MATCH_WAVE.PRIMARY);
    expect(probe).toBe('соло левелинг');
  });

  it('обрезает длинное название', () => {
    const probe = pickProbe(
      subject({ title: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen' }),
      MATCH_WAVE.PRIMARY,
    );

    expect(probe).toBe('kaguya sama wa kokurasetai');
  });

  it('возвращает null на пустом названии', () => {
    expect(pickProbe(subject({ title: '   ' }), MATCH_WAVE.PRIMARY)).toBeNull();
  });
});

describe('pickProbe — вторая волна', () => {
  it('идёт русским названием', () => {
    const probe = pickProbe(
      subject({ title: 'Магическая битва', altTitles: ['Jujutsu Kaisen'] }),
      MATCH_WAVE.FALLBACK,
    );

    expect(probe).toBe('магическая битва');
  });

  it('не повторяет запрос первой волны, когда второго скрипта нет', () => {
    expect(pickProbe(subject({ title: 'Магическая битва' }), MATCH_WAVE.FALLBACK)).toBeNull();
    expect(pickProbe(subject({ title: 'Jujutsu Kaisen' }), MATCH_WAVE.FALLBACK)).toBeNull();
  });
});
