import { Group } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import SourceTitleMeta from '@/entities/source/components/SourceTitleCard/components/SourceTitleMeta';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import {
  TITLE_CARD_LIST_SIZE,
  type TitleCardListSize,
} from '@/entities/title/card/TitleCard/models';

type Props = { title: Title; listSize: TitleCardListSize };

function MarkerCardMeta({ title, listSize }: Props) {
  switch (listSize) {
    case TITLE_CARD_LIST_SIZE.REGULAR:
      return <SourceTitleMeta title={title} />;
    case TITLE_CARD_LIST_SIZE.COMPACT:
      return (
        <Group gap={6} wrap="nowrap" miw={0}>
          <SourceIcon id={title.sourceId} title="ReadManga" size={14} />
          <TitleMetaItems gap={4} items={['ReadManga', 'Манга']} />
        </Group>
      );
  }
}

export default MarkerCardMeta;
