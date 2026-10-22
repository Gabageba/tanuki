import type { MouseEvent } from 'react';
import { ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ArrowSquareOutIcon, DotsThreeIcon, TrashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import type { MockDownloadedTitle } from '../models';
import DeleteDownloadedModal from './DeleteDownloadedModal';

type Props = {
  title: MockDownloadedTitle;
};

/** Меню скачанного тайтла: открыть его страницу или удалить все его скачанные главы. */
function DownloadedTitleMenu({ title }: Props) {
  const [isDeleteOpened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Menu position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Действия с тайтлом"
            onClick={(event: MouseEvent) => event.stopPropagation()}
          >
            <DotsThreeIcon />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item component={Link} to="#" leftSection={<ArrowSquareOutIcon />}>
            Открыть тайтл
          </Menu.Item>
          <Menu.Item color="red" leftSection={<TrashIcon />} onClick={open}>
            Удалить скачанные главы тайтла
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <DeleteDownloadedModal titleName={title.name} opened={isDeleteOpened} onClose={close} />
    </>
  );
}

export default DownloadedTitleMenu;
