import { Avatar, Box, Group, Indicator, Menu, Stack, Text } from '@mantine/core';
import {
  ArrowsClockwiseIcon,
  CloudSlashIcon,
  DeviceMobileIcon,
  GearIcon,
  SignOutIcon,
  TrayArrowDownIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import OfflineAvatar from './OfflineAvatar';

type Props = {
  /** T2 — точка на аватаре и пункт «Обновить приложение». */
  withUpdate?: boolean;
  /** Итог — точка только у пункта меню, на аватаре её нет. */
  isAvatarDotHidden?: boolean;
  /** N13 — значок облака на аватаре и строка «Нет сети» первой в меню. */
  isOffline?: boolean;
};

const noop = () => {};

/** Меню аватара (M5a), раскрытое прямо на странице: в разделе «Аккаунт» новые «Загрузки» и
 *  «Установить приложение» — пока приложение не установлено. */
function AccountMenuMock({
  withUpdate = false,
  isAvatarDotHidden = false,
  isOffline = false,
}: Props) {
  return (
    <Box h={withUpdate ? 400 : 360} w={300} maw="100%">
      <Group justify="flex-end">
        <Menu
          opened
          onChange={noop}
          withinPortal={false}
          position="bottom-end"
          width={260}
          trapFocus={false}
          returnFocus={false}
        >
          <Menu.Target>
            <Indicator disabled={!withUpdate || isAvatarDotHidden} size={8} offset={4}>
              <OfflineAvatar isOffline={isOffline} />
            </Indicator>
          </Menu.Target>
          <Menu.Dropdown>
            <Group gap="sm" p="xs" wrap="nowrap">
              <Avatar color={PRIMARY_COLOR} variant="outline" name="gabageba" size={40} />
              <Stack gap={0} miw={0}>
                <Text fz="sm" fw={500}>
                  gabageba
                </Text>
                <Text fz={12} c="dimmed" ff="monospace" truncate="end">
                  gabageba@example.com
                </Text>
              </Stack>
            </Group>
            {isOffline && (
              <>
                <Menu.Divider />
                <Group gap="xs" px="sm" py={6} wrap="nowrap">
                  <CloudSlashIcon
                    size={16}
                    color={`var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`}
                  />
                  <Text fz="sm">Нет сети — доступно скачанное</Text>
                </Group>
              </>
            )}
            <Menu.Label>Аккаунт</Menu.Label>
            <Menu.Item leftSection={<UserIcon />}>Профиль</Menu.Item>
            <Menu.Item leftSection={<GearIcon />}>Настройки</Menu.Item>
            <Menu.Item leftSection={<TrayArrowDownIcon />}>Загрузки</Menu.Item>
            <Menu.Item leftSection={<DeviceMobileIcon />}>Установить приложение</Menu.Item>
            {withUpdate && (
              <Menu.Item
                leftSection={
                  <Indicator size={6} offset={2}>
                    <ArrowsClockwiseIcon />
                  </Indicator>
                }
              >
                Обновить приложение
              </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<SignOutIcon />}>
              Выйти
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
}

export default AccountMenuMock;
