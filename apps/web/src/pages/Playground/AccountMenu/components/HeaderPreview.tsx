import { SimpleGrid, Stack, Text } from '@mantine/core';
import MenuDrawerMock from './drawers/MenuDrawerMock';
import SourcesDrawerMock from './drawers/SourcesDrawerMock';
import FiltersDrawerMock from './drawers/FiltersDrawerMock';
import ChaptersDrawerMock from './drawers/ChaptersDrawerMock';
import ReaderSettingsDrawerMock from './drawers/ReaderSettingsDrawerMock';
import UserDrawerMock from './drawers/UserDrawerMock';
import SourceDrawerMock from './drawers/SourceDrawerMock';
import InviteDrawerMock from './drawers/InviteDrawerMock';
import { ADMIN } from '../mocks';
import type { HeaderStyle } from '../models';

type Props = {
  headerStyle: HeaderStyle;
};

/** Все drawer'ы приложения с заголовком в одном стиле — панели шириной телефона. */
function HeaderPreview({ headerStyle }: Props) {
  const items = [
    { caption: 'Меню', node: <MenuDrawerMock headerStyle={headerStyle} user={ADMIN} /> },
    { caption: 'Выбор источника', node: <SourcesDrawerMock headerStyle={headerStyle} /> },
    { caption: 'Фильтры каталога', node: <FiltersDrawerMock headerStyle={headerStyle} /> },
    {
      caption: 'Фильтры каталога · группа',
      node: <FiltersDrawerMock headerStyle={headerStyle} isInner />,
    },
    { caption: 'Главы в читалке', node: <ChaptersDrawerMock headerStyle={headerStyle} /> },
    { caption: 'Настройки читалки', node: <ReaderSettingsDrawerMock headerStyle={headerStyle} /> },
    { caption: 'Пользователь', node: <UserDrawerMock headerStyle={headerStyle} /> },
    { caption: 'Источник', node: <SourceDrawerMock headerStyle={headerStyle} /> },
    { caption: 'Приглашение', node: <InviteDrawerMock headerStyle={headerStyle} /> },
  ];

  return (
    <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg" maw={1200}>
      {items.map((item) => (
        <Stack key={item.caption} gap={6}>
          <Text fz="xs" c="dimmed">
            {item.caption}
          </Text>
          {item.node}
        </Stack>
      ))}
    </SimpleGrid>
  );
}

export default HeaderPreview;
