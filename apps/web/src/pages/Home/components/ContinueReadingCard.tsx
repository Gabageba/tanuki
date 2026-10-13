import type { ContinueReadingItem } from '@tanuki/contracts';
import TitleGridCard from '@/entities/title/card/TitleGridCard';
import TitleCardName from '@/entities/title/card/TitleCardName';
import TitleCardImage from '@/entities/title/TitleCardImage';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ContinueChapter from './ContinueChapter';
import ContinueReadingActionsMenu from './ContinueReadingActionsMenu';

type Props = {
  item: ContinueReadingItem;
  onRemove: () => void;
};

/** Карточка C1a — та же, что в каталоге: обложка с лентой источника, «Гл. 12 · 2 дня назад»,
 *  название; «⋯» на высоте мета-строки. */
function ContinueReadingCard({ item, onRemove }: Props) {
  const { formatRelative } = useDateFormat();

  return (
    <TitleGridCard
      titleId={item.title.id}
      cover={<TitleCardImage title={item.title} showBadges showSource />}
      meta={
        <TitleMetaItems
          gap={4}
          items={[
            <ContinueChapter key="chapter" chapter={item.chapter} />,
            formatRelative(item.updatedAt),
          ]}
        />
      }
      name={<TitleCardName name={item.title.name} />}
      actions={<ContinueReadingActionsMenu onRemove={onRemove} />}
    />
  );
}

export default ContinueReadingCard;
