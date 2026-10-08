import type { MouseEvent } from 'react';
import { ActionIcon, Box, Menu, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DotsThreeIcon, FolderSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { generatePath, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { BookmarkItem } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import useRemoveTitleBookmark from '@/features/bookmark/hooks/useRemoveTitleBookmark';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import MoveBookmarkModal from './MoveBookmarkModal';

type Props = {
  bookmark: BookmarkItem;
};

/** Карточка целиком — ссылка, клик по «⋯» до неё доходить не должен. */
const stopCardClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Меню «⋯» карточки закладки (Q4): другие источники группы, «Перенести в папку» — модалкой (подменю
 * на телефоне упиралось в край экрана) и «Убрать из закладок» — сразу, с «Вернуть» в тосте.
 */
function BookmarkActionsMenu({ bookmark }: Props) {
  const { t } = useTranslation();
  const [isMoveOpened, moveModal] = useDisclosure(false);
  const removeBookmark = useRemoveTitleBookmark(bookmark.titleId);
  const sources = [
    { sourceId: bookmark.sourceId, titleId: bookmark.titleId },
    ...bookmark.otherSources,
  ];

  return (
    <>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={24}
            ml="auto"
            flex="none"
            aria-label={t('bookmarkActions')}
            onClick={stopCardClick}
          >
            <DotsThreeIcon size={18} weight="bold" />
          </ActionIcon>
        </Menu.Target>
        {/* Меню в портале, но React-события всплывают по дереву компонентов — до ссылки карточки. */}
        <Menu.Dropdown onClick={(event) => event.stopPropagation()}>
          {bookmark.otherSources.length > 0 && (
            <>
              <Menu.Label>{t('openOnSource')}</Menu.Label>
              {sources.map(({ sourceId, titleId }) => {
                const title = getCatalogSourceTitle(sourceId);

                return (
                  <Menu.Item
                    key={titleId}
                    component={Link}
                    to={generatePath(ROUTE_PATHS.TITLE, { titleId })}
                    leftSection={<SourceIcon id={sourceId} title={title} size={18} radius="sm" />}
                  >
                    <Text inherit>{title}</Text>
                  </Menu.Item>
                );
              })}
              <Menu.Divider />
            </>
          )}
          <Menu.Item leftSection={<FolderSimpleIcon />} onClick={moveModal.open}>
            {t('moveToFolder')}
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<TrashIcon />}
            onClick={() => removeBookmark.mutate()}
          >
            {t('removeFromBookmarks')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      {/* Модалка в портале, но её клики всплывают по дереву React до ссылки карточки. */}
      <Box component="span" display="contents" onClick={(event) => event.stopPropagation()}>
        <MoveBookmarkModal bookmark={bookmark} opened={isMoveOpened} onClose={moveModal.close} />
      </Box>
    </>
  );
}

export default BookmarkActionsMenu;
