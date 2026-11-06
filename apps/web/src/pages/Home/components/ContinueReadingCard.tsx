import { EyeSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { ContinueReadingItem } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ContinueChapter from './ContinueChapter';

type Props = {
  item: ContinueReadingItem;
  onRemove: () => void;
};

/** Карточка C1a — та же, что в каталоге: обложка с лентой источника, «Гл. 12 · 2 дня назад»,
 *  название; «⋯» на высоте мета-строки. */
function ContinueReadingCard({ item, onRemove }: Props) {
  const { t } = useTranslation();
  const { formatRelative } = useDateFormat();

  return (
    <TitleCard
      data={item.title}
      showSource
      meta={
        <TitleMetaItems
          gap={4}
          items={[
            <ContinueChapter key="chapter" chapter={item.chapter} />,
            formatRelative(item.updatedAt),
          ]}
        />
      }
      actions={[
        {
          id: 'removeFromContinueReading',
          children: t('removeFromContinueReading'),
          leftSection: <EyeSlashIcon />,
          color: 'red',
          onClick: onRemove,
        },
      ]}
    />
  );
}

export default ContinueReadingCard;
