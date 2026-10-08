import { Button, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CheckIcon, FolderSimpleIcon, FolderSimplePlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  API_ERROR_CODE,
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BOOKMARK_FOLDER_NAME_MAX_LENGTH,
  type BookmarkFolderColor,
  type BookmarkFolderIcon,
} from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import FormErrorAlert from '@/shared/ui/FormErrorAlert';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import useSaveBookmarkFolder from './hooks/useSaveBookmarkFolder';
import IconColorPicker from './IconColorPicker';

type Props = {
  opened: boolean;
  onClose: () => void;
  /** Своя папка для переименования; нет — создаём новую. */
  folder?: ResolvedBookmarkFolder;
};

type FormValues = {
  name: string;
  icon: BookmarkFolderIcon;
  color: BookmarkFolderColor;
  trackUpdates: boolean;
};

/** «Новая папка» и «Переименовать папку» — одна модалка, тон `neutral` (P2). */
function FolderModal({ opened, onClose, folder }: Props) {
  const { t } = useTranslation();
  const { data: folders } = useBookmarkFolders();
  const saveFolder = useSaveBookmarkFolder();

  // Встроенные папки здесь — на языке интерфейса; на остальных языках занятость проверит сервер.
  const takenNames = (folders?.items ?? [])
    .filter(({ id }) => id !== folder?.id)
    .map(({ name }) => name.toLocaleLowerCase());

  const form = useForm<FormValues>({
    initialValues: {
      name: folder?.name ?? '',
      icon: folder?.icon ?? BOOKMARK_FOLDER_ICON.STAR,
      color: folder?.color ?? BOOKMARK_FOLDER_COLOR.BLUE,
      trackUpdates: folder?.trackUpdates ?? true,
    },
    validate: {
      name: (value) => {
        const name = value.trim();
        if (!name) return t('enterName');
        if (name.length > BOOKMARK_FOLDER_NAME_MAX_LENGTH) {
          return t('notLongerThanCountCharacters', { count: BOOKMARK_FOLDER_NAME_MAX_LENGTH });
        }
        if (takenNames.includes(name.toLocaleLowerCase())) return t('folderNameTaken');
        return null;
      },
    },
  });

  const handleSubmit = (values: FormValues) =>
    saveFolder.mutate(
      { folderId: folder?.id, body: { ...values, name: values.name.trim() } },
      {
        onSuccess: onClose,
        onError: (error) => {
          if (
            error instanceof ApiRequestError &&
            error.code === API_ERROR_CODE.BOOKMARK_FOLDER_NAME_TAKEN
          ) {
            form.setFieldError('name', error.message);
          }
        },
      },
    );

  const isNameTakenError =
    saveFolder.error instanceof ApiRequestError &&
    saveFolder.error.code === API_ERROR_CODE.BOOKMARK_FOLDER_NAME_TAKEN;
  const { icon, color } = form.getValues();

  return (
    <ToneModal
      opened={opened}
      onClose={onClose}
      tone={MODAL_TONE.NEUTRAL}
      icon={FolderSimpleIcon}
      title={folder ? t('renameFolder') : t('newFolder')}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            placeholder={t('title')}
            aria-label={t('title')}
            data-autofocus
            leftSection={<FolderGlyph folder={{ icon, color }} />}
            {...form.getInputProps('name')}
          />
          <IconColorPicker
            icon={icon}
            color={color}
            onIconChange={(value) => form.setFieldValue('icon', value)}
            onColorChange={(value) => form.setFieldValue('color', value)}
          />
          <Switch
            label={t('trackUpdates')}
            description={t('checkNewChaptersAndMarkCard')}
            {...form.getInputProps('trackUpdates', { type: 'checkbox' })}
          />
          <Text c="dimmed" fz={13}>
            {t('titleLivesInOneFolder')}
          </Text>
          {!isNameTakenError && <FormErrorAlert error={saveFolder.error?.message ?? null} />}
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              loading={saveFolder.isPending}
              leftSection={folder ? <CheckIcon /> : <FolderSimplePlusIcon />}
            >
              {folder ? t('save') : t('create')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default FolderModal;
