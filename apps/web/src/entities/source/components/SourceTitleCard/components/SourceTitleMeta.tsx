import { Group } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TITLE_TYPE, VIEW_MODE, type Title } from '@tanuki/contracts';
import { getLabelByTitleType } from '@/entities/source/lib';
import NumericMeta from '@/entities/title/NumericMeta';
import TitleState from '@/entities/title/TitleState';
import useTitleCardLayout from '@/entities/title/card/TitleCard/hooks/useTitleCardLayout';
import TitleMetaItems from '@/entities/title/TitleMetaItems';

type Props = {
  title: Title;
};

/** Мета-строка карточки каталога: «тип · год · главы», без глав — страницы. */
function SourceTitleMeta({ title }: Props) {
  const { t } = useTranslation();
  const { viewMode } = useTitleCardLayout();
  const isList = viewMode === VIEW_MODE.LIST;
  const items: ReactNode[] = [
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
  // Четырёхзначный счётчик глав маньхуа не влезает в узкую плитку с обычным зазором.
  const defaultGap = title.type === TITLE_TYPE.MANHUA && (title.chaptersCount || 0) >= 1000 ? 2 : 4;
  if (items.length === 0 && (!isList || title.releaseState === null)) return null;

  return (
    <Group gap={8} miw={0}>
      <TitleMetaItems items={items} gap={isList ? 6 : defaultGap} />
      {isList && <TitleState state={title.releaseState} visibleFrom="xxs" />}
    </Group>
  );
}

export default SourceTitleMeta;
