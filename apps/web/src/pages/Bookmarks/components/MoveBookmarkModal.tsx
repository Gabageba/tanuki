import { Button, Radio, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FolderSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { BookmarkItem } from '@tanuki/contracts';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import FolderRadioCard from '@/features/bookmark/FolderRadioCard';
import useSetTitleBookmark from '@/features/bookmark/hooks/useSetTitleBookmark';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  bookmark: BookmarkItem;
  opened: boolean;
  onClose: () => void;
};

type FormValues = {
  folderId: string;
};

/**
 * «Перенести в папку» из меню «⋯» карточки (тон `neutral`): папки крупными tile, как в M1d, —
 * подменю на телефоне упиралось в край экрана. Переносит всю группу, текущая папка выбрана сразу.
 */
function MoveBookmarkModal({ bookmark, opened, onClose }: Props) {
  const { t } = useTranslation();
  const { data: folders } = useBookmarkFolders();
  const setBookmark = useSetTitleBookmark(bookmark.titleId);
  const form = useForm<FormValues>({ initialValues: { folderId: bookmark.folderId } });

  // Без сброса повторное открытие показало бы прошлый, не применённый выбор.
  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = ({ folderId }: FormValues) => {
    if (folderId !== bookmark.folderId) setBookmark.mutate(folderId);
    handleClose();
  };

  return (
    <ToneModal
      opened={opened}
      onClose={handleClose}
      tone={MODAL_TONE.NEUTRAL}
      icon={FolderSimpleIcon}
      title={t('moveToFolder')}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Stack gap={4}>
            <Text fz="sm">{t('willMoveToSelectedFolder', { name: bookmark.name })}</Text>
            {bookmark.otherSources.length > 0 && (
              <Text c="dimmed" fz={13}>
                {t('togetherWithCopiesOnOtherSources')}
              </Text>
            )}
          </Stack>
          <Radio.Group {...form.getInputProps('folderId')}>
            <Stack gap="xs">
              {folders?.items.map((folder) => (
                <FolderRadioCard
                  key={folder.id}
                  folder={folder}
                  isChecked={form.getValues().folderId === folder.id}
                />
              ))}
            </Stack>
          </Radio.Group>
          <ModalButtonsLayout>
            <Button variant="default" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" leftSection={<FolderSimpleIcon />}>
              {t('move')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default MoveBookmarkModal;
