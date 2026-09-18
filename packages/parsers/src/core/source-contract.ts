import type { Parser } from './parser';
import type { RawTitle } from '../types';

const LIST_LIMIT = 20;

/** Что именно не сошлось — попадает в lastError источника и в сообщение упавшего теста. */
export class SourceContractError extends Error {}

/**
 * Полный путь чтения источника: каталог → страница тайтла → страницы главы. Это и есть рабочее
 * определение «источник жив»: каталог может отдаваться, пока чтение уже сломано, а именно чтение
 * пользователю и нужно.
 *
 * Одно описание на двоих — ночной контрактный тест (contract/live.test.ts) и рантаймовый пробник
 * (apps/api SourceProbeService) зовут эту функцию, чтобы «рабочий источник» не начал означать в
 * них разное.
 */
export const runSourceContract = async (parser: Parser): Promise<void> => {
  let list: RawTitle[];
  try {
    list = await parser.getList({ offset: 0, limit: LIST_LIMIT });
  } catch (error) {
    throw new SourceContractError(`getList: ${describeError(error)}`);
  }
  if (list.length === 0) {
    throw new SourceContractError('getList вернул пустой каталог');
  }
  if (list[0]!.chapters !== null) {
    throw new SourceContractError('getList вернул элемент с непустыми chapters');
  }

  // Один элемент каталога с честно пустым списком глав — не повод объявлять источник сломанным:
  // так, у SENKURO в выдаче встречается тайтл с командой перевода, но без единой главы. Та же
  // логика распространяется и на исключения из getDetails/getPages: у NUDEMOON, например,
  // мобильная версия страницы тайтла для самых свежих загрузок временами ещё не проиндексирована
  // (сайт честно отдаёт по этому урлу собственную заглушку "не найдено"), а у MANGABUFF свежий
  // тайтл может успеть попасть в каталог раньше, чем сайт реально отдаёт страницы его первой
  // главы — оба случая проходят уже через десяток страниц. Падаем только если ни один элемент
  // страницы каталога не довёл чтение до конца. Причину последней неудачи всё равно запоминаем —
  // иначе итоговая ошибка ничего не говорит о том, что реально сломалось.
  let lastFailure: string | null = null;
  for (const candidate of list) {
    let details: RawTitle;
    try {
      details = await parser.getDetails(candidate.url);
    } catch (error) {
      lastFailure = `getDetails(${candidate.url}): ${describeError(error)}`;
      continue;
    }
    if (!details.chapters || details.chapters.length === 0) {
      continue;
    }

    let pages;
    try {
      pages = await parser.getPages(details.chapters[0]!.url);
    } catch (error) {
      lastFailure = `getPages(${details.chapters[0]!.url}): ${describeError(error)}`;
      continue;
    }
    if (pages.length === 0) {
      continue;
    }
    const relative = pages.find((page) => !/^https?:\/\//.test(page.url));
    if (relative) {
      throw new SourceContractError(`getPages вернул неабсолютный url: ${relative.url}`);
    }
    return;
  }
  throw new SourceContractError(
    lastFailure === null
      ? 'ни для одного тайтла на странице каталога не удалось прочитать страницы'
      : `ни для одного тайтла на странице каталога не удалось прочитать страницы; последняя причина — ${lastFailure}`,
  );
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
