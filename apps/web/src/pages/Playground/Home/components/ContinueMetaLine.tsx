import { Box, Group } from '@mantine/core';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import type { ContinueItem } from '../models';
import ContinueActionsMenu from './ContinueActionsMenu';
import ContinueChapter from './ContinueChapter';

type Props = {
  item: ContinueItem;
  /** C3 — глава уже на обложке, в строке только время. */
  withChapter?: boolean;
  onRemove: () => void;
};

/** «Гл. 12 · 2 дня назад» и «⋯» справа — строка под названием карточки. */
function ContinueMetaLine({ item, withChapter = true, onRemove }: Props) {
  return (
    <Group gap={4} wrap="nowrap" justify="space-between">
      <Box miw={0}>
        <TitleMetaItems
          gap={4}
          items={[withChapter && <ContinueChapter key="chapter" item={item} />, item.readAgo]}
        />
      </Box>
      <ContinueActionsMenu onRemove={onRemove} />
    </Group>
  );
}

export default ContinueMetaLine;
