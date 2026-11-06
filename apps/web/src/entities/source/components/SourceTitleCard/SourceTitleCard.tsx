import type { Title, ViewMode } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import SourceTitleMeta from './components/SourceTitleMeta';
import SourceTitleFooter from './components/SourceTitleFooter';

type Props = {
  title: Title;
  viewMode?: ViewMode;
  showSource?: boolean;
  bookmarkFolder?: ResolvedBookmarkFolder | null;
};

/** Композиция данных источника для каталога, поиска, подборок и совпадений. */
function SourceTitleCard({ title, viewMode, showSource, bookmarkFolder }: Props) {
  return (
    <TitleCard
      data={{
        ...title,
        bookmarkFolder,
      }}
      viewMode={viewMode}
      showSource={showSource}
      meta={<SourceTitleMeta title={title} />}
      footer={<SourceTitleFooter title={title} />}
    />
  );
}

export default SourceTitleCard;
