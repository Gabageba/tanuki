import { VIEW_MODE } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';
import type { ChapterExample, UpdateVariant } from '../models';
import NewChapterFooter from './NewChapterFooter';
import NewChapterSourceMeta from './NewChapterSourceMeta';

type Props = { example: ChapterExample; variant: UpdateVariant };

/** Общая карточка приложения с вариантом нижней строки обновлений. */
function NewChapterCounterCard({ example, variant }: Props) {
  const { bookmark, folder } = example;

  return (
    <TitleCard
      data={{ ...bookmark, id: bookmark.titleId, bookmarkFolder: folder }}
      viewMode={VIEW_MODE.LIST}
      listSize={TITLE_CARD_LIST_SIZE.COMPACT}
      meta={<NewChapterSourceMeta {...example} />}
      footer={<NewChapterFooter bookmark={bookmark} variant={variant} />}
    />
  );
}

export default NewChapterCounterCard;
