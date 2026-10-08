import { Button, Radio, Select, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FolderSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { BUILT_IN_BOOKMARK_FOLDER } from '@tanuki/contracts';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import useDeleteBookmarkFolder from './hooks/useDeleteBookmarkFolder';
import { DELETE_FOLDER_ACTION, type DeleteFolderAction } from './models';

type Props = {
  folder: ResolvedBookmarkFolder;
  folders: ResolvedBookmarkFolder[];
  onClose: () => void;
};

type FormValues = {
  action: DeleteFolderAction;
  targetId: string | null;
};

/** Удаление своей папки — необратимо, тон `danger`. С тайтлами — спрашивает, куда их деть. */
function DeleteFolderModal({ folder, folders, onClose }: Props) {
  const { t } = useTranslation();
  const deleteFolder = useDeleteBookmarkFolder();
  const targets = folders.filter(({ id }) => id !== folder.id);
  const defaultTarget =
    targets.find(({ builtIn }) => builtIn === BUILT_IN_BOOKMARK_FOLDER.PLANNED) ?? targets[0];

  const form = useForm<FormValues>({
    initialValues: { action: DELETE_FOLDER_ACTION.MOVE, targetId: defaultTarget?.id ?? null },
  });
  const { action, targetId } = form.getValues();
  const target = targets.find(({ id }) => id === targetId);
  const isEmpty = folder.count === 0;

  const handleSubmit = (values: FormValues) =>
    deleteFolder.mutate(
      {
        folderId: folder.id,
        moveTo:
          !isEmpty && values.action === DELETE_FOLDER_ACTION.MOVE
            ? (values.targetId ?? undefined)
            : undefined,
      },
      { onSuccess: onClose },
    );

  return (
    <ToneModal
      opened
      onClose={onClose}
      tone={MODAL_TONE.DANGER}
      icon={TrashIcon}
      title={t('deleteFolder')}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {isEmpty ? (
            <Stack gap={4}>
              <Text fz="sm">{t('folderWillBeDeleted', { name: folder.name })}</Text>
              <Text c="dimmed" fz={13}>
                {t('folderIsEmptyCantRestore')}
              </Text>
            </Stack>
          ) : (
            <>
              <Stack gap={4}>
                <Text fz="sm">
                  {t('folderHasCountTitlesWhatToDo', { name: folder.name, count: folder.count })}
                </Text>
                <Text c="dimmed" fz={13}>
                  {t('folderCantBeRestoredProgressStays')}
                </Text>
              </Stack>
              <Radio.Group {...form.getInputProps('action')}>
                <Stack gap="sm">
                  <Radio value={DELETE_FOLDER_ACTION.MOVE} label={t('moveToAnotherFolder')} />
                  {action === DELETE_FOLDER_ACTION.MOVE && (
                    <Select
                      ml={30}
                      aria-label={t('folder')}
                      allowDeselect={false}
                      data={targets.map(({ id, name }) => ({ value: id, label: name }))}
                      leftSection={target ? <FolderGlyph folder={target} /> : <FolderSimpleIcon />}
                      {...form.getInputProps('targetId')}
                    />
                  )}
                  <Radio value={DELETE_FOLDER_ACTION.REMOVE} label={t('removeFromBookmarks')} />
                </Stack>
              </Radio.Group>
            </>
          )}
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              color="red"
              leftSection={<TrashIcon />}
              loading={deleteFolder.isPending}
            >
              {t('deleteFolder')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default DeleteFolderModal;
