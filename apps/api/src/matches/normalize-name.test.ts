import { describe, expect, it } from 'vitest';
import { NAME_SCRIPT } from './models';
import {
  expandTitle,
  foldHomoglyphs,
  normalizeTitle,
  probeHead,
  romanize,
  scriptOf,
  stemRu,
  titleVariants,
} from './normalize-name';

describe('normalizeTitle', () => {
  it('снимает регистр, диакритику и схлопывает пробелы', () => {
    expect(normalizeTitle('  Ōoku:   Inner   Chambers ')).toBe('ooku inner chambers');
  });

  it('разводит всю семью тире в пробелы', () => {
    expect(normalizeTitle('Kaguya-sama wa Kokurasetai')).toBe('kaguya sama wa kokurasetai');
    expect(normalizeTitle('Re:Zero — Starting Life')).toBe('re zero starting life');
  });

  it('удаляет апострофы, а не превращает их в пробел', () => {
    expect(normalizeTitle("D'Artagnan")).toBe('dartagnan');
    expect(normalizeTitle('D’Artagnan')).toBe('dartagnan');
  });

  it('приводит ё к е', () => {
    expect(normalizeTitle('Тёмный дворецкий')).toBe('темныи дворецкии');
  });
});

describe('scriptOf', () => {
  it('различает скрипты, смешанные считает кириллицей', () => {
    expect(scriptOf('Jujutsu Kaisen')).toBe(NAME_SCRIPT.LATIN);
    expect(scriptOf('Магическая битва')).toBe(NAME_SCRIPT.CYRILLIC);
    expect(scriptOf('Магическая битва S2')).toBe(NAME_SCRIPT.CYRILLIC);
  });
});

describe('romanize', () => {
  it('транслитерирует заимствования', () => {
    expect(romanize('соло левелинг')).toBe('solo leveling');
    expect(romanize('щит')).toBe('schit');
  });

  it('не трогает латиницу', () => {
    expect(romanize('solo leveling')).toBe('solo leveling');
  });
});

describe('foldHomoglyphs', () => {
  it('схлопывает кириллицу, неотличимую на вид от латиницы', () => {
    // «Сoло» тут написано смешанным скриптом — латинская o внутри кириллического слова.
    expect(foldHomoglyphs('сoло')).toBe(foldHomoglyphs('соло'));
  });
});

describe('stemRu', () => {
  it('сводит разные формы одного слова к одной основе', () => {
    expect(stemRu('истребители')).toBe(stemRu('истребитель'));
    expect(stemRu('рассекающий')).toBe(stemRu('рассекающая'));
    expect(stemRu('демонов')).toBe(stemRu('демоны'));
  });

  it('не трогает короткие токены', () => {
    expect(stemRu('ки')).toBe('ки');
    expect(stemRu('гин')).toBe('гин');
  });

  it('не схлопывает разные слова', () => {
    expect(stemRu('демоны')).not.toBe(stemRu('дракон'));
  });
});

describe('expandTitle', () => {
  it('разбивает склейку из двух названий', () => {
    expect(expandTitle('Магическая битва / Jujutsu Kaisen')).toEqual([
      'Магическая битва',
      'Jujutsu Kaisen',
    ]);
  });

  it('поднимает кросс-скриптовую скобку в отдельное название', () => {
    expect(expandTitle('Клинок, рассекающий демонов (Kimetsu no Yaiba)')).toEqual([
      'Клинок, рассекающий демонов',
      'Kimetsu no Yaiba',
    ]);
  });

  it('выбрасывает скобку с пометкой формата, даже если скрипт другой', () => {
    expect(expandTitle('Naruto (манга)')).toEqual(['Naruto']);
  });

  it('выбрасывает односкриптовую скобку с подзаголовком', () => {
    expect(expandTitle('Bleach (Shinigami Arc)')).toEqual(['Bleach']);
  });

  it('сохраняет скобку с пометкой издания', () => {
    // Снеся её, мы выдали бы цветное издание за точное совпадение с обычным — пусть хвост
    // увидит containmentScore и понизит уверенность.
    expect(expandTitle('Магическая битва (Цветная версия)')).toEqual([
      'Магическая битва (Цветная версия)',
    ]);
  });

  it('оставляет содержимое скобки, если головы нет', () => {
    expect(expandTitle('(Kimetsu no Yaiba)')).toEqual(['Kimetsu no Yaiba']);
  });
});

describe('titleVariants', () => {
  const valuesOf = (subject: { name: string; altNames: string[] }) =>
    titleVariants(subject).map((variant) => variant.value);

  it('собирает формы из title и altTitles', () => {
    const values = valuesOf({
      name: 'Магическая битва / Jujutsu Kaisen',
      altNames: ['Sorcery Fight'],
    });

    expect(values).toContain('магическая битва');
    expect(values).toContain('jujutsu kaisen');
    expect(values).toContain('sorcery fight');
  });

  it('не отрезает подзаголовок в отдельный вариант', () => {
    // Иначе «Solo Leveling» совпало бы с головой своего же продолжения в обход
    // containmentScore, который как раз и умеет разбирать отброшенный хвост.
    const values = valuesOf({ name: 'Solo Leveling: Ragnarok', altNames: [] });

    expect(values).toContain('solo leveling ragnarok');
    expect(values).not.toContain('solo leveling');
  });

  it('добавляет транслитерацию кириллических названий как производный вариант', () => {
    const variants = titleVariants({ name: 'Соло Левелинг', altNames: [] });
    const romanized = variants.find((v) => v.value === 'solo leveling');

    expect(romanized).toBeDefined();
    expect(romanized?.derived).toBe(true);
    expect(romanized?.script).toBe(NAME_SCRIPT.LATIN);
  });

  it('не дублирует одинаковые формы и не понижает настоящее название до производного', () => {
    const variants = titleVariants({
      name: 'Соло Левелинг',
      altNames: ['Solo Leveling', 'СОЛО ЛЕВЕЛИНГ'],
    });
    const romanized = variants.filter((v) => v.value === 'solo leveling');

    expect(romanized).toHaveLength(1);
    // Настоящее латинское название пришло от источника — оно не производное, даже если
    // транслитерация кириллического дала ту же строку.
    expect(romanized[0]?.derived).toBe(false);
  });

  it('игнорирует пустые названия', () => {
    expect(valuesOf({ name: 'Naruto', altNames: ['', '   '] })).toEqual(['naruto']);
  });
});

describe('probeHead', () => {
  it('режет по двоеточию', () => {
    expect(probeHead('Kaguya-sama: Love is War')).toBe('Kaguya-sama');
  });

  it('ограничивает число токенов', () => {
    expect(probeHead('a b c d e f g')).toBe('a b c d');
  });

  it('ограничивает длину', () => {
    expect(probeHead('Kokurasetai Tensaitachi Renaizunousen').length).toBeLessThanOrEqual(40);
  });

  it('возвращает исходное короткое название как есть', () => {
    expect(probeHead('Naruto')).toBe('Naruto');
  });
});
