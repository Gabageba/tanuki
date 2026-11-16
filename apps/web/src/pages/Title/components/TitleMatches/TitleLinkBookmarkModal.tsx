import { LinkSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { BookmarkFolderCopy, TitleBookmark } from '@tanuki/contracts';
import useTitleBookmark from '@/features/bookmark/hooks/useTitleBookmark';
import BookmarkFolderModal from '../BookmarkFolderModal';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import { mergeQueries } from '@/shared/ui/QueryBlock/lib';

type Props = {
  titleId: string;
  targetId: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (folderId: string) => void;
};

const sourceIdOf = (titleId: string) => titleId.slice(0, titleId.indexOf(':'));

/** Копии стороны по папкам: её группа могла уже разойтись; не в закладках — копий нет. */
const toSideCopies = (bookmark: TitleBookmark, titleId: string): BookmarkFolderCopy[] => {
  if (bookmark.conflict) return bookmark.conflict;
  if (!bookmark.folderId) return [];
  return [{ folderId: bookmark.folderId, sourceIds: [sourceIdOf(titleId)] }];
};

/** Копии обеих сторон по папкам: одна папка — одна строка со всеми её источниками. */
const mergeCopies = (
  own: BookmarkFolderCopy[],
  target: BookmarkFolderCopy[],
): BookmarkFolderCopy[] =>
  target.reduce((copies, copy) => {
    const sameFolder = copies.find(({ folderId }) => folderId === copy.folderId);
    if (!sameFolder) return [...copies, copy];
    return copies.map((existing) =>
      existing === sameFolder
        ? { ...existing, sourceIds: [...new Set([...existing.sourceIds, ...copy.sourceIds])] }
        : existing,
    );
  }, own);

/**
 * Подтверждение связи, когда после неё группа оказалась бы в разных папках (409): обе стороны
 * в закладках или группа этого тайтла уже разошлась.
 */
function TitleLinkBookmarkModal({ titleId, targetId, isPending, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const ownQuery = useTitleBookmark(titleId);
  const targetQuery = useTitleBookmark(targetId);
  const { isSkeleton } = useSkeletonTiming(mergeQueries([ownQuery, targetQuery]));
  const own = ownQuery.data;
  const target = targetQuery.data;
  const copies =
    own && target ? mergeCopies(toSideCopies(own, titleId), toSideCopies(target, targetId)) : [];

  return (
    <BookmarkFolderModal
      opened
      onClose={onClose}
      copies={copies}
      loading={isSkeleton}
      message={
        target?.folderId
          ? t('bothTitlesInBookmarksWhichFolder')
          : t('titleCopiesInDifferentFolders')
      }
      hint={t('afterLinkOneBookmark')}
      submitLabel={t('link')}
      submitIcon={<LinkSimpleIcon />}
      isPending={isPending}
      onSubmit={onSubmit}
    />
  );
}

export default TitleLinkBookmarkModal;
