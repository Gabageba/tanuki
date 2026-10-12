import type { Title } from '@tanuki/contracts';
import {
  SHORT_BLOCK_MAX,
  SHORT_BLOCKS,
  type HomeBlock,
  type HomeKind,
  type HomeSource,
  type ShortBlocks,
} from './models';

/** Соседние короткие блоки — в один ряд (K2); остальные — каждый своей строкой. */
export const groupBlockRows = (blocks: HomeBlock[], shortBlocks: ShortBlocks, isPhone: boolean) => {
  if (shortBlocks === SHORT_BLOCKS.RIBBON || isPhone) {
    return blocks.map((block) => [block]);
  }
  return blocks.reduce<HomeBlock[][]>((rows, block) => {
    const last = rows.at(-1);
    const isShort = block.items.length <= SHORT_BLOCK_MAX;
    const isLastShort = last?.every((item) => item.items.length <= SHORT_BLOCK_MAX);
    if (last && isShort && isLastShort) {
      last.push(block);
      return rows;
    }
    return [...rows, [block]];
  }, []);
};

/** Ключ блока в выборе пользователя — `sourceId:blockId`, как в `home_disabled_sections`. */
export const getBlockKey = (sourceId: string, blockId: string) => `${sourceId}:${blockId}`;

/** P5 — тайтлы вида `kind` со всех источников вперемешку: по одному от каждого источника по кругу,
 *  чтобы ни один сайт не занял начало ленты. */
export const getKindItems = (
  homes: HomeSource[],
  kind: HomeKind,
  kindById: Record<string, HomeKind>,
): Title[] => {
  const queues = homes.map(({ blocks }) =>
    blocks.filter((block) => kindById[block.id] === kind).flatMap((block) => block.items),
  );
  const longest = Math.max(0, ...queues.map((queue) => queue.length));
  return Array.from({ length: longest }, (_, index) =>
    queues.flatMap((queue) => (index < queue.length ? [queue[index]] : [])),
  )
    .flat()
    .filter((title): title is Title => title !== undefined);
};

const RU_PLURAL = new Intl.PluralRules('ru');

/** «6 подборок» — в песочнице без i18n, склонение через `Intl.PluralRules`. */
export const formatSelectionsCount = (count: number) => {
  switch (RU_PLURAL.select(count)) {
    case 'one':
      return `${count} подборка`;
    case 'few':
      return `${count} подборки`;
    default:
      return `${count} подборок`;
  }
};

/** Название источника в родительном падеже — для «Каталог Реманги». В макете склоняется только
 *  кириллическое «Реманга»; латинские названия не склоняются. В приложении понадобится форма в
 *  каталоге источников или формулировка без склонения. */
export const getSourceTitleGenitive = (title: string) => (title === 'Реманга' ? 'Реманги' : title);
