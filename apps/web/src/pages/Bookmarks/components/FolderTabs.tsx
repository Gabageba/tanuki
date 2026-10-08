import { useState } from 'react';
import { ActionIcon, Box, Group, Indicator, Scroller, Tabs, Text, Tooltip } from '@mantine/core';
import { FolderSimplePlusIcon, GearSixIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CUSTOM_BOOKMARK_FOLDERS_LIMIT } from '@tanuki/contracts';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import FolderModal from '@/features/bookmark/FolderModal';
import { SETTINGS_BOOKMARKS_PATH } from '@/shared/lib/routes';

type Props = {
  folders: ResolvedBookmarkFolder[];
  activeId: string;
  onChange: (id: string) => void;
};

/**
 * Полоса вкладок-папок (T2 + A1), прокручивается вбок: иконка папки её цветом с точкой, если в
 * папке есть новые главы, название и число тайтлов. В конце — «Новая папка» и ссылка на
 * управление папками в настройках.
 */
function FolderTabs({ folders, activeId, onChange }: Props) {
  const { t } = useTranslation();
  const [isCreateOpened, setIsCreateOpened] = useState(false);
  const isLimitReached =
    folders.filter(({ builtIn }) => builtIn === null).length >= CUSTOM_BOOKMARK_FOLDERS_LIMIT;

  return (
    <>
      <Tabs value={activeId} onChange={(value) => value && onChange(value)}>
        <Tabs.List style={{ flexWrap: 'nowrap' }}>
          <Box flex={1} miw={0}>
            <Scroller>
              {folders.map((folder) => (
                <Tabs.Tab
                  key={folder.id}
                  value={folder.id}
                  leftSection={
                    <Indicator size={7} offset={1} disabled={folder.newCount === 0}>
                      <FolderGlyph folder={folder} />
                    </Indicator>
                  }
                >
                  <Group gap={6} wrap="nowrap">
                    <Text inherit truncate maw={160} title={folder.name}>
                      {folder.name}
                    </Text>
                    <Text inherit ff="monospace" c="dimmed" fz={12}>
                      {folder.count}
                    </Text>
                  </Group>
                </Tabs.Tab>
              ))}
            </Scroller>
          </Box>
          <Group gap={2} wrap="nowrap" pl="xs" flex="none">
            <Tooltip
              label={
                isLimitReached
                  ? t('customFoldersLimit', { count: CUSTOM_BOOKMARK_FOLDERS_LIMIT })
                  : t('newFolder')
              }
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={t('newFolder')}
                disabled={isLimitReached}
                onClick={() => setIsCreateOpened(true)}
              >
                <FolderSimplePlusIcon />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('manageFolders')}>
              <ActionIcon
                component={Link}
                to={SETTINGS_BOOKMARKS_PATH}
                variant="subtle"
                color="gray"
                aria-label={t('manageFolders')}
              >
                <GearSixIcon />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Tabs.List>
      </Tabs>
      {isCreateOpened && <FolderModal opened onClose={() => setIsCreateOpened(false)} />}
    </>
  );
}

export default FolderTabs;
