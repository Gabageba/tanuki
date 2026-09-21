import { Stack, Text } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TITLE_TYPE, type Title } from '@tanuki/contracts';
import NavigateToTitleCard from '../../NavigateToTitleCard';
import TitleMetaItems from '../../TitleMetaItems';
import { getLabelByTitleType } from '@/entities/source/lib';
import TitleCardImage from '../../TitleCardImage';
import NumericMeta from '../../NumericMeta';
import styles from '../../Title.module.scss';

type Props = {
  title: Title;
  showSource?: boolean;
};

function TitleGridCard({ title, showSource = false }: Props) {
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

  const metaGap = useMemo(
    () => (title.type === TITLE_TYPE.MANHUA && (title.chaptersCount || 0) >= 1000 ? 2 : 4),
    [title.type, title.chaptersCount],
  );

  return (
    <NavigateToTitleCard title={title} data-view-mode="grid" className={styles.card}>
      <Stack gap={8}>
        <TitleCardImage title={title} showBadges showSource={showSource} />
        <Stack gap={4}>
          <TitleMetaItems items={metaItems} gap={metaGap} />
          <Text className={styles.title} lineClamp={2} lh={1}>
            {title.name}
          </Text>
        </Stack>
      </Stack>
    </NavigateToTitleCard>
  );
}

export default TitleGridCard;
