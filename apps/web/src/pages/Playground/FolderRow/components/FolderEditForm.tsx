import type { ReactNode } from 'react';
import { Button, Group, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CheckIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import FolderGlyph from '../../Bookmarks/components/FolderGlyph';
import IconColorPicker from '../../Bookmarks/components/IconColorPicker';
import {
  FOLDER_COLOR,
  FOLDER_ICON,
  FOLDER_NAME_MAX_LENGTH,
  ICON_PICKER_VARIANT,
  type FolderColor,
  type FolderIcon,
  type MockFolder,
} from '../../Bookmarks/models';

type Props = {
  folder: MockFolder;
  onClose: () => void;
  /** В модалке — тумблер слежения и пояснение; в строке (E3) тумблер уже рядом, их нет. */
  isInModal: boolean;
  /** V2/V3 — «Удалить папку» в одном ряду с «Отменой» и «Сохранить», слева. */
  deleteButton?: ReactNode;
  /** D2 — зона удаления под кнопками. */
  deleteZone?: ReactNode;
};

type FormValues = {
  name: string;
  icon: FolderIcon;
  color: FolderColor;
  trackUpdates: boolean;
};

/** Правка своей папки — содержимое модалки «Изменить папку» и раскрытой строки E3. Без
 *  `deleteButton` кнопки прижаты вправо, как в любой модалке. */
function FolderEditForm({ folder, onClose, isInModal, deleteButton, deleteZone }: Props) {
  const form = useForm<FormValues>({
    initialValues: {
      name: folder.name ?? '',
      icon: folder.icon ?? FOLDER_ICON.STAR,
      color: folder.color ?? FOLDER_COLOR.BLUE,
      trackUpdates: folder.trackUpdates,
    },
    validate: {
      name: (value) => {
        const name = value.trim();
        if (!name) return 'Введите название';
        if (name.length > FOLDER_NAME_MAX_LENGTH) {
          return `Не длиннее ${FOLDER_NAME_MAX_LENGTH} символов`;
        }
        return null;
      },
    },
  });

  const { icon, color } = form.getValues();

  return (
    <form onSubmit={form.onSubmit(onClose)}>
      <Stack gap="md">
        <TextInput
          placeholder="Название"
          data-autofocus
          leftSection={<FolderGlyph folder={{ icon, color }} />}
          {...form.getInputProps('name')}
        />
        <IconColorPicker
          variant={ICON_PICKER_VARIANT.TINTED}
          icon={icon}
          color={color}
          onIconChange={(value) => form.setFieldValue('icon', value)}
          onColorChange={(value) => form.setFieldValue('color', value)}
        />
        {isInModal && (
          <>
            <Switch
              label="Следить за обновлениями"
              description="Проверять новые главы и показывать их число на карточке"
              {...form.getInputProps('trackUpdates', { type: 'checkbox' })}
            />
            <Text c="dimmed" fz={13}>
              Тайтл лежит в одной папке. Порядок папок меняется в настройках.
            </Text>
          </>
        )}
        <Group justify={deleteButton ? 'space-between' : 'flex-end'} gap="xs">
          {deleteButton}
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" leftSection={<CheckIcon />}>
              Сохранить
            </Button>
          </ModalButtonsLayout>
        </Group>
        {deleteZone}
      </Stack>
    </form>
  );
}

export default FolderEditForm;
