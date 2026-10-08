import { Box, Center } from '@mantine/core';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import {
  MARKER_VARIANT,
  SCORE_PLATE_COLOR,
  type MarkerVariant,
  type ResolvedFolder,
} from '../models';
import FolderGlyph from './FolderGlyph';
import styles from '../Bookmarks.module.scss';

type Props = {
  folder: ResolvedFolder;
  variant: MarkerVariant;
  /** Карточка поиска: слева сверху лента источника — K8 уходит вправо, как K1. */
  hasSource: boolean;
};

const MARKER_SIZE = 26;

/** Метки K2a, K4, K6–K8 поверх обложки; K1–K3 рисует сама карточка, K5 — бейдж рейтинга. */
function CoverFolderMarker({ folder, variant, hasSource }: Props) {
  switch (variant) {
    case MARKER_VARIANT.FOLDER_ICON_RING:
    case MARKER_VARIANT.SHADE:
      return (
        <Center
          pos="absolute"
          bottom={6}
          left={6}
          w={MARKER_SIZE}
          h={MARKER_SIZE}
          bdrs="md"
          bg={`var(--mantine-color-${folder.color}-filled)`}
          bd="1.5px solid color-mix(in srgb, var(--mantine-color-white) 35%, transparent)"
          className={styles.overCover}
          style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
          title={folder.name}
        >
          <FolderGlyph folder={folder} color="white" size={14} />
        </Center>
      );
    case MARKER_VARIANT.DARK_PLATE:
    case MARKER_VARIANT.DARK_PLATE_FILL:
      return (
        <Center
          pos="absolute"
          bottom={6}
          left={6}
          w={MARKER_SIZE}
          h={MARKER_SIZE}
          bdrs="md"
          bg={SCORE_PLATE_COLOR}
          className={styles.overCover}
          title={folder.name}
        >
          <FolderGlyph
            folder={folder}
            color={`var(--mantine-color-${folder.color}-4)`}
            size={15}
            weight={variant === MARKER_VARIANT.DARK_PLATE_FILL ? 'fill' : 'regular'}
          />
        </Center>
      );
    case MARKER_VARIANT.GLASS:
      return (
        <Center
          pos="absolute"
          bottom={6}
          left={6}
          w={MARKER_SIZE}
          h={MARKER_SIZE}
          bdrs="md"
          bg="color-mix(in srgb, var(--mantine-color-dark-filled) 35%, transparent)"
          bd="1px solid color-mix(in srgb, var(--mantine-color-white) 20%, transparent)"
          className={styles.glassPlate}
          title={folder.name}
        >
          <FolderGlyph folder={folder} color={`var(--mantine-color-${folder.color}-3)`} size={15} />
        </Center>
      );
    case MARKER_VARIANT.RIBBON:
      return (
        <Box
          pos="absolute"
          top={-4}
          left={hasSource ? undefined : 8}
          right={hasSource ? 52 : undefined}
          c={`var(--mantine-color-${folder.color}-filled)`}
          className={`${styles.overCover} ${styles.markerShadow}`}
          lh={0}
          title={folder.name}
        >
          <BookmarkSimpleIcon size={34} weight="fill" />
          <Box pos="absolute" top={9} left={0} right={0}>
            <Center>
              <FolderGlyph folder={folder} color="white" size={12} weight="bold" />
            </Center>
          </Box>
        </Box>
      );
    case MARKER_VARIANT.BOOKMARK:
    case MARKER_VARIANT.FOLDER_ICON:
    case MARKER_VARIANT.FOLDER_PILL:
    case MARKER_VARIANT.IN_SCORE:
      return null;
  }
}

export default CoverFolderMarker;
