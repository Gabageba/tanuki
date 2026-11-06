import { VIEW_MODE } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import type { TitleCardListSize } from '@/entities/title/card/TitleCard/models';
import { MARKER_VARIANT, type MarkerExample, type MarkerVariant } from '../models';
import { getCardData } from '../lib';
import MarkerCardMeta from './MarkerCardMeta';
import MarkerCardFooter from './MarkerCardFooter';
import MarkerListCardVariant from './MarkerListCardVariant';

type Props = {
  example: MarkerExample;
  variant?: MarkerVariant;
  listSize: TitleCardListSize;
  chosen?: boolean;
};

function MarkerExampleCard({
  example,
  variant = MARKER_VARIANT.CURRENT,
  listSize,
  chosen = false,
}: Props) {
  const content = {
    data: getCardData(example, listSize),
    meta: <MarkerCardMeta title={example.title} listSize={listSize} />,
    footer: (
      <MarkerCardFooter
        title={example.title}
        listSize={listSize}
        truncateDetails={!chosen && variant === MARKER_VARIANT.FOLDER_PILL}
      />
    ),
    listSize,
  };

  if (chosen) return <TitleCard {...content} viewMode={VIEW_MODE.LIST} />;

  return <MarkerListCardVariant {...content} variant={variant} />;
}

export default MarkerExampleCard;
