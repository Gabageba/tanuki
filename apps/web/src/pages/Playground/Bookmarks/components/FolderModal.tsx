import { Button, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CheckIcon, FolderSimpleIcon, FolderSimplePlusIcon } from '@phosphor-icons/react';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import {
  BUILT_IN_STYLE,
  FOLDER_COLOR,
  FOLDER_ICON,
  FOLDER_NAME_MAX_LENGTH,
  type FolderColor,
  type FolderIcon,
  type IconPickerVariant,
  type MockFolder,
} from '../models';
import FolderGlyph from './FolderGlyph';
import IconColorPicker from './IconColorPicker';

type Props = {
  opened: boolean;
  onClose: () => void;
  pickerVariant: IconPickerVariant;
  /** Своя папка для переименования; нет — создаём новую. */
  folder?: MockFolder;
};

type FormValues = {
  name: string;
  icon: FolderIcon;
  color: FolderColor;
  trackUpdates: boolean;
};

/** Названия, с которыми новое совпадать не может, — включая встроенные на языке пользователя. */
const TAKEN_NAMES = MOCK_FOLDERS.map((item) =>
  resolveFolder(item, BUILT_IN_STYLE.SEMANTIC).name.toLowerCase(),
);

/** «Новая папка» и «Переименовать» — одна модалка, тон `neutral`. */
function FolderModal({ opened, onClose, pickerVariant, folder }: Props) {
  const form = useForm<FormValues>({
    initialValues: {
      name: folder?.name ?? '',
      icon: folder?.icon ?? FOLDER_ICON.STAR,
      color: folder?.color ?? FOLDER_COLOR.BLUE,
      trackUpdates: folder?.trackUpdates ?? true,
    },
    validate: {
      name: (value) => {
        const name = value.trim();
        if (!name) return 'Введите название';
        if (name.length > FOLDER_NAME_MAX_LENGTH) {
          return `Не длиннее ${FOLDER_NAME_MAX_LENGTH} символов`;
        }
        const isOwnName = folder?.name?.toLowerCase() === name.toLowerCase();
        if (!isOwnName && TAKEN_NAMES.includes(name.toLowerCase())) {
          return 'Папка с таким названием уже есть';
        }
        return null;
      },
    },
  });

  const { icon, color } = form.getValues();

  return (
    <ToneModal
      opened={opened}
      onClose={onClose}
      tone={MODAL_TONE.NEUTRAL}
      icon={FolderSimpleIcon}
      title={folder ? 'Переименовать папку' : 'Новая папка'}
    >
      <form onSubmit={form.onSubmit(onClose)}>
        <Stack gap="md">
          <TextInput
            placeholder="Название"
            data-autofocus
            leftSection={<FolderGlyph folder={{ icon, color }} />}
            {...form.getInputProps('name')}
          />
          <IconColorPicker
            variant={pickerVariant}
            icon={icon}
            color={color}
            onIconChange={(value) => form.setFieldValue('icon', value)}
            onColorChange={(value) => form.setFieldValue('color', value)}
          />
          <Switch
            label="Следить за обновлениями"
            description="Проверять новые главы и показывать их число на карточке"
            {...form.getInputProps('trackUpdates', { type: 'checkbox' })}
          />
          <Text c="dimmed" fz={13}>
            Тайтл лежит в одной папке. Порядок папок меняется в настройках.
          </Text>
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" leftSection={folder ? <CheckIcon /> : <FolderSimplePlusIcon />}>
              {folder ? 'Сохранить' : 'Создать'}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default FolderModal;
