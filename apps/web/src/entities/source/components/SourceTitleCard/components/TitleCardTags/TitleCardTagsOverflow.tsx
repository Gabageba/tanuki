import { Box, Tooltip } from '@mantine/core';
import { Link, type To } from 'react-router';
import type { Tag } from '@tanuki/contracts';
import TagBadge from '@/shared/ui/TagBadge';
import styles from './TitleCardTags.module.scss';

type Props = { tags: Tag[]; to: To };

function TitleCardTagsOverflow({ tags, to }: Props) {
  if (tags.length === 0) return null;
  return (
    <Tooltip label={tags.map(({ title }) => title).join(', ')} multiline maw={300}>
      <Box
        component={Link}
        to={to}
        tabIndex={-1}
        pos="relative"
        className={styles.overflow}
        flex="none"
        display="flex"
        td="none"
      >
        <TagBadge ff="monospace" flex="none">{`+${tags.length}`}</TagBadge>
      </Box>
    </Tooltip>
  );
}

export default TitleCardTagsOverflow;
