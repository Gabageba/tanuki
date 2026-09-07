import { Badge, Box, Group } from '@mantine/core';
import type { Tag } from '@tanuki/contracts';
import useVisibleTagsCount from '../hooks/useVisibleTagsCount';
import MangaCardTagsSkeleton from './MangaCardTagsSkeleton';

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
          <Badge
            key={tag.id}
            color="var(--mantine-color-default-border)"
            fw={400}
            styles={{
              label: {
                color: 'var(--mantine-color-text)',
                textTransform: 'none',
              },
            }}
          >
            {tag.title}
          </Badge>
        ))}
        <Badge
          color="var(--mantine-color-default-border)"
          fw={400}
          styles={{ label: { color: 'var(--mantine-color-text)' } }}
        >
          {`+${tags.length}`}
        </Badge>
      </Group>
      <Group ref={containerRef} gap={6} flex={1} wrap="nowrap" style={{ overflow: 'hidden' }}>
        {!isReady && <MangaCardTagsSkeleton />}
        {isReady &&
          visibleTags.map((tag) => (
            <Badge
              key={tag.id}
              color="var(--mantine-color-default-border)"
              fw={400}
              style={{ flexShrink: 0 }}
              styles={{ label: { color: 'var(--mantine-color-text)', textTransform: 'none' } }}
            >
              {tag.title}
            </Badge>
          ))}
        {isReady && hiddenCount > 0 && (
          <Badge
            color="var(--mantine-color-default-border)"
            fw={400}
            style={{ flexShrink: 0 }}
            styles={{ label: { color: 'var(--mantine-color-text)', textTransform: 'none' } }}
          >
            {`+${hiddenCount}`}
          </Badge>
        )}
      </Group>
    </>
  );
}

export default MangaCardTags;
