import { Badge, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTENT_RATING, type Title } from '@tanuki/contracts';
import NavigateToTitleCard from '../../NavigateToTitleCard';
import TitleCardImage from '../../TitleCardImage';
import NumericMeta from '../../NumericMeta';
import TitleMetaItems from '../../TitleMetaItems';
import { getLabelByTitleType } from '@/entities/source/lib';
import TitleCardTags from '../TitleCardTags';
import TitleScoreMeta from '../../TitleScoreMeta';
import TitleState from '../../TitleState';
import styles from '../../Title.module.scss';

type Props = {
  title: Title;
};

function TitleListCard({ title }: Props) {
  const { t } = useTranslation();
  const metaItems: ReactNode[] = [
    getLabelByTitleType(title.type, t),
    !!title.year && <NumericMeta key="year">{title.year}</NumericMeta>,
    !!title.chaptersCount && (
      <NumericMeta key="volume">
        {t('countChaptersAbbrev', { count: title.chaptersCount })}
      </NumericMeta>
    ),
    !title.chaptersCount && !!title.pages && (
      <NumericMeta key="volume">{t('countPagesAbbrev', { count: title.pages })}</NumericMeta>
    ),
  ].filter(Boolean);

  return (
    <NavigateToTitleCard title={title} className={styles.card} data-view-mode="list" withBorder>
      <Group align="start" gap={0}>
        <TitleCardImage title={title} w={120} />
        <Stack p="sm" h="100%" flex={1} miw={0} gap={8}>
          <Stack gap={8} flex={1}>
            <Group gap={8}>
              {title.contentRating === CONTENT_RATING.ADULT && (
                <Badge color="red" ff="monospace">
                  18+
                </Badge>
              )}
              <TitleMetaItems gap={6} items={metaItems} />
              <TitleState state={title.releaseState} visibleFrom="xxs" />
            </Group>
            <Text
              className={styles.title}
              lineClamp={title.description ? 1 : 2}
              lh="tight"
              fz={{ base: 16, xs: 18 }}
            >
              {title.name}
            </Text>
            {!!title.description && (
              <Text lh="tight" lineClamp={4} c="dimmed">
                {title.description}
              </Text>
            )}
          </Stack>
          <Group gap={8}>
            <TitleCardTags tags={title.tags} />
            <TitleScoreMeta title={title} />
          </Group>
        </Stack>
      </Group>
    </NavigateToTitleCard>
  );
}

export default TitleListCard;
