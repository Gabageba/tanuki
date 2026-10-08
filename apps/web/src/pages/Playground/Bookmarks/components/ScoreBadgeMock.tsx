import { Badge, Divider, Group, Text } from '@mantine/core';
import { StarFourIcon } from '@phosphor-icons/react';
import { SCORE_PLATE_COLOR, type ResolvedFolder } from '../models';
import FolderGlyph from './FolderGlyph';
import styles from '../Bookmarks.module.scss';

type Props = {
  rating: number | null;
  /** K5 — папка внутри бейджа, слева от рейтинга; без рейтинга бейдж держит одну иконку. */
  folder?: ResolvedFolder | null;
};

/** Бейдж рейтинга на обложке (`TitleScoreBadge`), в K5 — вместе с иконкой папки. */
function ScoreBadgeMock({ rating, folder }: Props) {
  if (rating === null && !folder) {
    return null;
  }

  return (
    <Badge
      pos="absolute"
      bottom={6}
      right={6}
      className={styles.overCover}
      color={SCORE_PLATE_COLOR}
      size="lg"
      fw={400}
      px={8}
      radius="md"
      variant="filled"
      title={folder?.name}
    >
      <Group gap={6} wrap="nowrap">
        {folder && (
          <FolderGlyph folder={folder} color={`var(--mantine-color-${folder.color}-4)`} size={15} />
        )}
        {folder && rating !== null && (
          <Divider orientation="vertical" color="var(--mantine-color-dark-3)" my={2} />
        )}
        {rating !== null && (
          <Group gap={4} wrap="nowrap">
            <StarFourIcon weight="fill" color="var(--mantine-color-terracotta-text)" />
            <Text c="white" fw={600} ff="monospace" fz={14}>
              {rating}
            </Text>
          </Group>
        )}
      </Group>
    </Badge>
  );
}

export default ScoreBadgeMock;
