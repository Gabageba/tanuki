import { Button, Loader, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BookmarksSimpleIcon, FolderSimpleIcon, XIcon } from '@phosphor-icons/react';
import type { SourceImportResult } from '@tanuki/contracts';
import NewCount from '@/features/library-merge/NewCount';
import GroupedList from '@/shared/ui/GroupedList';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

type Props = {
  sourceTitle: string;
  result: SourceImportResult;
  onClose: () => void;
  onOpenBookmarks: () => void;
};

/**
 * Шаг «Готово»: что записано. Отметки «где остановился» ещё переносятся в фоне — строка с
 * маленьким `Loader`: это индикатор процесса на экране итога, о конце скажет уведомление.
 */
function ImportDoneStep({ sourceTitle, result, onClose, onOpenBookmarks }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <Stack gap="md">
      <Text lh="tight" fz="sm">
        {t('bookmarksFromSourceInLibrary', { source: sourceTitle })}
      </Text>
      <GroupedList label={t('whatChanged')}>
        <GroupedList.Row
          icon={<BookmarksSimpleIcon />}
          title={t('bookmarks')}
          isActionCompact
          action={<NewCount value={result.bookmarksAdded} />}
          description={
            <MidDotGroup
              items={[
                result.bookmarksAsSource > 0 &&
                  t('countAsAnotherSource', { count: result.bookmarksAsSource }),
                result.bookmarksMoved > 0 &&
                  t('countMovedToFoldersAsOnSite', { count: result.bookmarksMoved }),
              ]}
            />
          }
        />
        <GroupedList.Row
          icon={<FolderSimpleIcon />}
          title={t('folders')}
          isActionCompact
          action={<NewCount value={result.foldersCreated} />}
          description={
            <MidDotGroup
              items={[
                result.foldersMatched > 0 &&
                  t('countMatchedByName', { count: result.foldersMatched }),
                result.foldersOverLimit > 0 &&
                  t('countDidntFitLimitTitlesInPlanned', { count: result.foldersOverLimit }),
              ]}
            />
          }
        />
        {result.pendingProgress > 0 && (
          <GroupedList.Row
            icon={<Loader size={20} />}
            title={t('whereLeftOffTransferring')}
            isActionCompact
            action={
              <Text ff="monospace" fz="sm" c="dimmed">
                {result.pendingProgress.toLocaleString(i18n.language)}
              </Text>
            }
            description={t('canCloseWindowWillNotifyWhenDone')}
          />
        )}
      </GroupedList>
      <ModalButtonsLayout>
        <Button variant="default" leftSection={<XIcon />} onClick={onClose}>
          {t('close')}
        </Button>
        <Button leftSection={<BookmarksSimpleIcon />} onClick={onOpenBookmarks}>
          {t('openBookmarks')}
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default ImportDoneStep;
