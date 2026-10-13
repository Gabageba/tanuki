import { Group, Text } from '@mantine/core';
import { type Title } from '@tanuki/contracts';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import TitleCardImage from '../TitleCardImage';
import TitleScoreMeta from '../TitleScoreMeta';
import TitleState from '../TitleState';
import TitleCardMeta from './TitleCardMeta';
import TitleCardName from './TitleCardName';
import TitleCardTags from './TitleCardTags';
import TitleGridCard from './TitleGridCard';
import TitleListCard from './TitleListCard';

type Props = {
  title: Title;
  viewMode?: ViewMode;
  showSource?: boolean;
  bookmarkFolder?: ResolvedBookmarkFolder | null;
};

/** Карточка тайтла каталога в выбранном виде: плиткой или строкой списка. */
function TitleCard({ title, viewMode = VIEW_MODE.GRID, showSource, bookmarkFolder }: Props) {
  switch (viewMode) {
    case VIEW_MODE.GRID:
      return (
        <TitleGridCard
          titleId={title.id}
          cover={
            <TitleCardImage
              title={title}
              showBadges
              showSource={showSource}
              bookmarkFolder={bookmarkFolder}
            />
          }
          meta={<TitleCardMeta title={title} />}
          name={<TitleCardName name={title.name} />}
        />
      );
    case VIEW_MODE.LIST:
      return (
        <TitleListCard
          titleId={title.id}
          contentRating={title.contentRating}
          cover={<TitleCardImage title={title} w={120} bookmarkFolder={bookmarkFolder} />}
          meta={
            <Group gap={8} miw={0}>
              <TitleCardMeta title={title} gap={6} />
              <TitleState state={title.releaseState} visibleFrom="xxs" />
            </Group>
          }
          name={<TitleCardName name={title.name} lineClamp={title.description ? 1 : 2} fz="sm" />}
          description={
            !!title.description && (
              <Text lh="tight" lineClamp={4} c="dimmed">
                {title.description}
              </Text>
            )
          }
          footer={
            <Group gap={8}>
              <TitleCardTags tags={title.tags} />
              <TitleScoreMeta title={title} />
            </Group>
          }
        />
      );
  }
}

export default TitleCard;
