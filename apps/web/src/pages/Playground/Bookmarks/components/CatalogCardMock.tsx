import { Badge, Box, Card, Center, Stack, Text } from '@mantine/core';
import { BookmarkSimpleIcon, StarFourIcon } from '@phosphor-icons/react';
import { CONTENT_RATING, type SourceId } from '@tanuki/contracts';
import CoverImage from '@/shared/ui/CoverImage';
import NumericMeta from '@/entities/title/NumericMeta';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import TitleAdultBadge from '@/entities/title/markers/TitleAdultBadge';
import TitleSourceRibbon from '@/entities/title/markers/TitleSourceRibbon';
import { getMockCoverUrl } from '../lib';
import {
  MARKER_VARIANT,
  type MarkerVariant,
  type MockCatalogTitle,
  type ResolvedFolder,
} from '../models';
import FolderGlyph from './FolderGlyph';
import titleStyles from '@/entities/title/Title.module.scss';
import styles from '../Bookmarks.module.scss';

type Props = {
  title: MockCatalogTitle;
  folder: ResolvedFolder | null;
  variant: MarkerVariant;
  /** Карточка поиска: слева сверху лента источника. */
  sourceId?: SourceId;
};

/** Карточка каталога (`TitleGridCard`) с меткой «в закладках» — рядом с 18+, рейтингом и лентой. */
function CatalogCardMock({ title, folder, variant, sourceId }: Props) {
  return (
    <Card component="a" href="#" data-view-mode="grid" className={titleStyles.card}>
      <Stack gap={8}>
        <Box pos="relative" className={titleStyles.imageWrapper}>
          {sourceId && <TitleSourceRibbon sourceId={sourceId} />}
          <TitleAdultBadge
            contentRating={title.isAdult ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE}
          />
          {title.rating !== null && (
            <Badge
              pos="absolute"
              bottom={6}
              right={6}
              className={styles.overCover}
              color="color-mix(in srgb, var(--mantine-color-dark-filled) 85%, transparent)"
              size="lg"
              fw={400}
              leftSection={
                <StarFourIcon weight="fill" color="var(--mantine-color-terracotta-text)" />
              }
              px={8}
              radius="md"
              variant="filled"
            >
              <Text c="white" fw={600} ff="monospace">
                {title.rating}
              </Text>
            </Badge>
          )}
          {folder && variant === MARKER_VARIANT.BOOKMARK && (
            <Box
              pos="absolute"
              top={-4}
              left={sourceId ? undefined : 8}
              right={sourceId ? 52 : undefined}
              c="var(--mantine-primary-color-filled)"
              className={`${styles.overCover} ${styles.markerShadow}`}
              lh={0}
            >
              <BookmarkSimpleIcon size={30} weight="fill" />
            </Box>
          )}
          {folder && variant === MARKER_VARIANT.FOLDER_ICON && (
            <Center
              pos="absolute"
              bottom={6}
              left={6}
              w={30}
              h={30}
              bdrs="md"
              bg={`var(--mantine-color-${folder.color}-filled)`}
              className={styles.overCover}
              title={folder.name}
            >
              <FolderGlyph folder={folder} color="white" size={16} />
            </Center>
          )}
          {folder && variant === MARKER_VARIANT.FOLDER_PILL && (
            <Badge
              pos="absolute"
              bottom={6}
              left={6}
              maw={title.rating !== null ? 'calc(100% - 90px)' : 'calc(100% - 12px)'}
              size="lg"
              radius="md"
              variant="filled"
              color={folder.color}
              fw={500}
              tt="none"
              px={8}
              className={styles.overCover}
              leftSection={<FolderGlyph folder={folder} color="white" size={14} />}
            >
              {folder.name}
            </Badge>
          )}
          <CoverImage
            src={getMockCoverUrl(title.coverSeed)}
            alt={title.name}
            className={titleStyles.image}
          />
        </Box>
        <Stack gap={4}>
          <TitleMetaItems
            gap={4}
            items={[
              title.typeLabel,
              <NumericMeta key="year">{title.year}</NumericMeta>,
              <NumericMeta key="volume">{title.chaptersCount}&nbsp;гл.</NumericMeta>,
            ]}
          />
          <Text className={titleStyles.title} lineClamp={2} lh="tight">
            {title.name}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

export default CatalogCardMock;
