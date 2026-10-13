import { ActionIcon, Menu } from '@mantine/core';
import { DotsThreeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onRemove: () => void;
};

/** «⋯» на карточке «Продолжить чтение» (U1): убрать без модалки, вернуть — из тоста. */
function ContinueReadingActionsMenu({ onRemove }: Props) {
  const { t } = useTranslation();

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" size="sm" aria-label={t('titleActions')}>
          <DotsThreeIcon size={18} weight="bold" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item color="red" leftSection={<EyeSlashIcon />} onClick={onRemove}>
          {t('removeFromContinueReading')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default ContinueReadingActionsMenu;
