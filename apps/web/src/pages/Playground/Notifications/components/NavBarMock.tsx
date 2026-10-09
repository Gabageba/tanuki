import { ActionIcon, Group, Indicator, Paper, Stack, Text } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react';
import type { Badge } from '../models';
import BellBadge from './BellBadge';
import FooterItemMock from './FooterItemMock';

type Props = {
  variant: Badge;
  count: number;
  /** В закладках есть новые главы — рядом с колокольчиком горит точка закладок. */
  hasBookmarkDot: boolean;
  label: string;
};

/** Иконки шапки (десктоп) и футер (мобилка) с колокольчиком в одном состоянии. */
function NavBarMock({ variant, count, hasBookmarkDot, label }: Props) {
  return (
    <Stack gap={6}>
      <Text fz={12} c="dimmed">
        {label}
      </Text>
      <Paper withBorder radius="md" px="sm" py={6} w="fit-content">
        <Group gap={4}>
          <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Закладки">
            <Indicator size={8} offset={{ x: 5, y: 3 }} disabled={!hasBookmarkDot}>
              <BookmarkSimpleIcon size={20} />
            </Indicator>
          </ActionIcon>
          <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Уведомления">
            <BellBadge variant={variant} count={count} isHeader>
              <BellIcon size={20} />
            </BellBadge>
          </ActionIcon>
        </Group>
      </Paper>
      {[false, true].map((isBellActive) => (
        <Paper key={String(isBellActive)} withBorder radius="md" p={4} w={375} maw="100%">
          <Group gap={4} wrap="nowrap">
            <FooterItemMock icon={<SquaresFourIcon size={20} />} label="Источники" />
            <FooterItemMock
              icon={
                <Indicator size={8} offset={2} disabled={!hasBookmarkDot}>
                  <BookmarkSimpleIcon size={20} />
                </Indicator>
              }
              label="Закладки"
            />
            <FooterItemMock
              icon={
                <BellBadge variant={variant} count={count} isHeader={false}>
                  <BellIcon size={20} />
                </BellBadge>
              }
              label="Уведомления"
              isActive={isBellActive}
            />
            <FooterItemMock icon={<ListIcon size={20} />} label="Меню" />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}

export default NavBarMock;
