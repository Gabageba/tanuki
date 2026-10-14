import type { GroupProps } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TITLE_TYPE, type Title } from '@tanuki/contracts';
import { getLabelByTitleType } from '@/entities/source/lib';
import NumericMeta from '../NumericMeta';
import TitleMetaItems from '../TitleMetaItems';

type Props = {
  title: Title;
  gap?: GroupProps['gap'];
};

/** Мета-строка карточки каталога: «тип · год · главы», без глав — страницы. */
function TitleCardMeta({ title, gap }: Props) {
  const { t } = useTranslation();
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

  return <TitleMetaItems items={items} gap={gap ?? defaultGap} />;
}

export default TitleCardMeta;
