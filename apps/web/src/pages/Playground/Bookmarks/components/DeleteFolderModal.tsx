import { Button, Radio, Select, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { TrashIcon } from '@phosphor-icons/react';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getTitlesCountLabel, resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import {
  BUILT_IN_STYLE,
  DELETE_FOLDER_ACTION,
  type DeleteFolderAction,
  type MockFolder,
} from '../models';
import FolderGlyph from './FolderGlyph';

type Props = {
  opened: boolean;
  onClose: () => void;
  folder: MockFolder;
};

type FormValues = {
  action: DeleteFolderAction;
  targetId: string;
};

/** Удаление своей папки — необратимо, тон `danger`. С тайтлами — спрашивает, куда их деть. */
function DeleteFolderModal({ opened, onClose, folder }: Props) {
  const form = useForm<FormValues>({
    initialValues: { action: DELETE_FOLDER_ACTION.MOVE, targetId: 'planned' },
  });
  const targets = MOCK_FOLDERS.filter(({ id }) => id !== folder.id).map((item) =>
    resolveFolder(item, BUILT_IN_STYLE.SEMANTIC),
  );
  const target = targets.find(({ id }) => id === form.getValues().targetId);
  const isEmpty = folder.count === 0;

  return (
    <ToneModal
      opened={opened}
      onClose={onClose}
      tone={MODAL_TONE.DANGER}
      icon={TrashIcon}
      title="Удалить папку"
    >
      <form onSubmit={form.onSubmit(onClose)}>
        <Stack gap="md">
          {isEmpty ? (
            <Stack gap={4}>
              <Text fz="sm">Папка «{folder.name}» будет удалена.</Text>
              <Text c="dimmed" fz={13}>
                В ней нет тайтлов. Вернуть папку не получится — только создать заново.
              </Text>
            </Stack>
          ) : (
            <>
              <Stack gap={4}>
                <Text fz="sm">
                  В папке «{folder.name}» {getTitlesCountLabel(folder.count)}. Что с ними сделать?
                </Text>
                <Text c="dimmed" fz={13}>
                  Саму папку вернуть не получится. Прогресс чтения останется в любом случае.
                </Text>
              </Stack>
              <Radio.Group {...form.getInputProps('action')}>
                <Stack gap="sm">
                  <Radio value={DELETE_FOLDER_ACTION.MOVE} label="Перенести в другую папку" />
                  {form.getValues().action === DELETE_FOLDER_ACTION.MOVE && (
                    <Select
                      ml={30}
                      aria-label="Папка"
                      allowDeselect={false}
                      data={targets.map(({ id, name }) => ({ value: id, label: name }))}
                      leftSection={target && <FolderGlyph folder={target} />}
                      {...form.getInputProps('targetId')}
                    />
                  )}
                  <Radio value={DELETE_FOLDER_ACTION.REMOVE} label="Убрать из закладок" />
                </Stack>
              </Radio.Group>
            </>
          )}
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" color="red" leftSection={<TrashIcon />}>
              Удалить папку
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default DeleteFolderModal;
