import type { MouseEvent } from 'react';
import { ActionIcon, Menu } from '@mantine/core';
import { CheckCircleIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { stopRowClick } from './lib';

type Props = {
  onDelete: (event: MouseEvent) => void;
};

/** Галочка скачанной главы с меню удаления. */
function DownloadedChapterMenu({ onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="teal"
          aria-label={t('chapterDownloaded')}
          onClick={stopRowClick}
        >
          <CheckCircleIcon weight="fill" color="var(--mantine-color-teal-filled)" />
        </ActionIcon>
      </Menu.Target>
      {/* Выпадающее в портале, но события React всплывают по дереву — до ссылки строки. */}
      <Menu.Dropdown onClick={stopRowClick}>
        <Menu.Item color="red" leftSection={<TrashIcon />} onClick={onDelete}>
          {t('deleteDownloadedChapter')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default DownloadedChapterMenu;
