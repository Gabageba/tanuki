import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TITLE_LINK_VERDICT, type TitleLinkVerdict, type TitleMatch } from '@tanuki/contracts';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import { getTitleBookmarkQueryKey } from '@/entities/bookmark/models';
import { getReadingProgressQueryKey } from '@/entities/title/hooks/useReadingProgress';
import useSetTitleLink from '../../../hooks/useSetTitleLink';

type Params = {
  titleId: string;
  matches: TitleMatch[] | undefined;
};

/** Выбор остаётся по id при перегруппировке. Очередь ждёт решения конфликта папок,
 * останавливается на первой ошибке и снимает выделение только с сохранённых связей. */
function useTitleMatchReview({ titleId, matches }: Params) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending: isLinkPending } = useSetTitleLink({ titleId });
  const [isChecking, setIsChecking] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingVerdict, setPendingVerdict] = useState<TitleLinkVerdict | null>(null);
  const [conflictTargetId, setConflictTargetId] = useState<string | null>(null);
  const isSaving = useRef(false);
  const mounted = useRef(true);
  const folderChoice = useRef<((folderId: string | null) => void) | null>(null);
  const selectedTargetIds = selectedIds.filter((id) =>
    matches?.some(({ title }) => title.id === id),
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      folderChoice.current?.(null);
      folderChoice.current = null;
    };
  }, []);

  const toggleChecking = () => {
    if (isSaving.current) return;
    setIsChecking((current) => !current);
    setSelectedIds([]);
  };

  const toggleSelection = (targetId: string) => {
    if (isSaving.current) return;
    setSelectedIds((current) =>
      current.includes(targetId) ? current.filter((id) => id !== targetId) : [...current, targetId],
    );
  };

  const clearSelection = () => {
    if (!isSaving.current) setSelectedIds([]);
  };

  const chooseFolder = (folderId: string | null) => {
    folderChoice.current?.(folderId);
    folderChoice.current = null;
  };

  const cancelConflict = () => chooseFolder(null);

  const save = async (targetIds: string[], verdict: TitleLinkVerdict) => {
    if (isSaving.current || targetIds.length === 0) return false;
    isSaving.current = true;
    setPendingVerdict(verdict);
    let hasSaved = false;

    try {
      for (const targetId of targetIds) {
        let bookmarkFolderId: string | undefined;
        while (mounted.current) {
          const { isLinked } = await mutateAsync({ targetId, verdict, bookmarkFolderId });
          if (isLinked) {
            hasSaved = true;
            if (mounted.current) {
              setConflictTargetId(null);
              setSelectedIds((current) => current.filter((id) => id !== targetId));
            }
            break;
          }
          if (!mounted.current) return false;
          // Предыдущие связи очереди могли уже переместить закладку. Модалка должна
          // запросить текущее положение обеих сторон, даже если они есть в свежем кеше.
          await Promise.all(
            [titleId, targetId].map((id) =>
              queryClient.invalidateQueries({
                queryKey: getTitleBookmarkQueryKey(id),
                refetchType: 'none',
              }),
            ),
          );
          if (!mounted.current) return false;
          setConflictTargetId(targetId);
          const folderId = await new Promise<string | null>((resolve) => {
            folderChoice.current = resolve;
          });
          if (folderId === null) return false;
          bookmarkFolderId = folderId;
        }
        if (!mounted.current) return false;
      }
      return true;
    } catch {
      // Ошибку показывает глобальный обработчик мутаций; оставшиеся связи можно повторить.
      return false;
    } finally {
      if (mounted.current) setConflictTargetId(null);
      if (hasSaved) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['title', titleId, 'matches'] }),
          queryClient.invalidateQueries({ queryKey: getReadingProgressQueryKey(titleId) }),
          invalidateBookmarks(queryClient),
        ]);
      }
      isSaving.current = false;
      if (mounted.current) setPendingVerdict(null);
    }
  };

  const saveSelection = (verdict: TitleLinkVerdict) => save(selectedTargetIds, verdict);
  const addLink = (targetId: string) => save([targetId], TITLE_LINK_VERDICT.CONFIRMED);

  return {
    isChecking,
    selectedTargetIds,
    pendingVerdict,
    isPending: pendingVerdict !== null,
    isLinkPending,
    conflictTargetId,
    toggleChecking,
    toggleSelection,
    clearSelection,
    chooseFolder,
    cancelConflict,
    saveSelection,
    addLink,
  };
}

export default useTitleMatchReview;
