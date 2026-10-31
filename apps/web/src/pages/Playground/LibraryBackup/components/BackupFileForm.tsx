import { Button, FileInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ArrowRightIcon, FileIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MOCK_FILE, MOCK_FOREIGN_FILE } from '../mocks';
import { FILE_STATE, FILE_VIEW, type FileState } from '../models';
import BackupDropzone from './BackupDropzone';

type Props = {
  view: typeof FILE_VIEW.INPUT | typeof FILE_VIEW.DROPZONE;
  state: FileState;
  /** Файл прошёл проверку — в итоге ведёт на сводку. */
  onSubmit?: () => void;
};

type FormValues = {
  file: File | null;
};

const NOT_A_BACKUP = 'Это не резервная копия tanuki';

const getInitialFile = (state: FileState) => {
  switch (state) {
    case FILE_STATE.EMPTY:
      return null;
    case FILE_STATE.CHOSEN:
    case FILE_STATE.SENDING:
      return MOCK_FILE;
    case FILE_STATE.ERROR:
      return MOCK_FOREIGN_FILE;
  }
};

/** Шаг «Файл» F1/F2: что это за файл, поле и «Далее». Проверка схемой — `validate` формы; в
 *  песочнице «чужим» считается любой файл, в имени которого нет `tanuki-backup`. */
function BackupFileForm({ view, state, onSubmit }: Props) {
  const form = useForm<FormValues>({
    initialValues: { file: getInitialFile(state) },
    initialErrors: state === FILE_STATE.ERROR ? { file: NOT_A_BACKUP } : {},
    validate: {
      file: (value) => {
        if (!value) return 'Выберите файл копии';
        if (!value.name.includes('tanuki-backup')) return NOT_A_BACKUP;
        return null;
      },
    },
  });

  return (
    <form onSubmit={form.onSubmit(() => onSubmit?.())}>
      <Stack>
        <Stack gap={6}>
          <Text fz="sm">Выберите файл резервной копии.</Text>
          <Text c="dimmed" fz={13}>
            Его скачивает кнопка «Скачать копию» в профиле — на этом или другом инстансе tanuki. До
            записи покажем, что из копии добавится.
          </Text>
        </Stack>
        {view === FILE_VIEW.INPUT ? (
          <FileInput
            placeholder="Файл копии"
            accept="application/json,.json"
            leftSection={<FileIcon />}
            clearable
            {...form.getInputProps('file')}
          />
        ) : (
          <BackupDropzone {...form.getInputProps('file')} />
        )}
        <ModalButtonsLayout>
          <Button variant="default">Отмена</Button>
          <Button
            type="submit"
            leftSection={<ArrowRightIcon />}
            loading={state === FILE_STATE.SENDING}
          >
            Далее
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default BackupFileForm;
