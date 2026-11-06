import { VIEW_MODE } from '@tanuki/contracts';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import useTitleCardLayout from '@/entities/title/card/TitleCard/hooks/useTitleCardLayout';

function SourceTitleMetaSkeleton() {
  const { viewMode } = useTitleCardLayout();
  const getWidth = () => {
    switch (viewMode) {
      case VIEW_MODE.GRID:
        return '70%';
      case VIEW_MODE.LIST:
        return '40%';
    }
  };

  return <TextSkeleton fz="xs" lh="tight" w={getWidth()} />;
}

export default SourceTitleMetaSkeleton;
