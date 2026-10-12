import { useContext, useMemo } from 'react';
import { Box, Divider, Group, SimpleGrid, Stack, Tabs } from '@mantine/core';
import { BooksIcon, HouseLineIcon } from '@phosphor-icons/react';
import SourceTitle from '@/entities/source/components/SourceTitle';
import TitleCard from '@/entities/title/card/TitleCard';
import GoBackButton from '@/shared/ui/GoBackButton';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { HOME_REMANGA } from '../mocks';
import { SHORT_BLOCKS } from '../models';
import HomeBlocksStack from './HomeBlocksStack';

/** P4c — каталог источника с вкладкой «Главная сайта»: подборки живут там, где сам источник.
 *  Вкладка «Каталог» — заглушка сеткой, без фильтров. */
function CatalogSiteHomeMock() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const TABS = useMemo(
    () => [
      {
        id: 'siteHome',
        title: 'Главная сайта',
        icon: <HouseLineIcon />,
        content: <HomeBlocksStack blocks={HOME_REMANGA.blocks} shortBlocks={SHORT_BLOCKS.RIBBON} />,
      },
      {
        id: 'catalog',
        title: 'Каталог',
        icon: <BooksIcon />,
        content: (
          <SimpleGrid cols={isPhone ? 2 : 6} spacing="md">
            {(HOME_REMANGA.blocks[0]?.items ?? []).map((title) => (
              <TitleCard key={title.id} title={title} />
            ))}
          </SimpleGrid>
        ),
      },
    ],
    [isPhone],
  );

  return (
    <Stack gap="md">
      <Group gap="xs" wrap="nowrap">
        <GoBackButton />
        <Box miw={0}>
          <SourceTitle source={HOME_REMANGA.source} />
        </Box>
      </Group>
      <Divider />
      <Tabs defaultValue="siteHome">
        <Tabs.List>
          {TABS.map(({ id, title, icon }) => (
            <Tabs.Tab key={id} value={id} leftSection={icon}>
              {title}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {TABS.map(({ id, content }) => (
          <Tabs.Panel key={id} value={id} pt="lg">
            {content}
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  );
}

export default CatalogSiteHomeMock;
