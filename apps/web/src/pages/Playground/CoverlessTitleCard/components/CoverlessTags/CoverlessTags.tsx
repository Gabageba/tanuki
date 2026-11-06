import { Badge, Group, Tooltip } from '@mantine/core';
import type { Tag } from '@tanuki/contracts';
import useTagLines from './hooks/useTagLines';
import styles from '../../CoverlessTitleCard.module.scss';

type Props = { tags: Tag[]; lines: number };

// TagBadge фиксирует CSS-цвет, а muted в теме требует имя палитры. Здесь — локальный вид тегов,
// чтобы сравнение макетов не меняло существующие карточки приложения.
const TAG_PROPS = { variant: 'muted', color: 'gray', fw: 400, tt: 'none', fz: 'xs' } as const;

function CoverlessTags({ tags, lines }: Props) {
  const { containerRef, measureRef, visibleCount } = useTagLines(tags, lines);
  if (tags.length === 0) return null;
  const hiddenCount = tags.length - visibleCount;

  return (
    <>
      <Group
        ref={measureRef}
        aria-hidden
        className={styles.measurement}
        gap={6}
        wrap="nowrap"
        pos="absolute"
        h={0}
        w="max-content"
      >
        {tags.map((tag) => (
          <Badge key={tag.id} {...TAG_PROPS}>
            {tag.title}
          </Badge>
        ))}
        <Badge {...TAG_PROPS} ff="monospace">
          +{tags.length}
        </Badge>
      </Group>
      <Group
        ref={containerRef}
        data-coverless-tags
        data-max-lines={lines}
        gap={6}
        flex={1}
        miw={0}
        style={{ overflow: 'hidden' }}
      >
        {tags.slice(0, visibleCount).map((tag) => (
          <Badge key={tag.id} {...TAG_PROPS} maw="100%" flex="none">
            {tag.title}
          </Badge>
        ))}
        {hiddenCount > 0 && (
          <Tooltip
            label={tags
              .slice(visibleCount)
              .map(({ title }) => title)
              .join(', ')}
            multiline
            maw={300}
          >
            <Badge {...TAG_PROPS} ff="monospace" flex="none">
              +{hiddenCount}
            </Badge>
          </Tooltip>
        )}
      </Group>
    </>
  );
}

export default CoverlessTags;
