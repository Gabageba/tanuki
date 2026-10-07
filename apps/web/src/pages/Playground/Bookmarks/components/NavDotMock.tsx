import { ActionIcon, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react';
import type { DotVariant } from '../models';
import FooterItemMock from './FooterItemMock';
import NavDot from './NavDot';

type Props = {
  variant: DotVariant;
};

/** Новых глав нет — точки нет; в четырёх закладках есть — точка. */
const STATES = [
  { label: 'Есть новые', count: 4 },
  { label: 'Нет новых', count: 0 },
];

/** Иконка закладок в шапке (десктоп) и пункт «Закладки» в футере (мобилка) — неактивный и
 *  открытый. Вид пунктов футера повторяет `MobileNavigationButton`. */
function NavDotMock({ variant }: Props) {
  return (
    <Group gap="xl" align="flex-start">
      {STATES.map(({ label, count }) => (
        <Stack key={label} gap={6}>
          <Text fz={12} c="dimmed">
            {label}
          </Text>
          <Paper withBorder radius="md" px="sm" py={6} w="fit-content">
            <Group gap={4}>
              <Tooltip label="Закладки">
                <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Закладки">
                  <NavDot variant={variant} count={count}>
                    <BookmarkSimpleIcon size={20} />
                  </NavDot>
                </ActionIcon>
              </Tooltip>
              <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Уведомления">
                <BellIcon size={20} />
              </ActionIcon>
            </Group>
          </Paper>
          {[true, false].map((isBookmarksActive) => (
            <Paper key={String(isBookmarksActive)} withBorder radius="md" p={4} w={375} maw="100%">
              <Group gap={4} wrap="nowrap">
                <FooterItemMock
                  icon={<SquaresFourIcon size={20} />}
                  label="Источники"
                  isActive={!isBookmarksActive}
                />
                <FooterItemMock
                  icon={
                    <NavDot variant={variant} count={count}>
                      <BookmarkSimpleIcon size={20} />
                    </NavDot>
                  }
                  label="Закладки"
                  isActive={isBookmarksActive}
                />
                <FooterItemMock icon={<BellIcon size={20} />} label="Уведомления" />
                <FooterItemMock icon={<ListIcon size={20} />} label="Меню" />
              </Group>
            </Paper>
          ))}
        </Stack>
      ))}
    </Group>
  );
}

export default NavDotMock;
