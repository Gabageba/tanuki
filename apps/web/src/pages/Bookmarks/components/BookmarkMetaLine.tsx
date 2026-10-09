import { Box, Group, Indicator } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import BookmarkActionsMenu from './BookmarkActionsMenu';
import ProgressMeta from './ProgressMeta';

type Props = {
  bookmark: BookmarkItem;
};

/** Мета-строка карточки: иконка источника, куда ведёт карточка, счётчик «+N» (`Indicator`) на её углу, если в группе есть
 *  ещё, где остановился и справа — меню «⋯» (Q4). «+N» — подсказка, а не кнопка: источники в меню.
 *  Не влезает прогресс — «Гл. 197 из 203» целиком уходит строкой ниже, меню остаётся наверху. */
function BookmarkMetaLine({ bookmark }: Props) {
  const othersCount = bookmark.otherSources.length;

  return (
    <Group gap={6} wrap="nowrap" align="flex-start" miw={0} flex="1 1 auto">
      <Group gap={6} miw={0} flex="1 1 auto">
        <Indicator
          label={`+${othersCount}`}
          disabled={othersCount === 0}
          size={16}
          offset={-2}
          color="gray"
          withBorder
          // Счётчик в фиксированной точке — размер шрифта привязан к геометрии, а не к шкале.
          styles={{
            indicator: { fontSize: 9, fontFamily: 'var(--mantine-font-family-monospace)' },
          }}
        >
          <SourceIcon
            id={bookmark.sourceId}
            title={getCatalogSourceTitle(bookmark.sourceId)}
            size={20}
            radius="sm"
          />
        </Indicator>
        <Box miw={0}>
          <TitleMetaItems gap={4} items={[<ProgressMeta key="progress" bookmark={bookmark} />]} />
        </Box>
      </Group>
      <BookmarkActionsMenu bookmark={bookmark} />
    </Group>
  );
}

export default BookmarkMetaLine;
