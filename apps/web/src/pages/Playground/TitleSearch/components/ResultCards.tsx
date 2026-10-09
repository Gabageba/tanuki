import { useContext } from 'react';
import { VIEW_MODE, type Title } from '@tanuki/contracts';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { CARD_LAYOUT, VIEW_MODE_CONTEXT, type CardLayout } from '../models';
import CardsGrid from './CardsGrid';
import CardsList from './CardsList';
import CardsListPreview from './CardsListPreview';
import CardsOneRow from './CardsOneRow';
import CardsRibbon from './CardsRibbon';
import CardsScroller from './CardsScroller';

type Props = {
  items: Title[];
  layout: CardLayout;
  /** V — в виде «список» видно столько, остальное — по «Показать ещё». */
  listPreview?: number | null;
};

/** Карточки секции по оси L — в сетке или списке, смотря по переключателю вида. */
function ResultCards({ items, layout, listPreview = null }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const { viewMode } = useContext(VIEW_MODE_CONTEXT);

  if (viewMode === VIEW_MODE.LIST && listPreview) {
    return <CardsListPreview items={items} visibleCount={listPreview} />;
  }

  if (viewMode === VIEW_MODE.LIST) {
    return <CardsList items={items} cols={layout === CARD_LAYOUT.DENSE && !isPhone ? 2 : 1} />;
  }

  switch (layout) {
    case CARD_LAYOUT.WRAP:
      return <CardsGrid items={items} cols={isPhone ? 2 : 5} />;
    case CARD_LAYOUT.RIBBON:
      return <CardsRibbon items={items} />;
    case CARD_LAYOUT.RIBBON_ON_PHONE:
      return isPhone ? <CardsRibbon items={items} /> : <CardsGrid items={items} cols={5} />;
    case CARD_LAYOUT.ONE_ROW:
      return <CardsOneRow items={items} cols={isPhone ? 2 : 5} />;
    case CARD_LAYOUT.SCROLLER:
      return <CardsScroller items={items} />;
    case CARD_LAYOUT.DENSE:
      return <CardsGrid items={items} cols={isPhone ? 3 : 6} />;
  }
}

export default ResultCards;
