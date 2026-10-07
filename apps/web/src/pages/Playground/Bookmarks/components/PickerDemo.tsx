import { useState } from 'react';
import { Group, Paper } from '@mantine/core';
import { FolderSimplePlusIcon } from '@phosphor-icons/react';
import {
  FOLDER_COLOR,
  FOLDER_ICON,
  type FolderColor,
  type FolderIcon,
  type IconPickerVariant,
} from '../models';
import FolderModal from './FolderModal';
import IconColorPicker from './IconColorPicker';
import ModalTrigger from './ModalTrigger';

type Props = {
  variant: IconPickerVariant;
};

/** Выбор иконки и цвета прямо на странице — чтобы сравнить P1 и P2 рядом, — и модалка целиком. */
function PickerDemo({ variant }: Props) {
  const [icon, setIcon] = useState<FolderIcon>(FOLDER_ICON.STAR);
  const [color, setColor] = useState<FolderColor>(FOLDER_COLOR.BLUE);

  return (
    <Group gap="xl" align="flex-start">
      <Paper withBorder radius="md" p="md" w="fit-content" maw="100%">
        <IconColorPicker
          variant={variant}
          icon={icon}
          color={color}
          onIconChange={setIcon}
          onColorChange={setColor}
        />
      </Paper>
      <ModalTrigger
        label="Новая папка"
        icon={<FolderSimplePlusIcon />}
        renderModal={(onClose) => <FolderModal opened onClose={onClose} pickerVariant={variant} />}
      />
    </Group>
  );
}

export default PickerDemo;
