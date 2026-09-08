import { Box, Group } from '@mantine/core';
import type { Tag } from '@tanuki/contracts';
import useVisibleTagsCount from '../hooks/useVisibleTagsCount';
import MangaCardTagsSkeleton from './MangaCardTagsSkeleton';
import TagBadge from '@/shared/ui/TagBadge';

type Props = {
  tags: Tag[];
};

function MangaCardTags({ tags }: Props) {
  const { containerRef, measureRef, visibleCount } = useVisibleTagsCount(tags);

  if (tags.length === 0) return <Box flex={1} />;

  const isReady = visibleCount !== null;
  const visibleTags = isReady ? tags.slice(0, visibleCount) : [];
  const hiddenCount = tags.length - visibleTags.length;

  return (
    <>
      <Group
        ref={measureRef}
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
        <TagBadge>{`+${tags.length}`}</TagBadge>
      </Group>
      <Group ref={containerRef} gap={6} flex={1} wrap="nowrap" style={{ overflow: 'hidden' }}>
        {!isReady && <MangaCardTagsSkeleton />}
        {isReady &&
          visibleTags.map((tag) => (
            <TagBadge key={tag.id} style={{ flexShrink: 0 }}>
              {tag.title}
            </TagBadge>
          ))}
        {isReady && hiddenCount > 0 && (
          <TagBadge style={{ flexShrink: 0 }}>{`+${hiddenCount}`}</TagBadge>
        )}
      </Group>
    </>
  );
}

export default MangaCardTags;
