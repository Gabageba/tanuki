import type { To } from 'react-router';
import { Box, Group } from '@mantine/core';
import TitleCardTagsOverflow from './TitleCardTagsOverflow';
import type { Tag } from '@tanuki/contracts';
import useVisibleTagsCount from './hooks/useVisibleTagsCount';
import TitleCardTagsSkeleton from './TitleCardTagsSkeleton';
import TagBadge from '@/shared/ui/TagBadge';

type Props = {
  tags: Tag[];
  to: To;
};

function TitleCardTags({ tags, to }: Props) {
  const { containerRef, measureRef, visibleCount } = useVisibleTagsCount(tags);

  if (tags.length === 0) return <Box flex={1} />;

  const isReady = visibleCount !== null;
  const visibleTags = isReady ? tags.slice(0, visibleCount) : [];

  return (
    <>
      <Group
        ref={measureRef}
        aria-hidden
        gap={6}
        wrap="nowrap"
        pos="absolute"
        h={0}
        w="max-content"
        style={{
          visibility: 'hidden',
          overflow: 'hidden',
        }}
      >
        {tags.map((tag) => (
          <TagBadge key={tag.id}>{tag.title}</TagBadge>
        ))}
        <TagBadge ff="monospace">{`+${tags.length}`}</TagBadge>
      </Group>
      <Group
        data-card-tags
        ref={containerRef}
        gap={6}
        flex={1}
        miw={0}
        wrap="nowrap"
        style={{ overflow: 'hidden' }}
      >
        {!isReady && <TitleCardTagsSkeleton />}
        {isReady &&
          visibleTags.map((tag) => (
            <TagBadge key={tag.id} style={{ flexShrink: 0 }}>
              {tag.title}
            </TagBadge>
          ))}
        {isReady && <TitleCardTagsOverflow tags={tags.slice(visibleCount)} to={to} />}
      </Group>
    </>
  );
}

export default TitleCardTags;
