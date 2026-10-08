import type { ReactNode } from 'react';
import { Box, Group, Text } from '@mantine/core';
import NumericMeta from '@/entities/title/NumericMeta';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import { formatNewCount, getAvailabilityLabel, getNewChaptersPhrase } from '../lib';
import {
  AVAILABILITY,
  CARD_VARIANT,
  UNAVAILABLE_VARIANT,
  type CardVariant,
  SOURCES_VARIANT,
  type MockBookmark,
  type SourcesVariant,
  type UnavailableVariant,
} from '../models';
import NewCountBadge from './NewCountBadge';
import NewDot from './NewDot';
import ProgressMeta from './ProgressMeta';
import CardActionsMenu from './CardActionsMenu';
import SourcesLead from './SourcesLead';
import SourcesMoreLink from './SourcesMoreLink';

type Props = {
  bookmark: MockBookmark;
  variant: CardVariant;
  unavailableVariant: UnavailableVariant;
  /** Ось Q; undefined — как на осях до неё. */
  sourcesVariant?: SourcesVariant;
};

/** Варианты, где новое сказано фразой в мета-строке. */
const PHRASE_VARIANTS: CardVariant[] = [
  CARD_VARIANT.PHRASE,
  CARD_VARIANT.NEW_TAG,
  CARD_VARIANT.GROUPED,
  CARD_VARIANT.FRAME,
];
/** Из них фраза тихая: главный сигнал — метка или рамка на обложке. */
const QUIET_PHRASE_VARIANTS: CardVariant[] = [CARD_VARIANT.NEW_TAG, CARD_VARIANT.FRAME];

/** Мета-строка карточки: иконка источника (с «+N» и меню) и через точку — где остановился. */
function BookmarkMetaLine({ bookmark, variant, unavailableVariant, sourcesVariant }: Props) {
  const isUnavailable = bookmark.availability !== AVAILABILITY.AVAILABLE;
  const hasCardMenu =
    sourcesVariant === SOURCES_VARIANT.CARD_MENU ||
    sourcesVariant === SOURCES_VARIANT.CARD_MENU_FOLDERS;

  if (variant === CARD_VARIANT.CATALOG) {
    return (
      <TitleMetaItems
        gap={4}
        items={[
          bookmark.typeLabel,
          !!bookmark.chaptersCount && (
            <NumericMeta key="volume">{bookmark.chaptersCount}&nbsp;гл.</NumericMeta>
          ),
        ]}
      />
    );
  }

  const getItems = (): ReactNode[] => {
    if (isUnavailable && unavailableVariant === UNAVAILABLE_VARIANT.DIMMED) {
      return [getAvailabilityLabel(bookmark.availability)];
    }
    if (variant === CARD_VARIANT.COVER_PROGRESS) {
      return [bookmark.typeLabel];
    }
    return [
      variant === CARD_VARIANT.META_DOT && !isUnavailable && bookmark.newChaptersCount > 0 ? (
        <Group key="progress" component="span" gap={6} wrap="nowrap">
          <NewDot />
          <ProgressMeta bookmark={bookmark} />
        </Group>
      ) : (
        <ProgressMeta key="progress" bookmark={bookmark} />
      ),
      variant === CARD_VARIANT.META && !isUnavailable && bookmark.newChaptersCount > 0 && (
        <Text
          key="new"
          component="span"
          inherit
          ff="monospace"
          fw={600}
          c="var(--mantine-primary-color-filled)"
        >
          {formatNewCount(bookmark.newChaptersCount)}
        </Text>
      ),
      PHRASE_VARIANTS.includes(variant) && !isUnavailable && bookmark.newChaptersCount > 0 && (
        <Text
          key="new"
          component="span"
          inherit
          c={QUIET_PHRASE_VARIANTS.includes(variant) ? undefined : 'var(--mantine-color-anchor)'}
        >
          {getNewChaptersPhrase(bookmark.newChaptersCount)}
        </Text>
      ),
      variant === CARD_VARIANT.UPDATED_AGO && !isUnavailable && bookmark.newChaptersCount > 0 && (
        <Text key="new" component="span" inherit c="var(--mantine-color-anchor)">
          Обновлено {bookmark.updatedAgo}
        </Text>
      ),
      variant === CARD_VARIANT.META_BADGE && !isUnavailable && bookmark.newChaptersCount > 0 && (
        <NewCountBadge key="new" count={bookmark.newChaptersCount} />
      ),
      sourcesVariant === SOURCES_VARIANT.WORDS && (
        <SourcesMoreLink key="sources" sourceIds={bookmark.sourceIds} />
      ),
    ];
  };

  return (
    <Group gap={6} wrap="nowrap" miw={0} flex={hasCardMenu ? 1 : undefined}>
      <SourcesLead sourceIds={bookmark.sourceIds} sourcesVariant={sourcesVariant} />
      <Box miw={0}>
        <TitleMetaItems gap={4} items={getItems()} />
      </Box>
      {hasCardMenu && (
        <CardActionsMenu
          sourceIds={bookmark.sourceIds}
          folderId={bookmark.folderId}
          withFolders={sourcesVariant === SOURCES_VARIANT.CARD_MENU_FOLDERS}
        />
      )}
    </Group>
  );
}

export default BookmarkMetaLine;
