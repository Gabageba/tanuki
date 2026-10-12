import { ActionIcon, Menu } from '@mantine/core';
import { DotsThreeIcon, EyeSlashIcon } from '@phosphor-icons/react';

type Props = {
  onRemove: () => void;
};

/** U1 — «⋯» на карточке, как Q4 у закладок: убрать без модалки, вернуть — из тоста. */
function ContinueActionsMenu({ onRemove }: Props) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          flex="none"
          aria-label="Действия с тайтлом"
        >
          <DotsThreeIcon size={18} weight="bold" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item color="red" leftSection={<EyeSlashIcon />} onClick={onRemove}>
          Убрать из «Продолжить чтение»
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default ContinueActionsMenu;
