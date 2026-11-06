import { Box, Center } from '@mantine/core';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import { getBookmarkFolderFillColor } from '@/entities/bookmark/lib';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import styles from '../TitleBookmarkMarkers.module.scss';

type Props = { folder?: ResolvedBookmarkFolder | null };

function MarkerCoverFlag({ folder }: Props) {
  if (!folder) return null;

  return (
    <Box
      pos="absolute"
      top={-3}
      right={4}
      w={32}
      h={32}
      c={getBookmarkFolderFillColor(folder.color)}
      className={styles.flag}
      role="img"
      aria-label={folder.name}
    >
      <BookmarkSimpleIcon size={32} weight="fill" />
      <Center pos="absolute" top={5} left={0} w={32} h={16}>
        <FolderGlyph folder={folder} size={14} color="white" weight="fill" />
      </Center>
    </Box>
  );
}

export default MarkerCoverFlag;
