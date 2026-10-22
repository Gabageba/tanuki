import type { MouseEvent } from 'react';
import { ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ArrowSquareOutIcon, DotsThreeIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import DeleteDownloadsModal from '@/features/download/DeleteDownloadsModal';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  titleId: string;
  name: string;
};

/** «⋯» скачанного тайтла: открыть его страницу или удалить все его скачанные главы. */
function DownloadedTitleMenu({ titleId, name }: Props) {
  const { t } = useTranslation();
  const [isDeleteOpened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Menu position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t('titleActions')}
            onClick={(event: MouseEvent) => event.stopPropagation()}
          >
            <DotsThreeIcon />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            component={Link}
            to={generatePath(ROUTE_PATHS.TITLE, { titleId })}
            leftSection={<ArrowSquareOutIcon />}
          >
            {t('openTitle')}
          </Menu.Item>
          <Menu.Item color="red" leftSection={<TrashIcon />} onClick={open}>
            {t('deleteTitleDownloadedChapters')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <DeleteDownloadsModal title={{ id: titleId, name }} opened={isDeleteOpened} onClose={close} />
    </>
  );
}

export default DownloadedTitleMenu;
