import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import useSetTitleBookmark from '@/features/bookmark/hooks/useSetTitleBookmark';
import useTitleBookmark from '@/features/bookmark/hooks/useTitleBookmark';
import BookmarkFolderModal from './BookmarkFolderModal';

type Props = {
  titleId: string;
};

/**
 * Копии тайтла лежат в разных папках: связь подтвердил кто-то другой, когда обе уже были в
 * закладках. Спрашиваем при открытии тайтла; «Отменить» откладывает вопрос до следующего раза.
 */
function TitleBookmarkConflict({ titleId }: Props) {
  const { t } = useTranslation();
  const { data: bookmark } = useTitleBookmark(titleId);
  const setBookmark = useSetTitleBookmark(titleId);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!bookmark?.conflict || isDismissed) return null;

  return (
    <BookmarkFolderModal
      opened
      onClose={() => setIsDismissed(true)}
      copies={bookmark.conflict}
      message={t('titleCopiesInDifferentFolders')}
      hint={t('nowOneBookmarkForAllSources')}
      submitLabel={t('save')}
      submitIcon={<CheckIcon />}
      isPending={setBookmark.isPending}
      onSubmit={(folderId) => setBookmark.mutate(folderId)}
    />
  );
}

export default TitleBookmarkConflict;
