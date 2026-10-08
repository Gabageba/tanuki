import { Fragment } from 'react';
import { Box, Divider, Group, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import ProgressList from '@/shared/ui/ProgressList';
import { getTitlesCountLabel, resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import { BUILT_IN_STYLE, PROFILE_VARIANT, type ProfileVariant } from '../models';
import FolderGlyph from './FolderGlyph';
import ProfileCardFrame from './ProfileCardFrame';
import styles from '../Bookmarks.module.scss';

type Props = {
  variant: ProfileVariant;
};

const FOLDERS = MOCK_FOLDERS.map((folder) => resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC));
const TOTAL = FOLDERS.reduce((sum, { count }) => sum + count, 0);

/** Блок «Закладки» на вкладке статистики профиля: сколько тайтлов в каждой папке; клик по
 *  папке ведёт на /bookmarks с этой вкладкой. */
function ProfileFoldersCard({ variant }: Props) {
  return (
    <ProfileCardFrame label="Закладки" extra={getTitlesCountLabel(TOTAL)}>
      {variant === PROFILE_VARIANT.PROGRESS_LIST && (
        <ProgressList
          gap="sm"
          items={FOLDERS.map((folder) => ({
            key: folder.id,
            label: (
              <Group component="span" gap={8} wrap="nowrap">
                <FolderGlyph folder={folder} />
                <Text component="span" inherit truncate>
                  {folder.name}
                </Text>
              </Group>
            ),
            value: folder.count,
            text: folder.count,
          }))}
        />
      )}
      {variant === PROFILE_VARIANT.ROWS && (
        <Stack gap={0}>
          {FOLDERS.map((folder, index) => (
            <Fragment key={folder.id}>
              {index > 0 && <Divider />}
              <UnstyledButton py={8}>
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap" miw={0}>
                    <FolderGlyph folder={folder} size={18} />
                    <Text truncate>{folder.name}</Text>
                  </Group>
                  <Group gap={6} wrap="nowrap" c="dimmed">
                    <Text ff="monospace" c={folder.count ? undefined : 'dimmed'}>
                      {folder.count}
                    </Text>
                    <CaretRightIcon size={14} />
                  </Group>
                </Group>
              </UnstyledButton>
            </Fragment>
          ))}
        </Stack>
      )}
      {variant === PROFILE_VARIANT.STACKED_BAR && (
        <Stack gap="md">
          <Group gap={0} wrap="nowrap" h={12} bdrs="xl" style={{ overflow: 'hidden' }}>
            {FOLDERS.filter(({ count }) => count > 0).map((folder) => (
              <Box
                key={folder.id}
                h="100%"
                flex={folder.count}
                bg={`var(--mantine-color-${folder.color}-filled)`}
                className={styles.stackedSegment}
                title={`${folder.name}: ${folder.count}`}
              />
            ))}
          </Group>
          <SimpleGrid cols={2} spacing="sm" verticalSpacing={6}>
            {FOLDERS.map((folder) => (
              <UnstyledButton key={folder.id}>
                <Group gap={8} wrap="nowrap">
                  <Box
                    w={8}
                    h={8}
                    bdrs="50%"
                    flex="none"
                    bg={`var(--mantine-color-${folder.color}-filled)`}
                  />
                  <Text fz="sm" truncate flex={1}>
                    {folder.name}
                  </Text>
                  <Text fz="sm" ff="monospace" c="dimmed">
                    {folder.count}
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </ProfileCardFrame>
  );
}

export default ProfileFoldersCard;
