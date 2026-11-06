import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleCardSkeleton from '@/entities/title/card/TitleCard/TitleCardSkeleton';

function ContinueReadingCardSkeleton() {
  return <TitleCardSkeleton withActions meta={<TextSkeleton fz="xs" lh="tight" w="70%" />} />;
}

export default ContinueReadingCardSkeleton;
