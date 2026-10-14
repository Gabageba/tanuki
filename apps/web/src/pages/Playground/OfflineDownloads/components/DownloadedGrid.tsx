import { use, useState } from 'react';
import { Box, Group, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import CoverImage from '@/shared/ui/CoverImage';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { DRAWER_POSITION } from '@/shared/ui/ResponsiveDrawer/models';
import { getMockCoverUrl } from '../../Bookmarks/lib';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';
import { DOWNLOADED_TITLES } from '../mocks';
import DownloadedChapters from './DownloadedChapters';
import DownloadedTitleHeading from './DownloadedTitleHeading';
import DownloadedTitleMenu from './DownloadedTitleMenu';
import DownloadedTitleMeta from './DownloadedTitleMeta';
import titleStyles from '@/entities/title/Title.module.scss';

/** L2 — сетка обложек, как в закладках; главы тайтла — в drawer (справа, на телефоне снизу). */
function DownloadedGrid() {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const opened = DOWNLOADED_TITLES.find((title) => title.id === openedId);

  return (
    <>
      <SimpleGrid cols={isPhone ? 3 : 5} spacing="sm">
        {DOWNLOADED_TITLES.map((title) => (
          <UnstyledButton key={title.id} onClick={() => setOpenedId(title.id)}>
            <Stack gap={4}>
              <Box className={titleStyles.imageWrapper}>
                <CoverImage
                  src={getMockCoverUrl(title.coverSeed)}
                  alt={title.name}
                  className={titleStyles.image}
                />
              </Box>
              <Text fz="sm" lineClamp={2} lh="tight">
                {title.name}
              </Text>
              <DownloadedTitleMeta title={title} withSource={false} />
            </Stack>
          </UnstyledButton>
        ))}
      </SimpleGrid>
      <ResponsiveDrawer
        opened={opened !== undefined}
        onClose={() => setOpenedId(null)}
        side={DRAWER_POSITION.RIGHT}
        title={
          opened && (
            <Group gap="xs" wrap="nowrap" miw={0}>
              <DownloadedTitleHeading title={opened} />
              <DownloadedTitleMenu title={opened} />
            </Group>
          )
        }
      >
        {opened && <DownloadedChapters chapters={opened.chapters} />}
      </ResponsiveDrawer>
    </>
  );
}

export default DownloadedGrid;
