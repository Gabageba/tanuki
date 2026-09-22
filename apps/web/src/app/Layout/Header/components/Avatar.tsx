import { Avatar as MantineAvatar, Group, Menu, useMantineColorScheme } from '@mantine/core';
import {
  GearSixIcon,
  GlobeIcon,
  PaletteIcon,
  SignOutIcon,
  TicketIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { isStaffRole } from '@tanuki/contracts';
import { COLOR_SCHEME, getColorSchemeIcon, getColorSchemeLabel } from '@/shared/lib/colorScheme';
import { LANGUAGE, getLanguageLabel } from '@/shared/lib/language';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useLogout from '@/entities/user/hooks/useLogout';
import styles from './../Header.module.scss';

function Avatar() {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <Menu>
      <Menu.Target>
        <MantineAvatar
          color="terracotta"
          className={styles.avatar}
          variant="outline"
          visibleFrom="md"
          name={user?.username}
          size={34}
        />
      </Menu.Target>
      <Menu.Dropdown>
        {user && <Menu.Label>{user.username}</Menu.Label>}
        <Menu.Item leftSection={<UserIcon />}>Профиль</Menu.Item>
        {isStaffRole(user?.role) && (
          <Menu.Item component={Link} to={ROUTE_PATHS.INVITES} leftSection={<TicketIcon />}>
            {t('invites')}
          </Menu.Item>
        )}
        <Menu.Item leftSection={<GearSixIcon />}>Настройки</Menu.Item>
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<PaletteIcon />}>{t('theme')}</Menu.Sub.Item>
          </Menu.Sub.Target>

          <Menu.Sub.Dropdown>
            <Menu.RadioGroup value={colorScheme}>
              {Object.values(COLOR_SCHEME).map((value) => (
                <Menu.RadioItem key={value} value={value} onChange={() => setColorScheme(value)}>
                  <Group>
                    {getColorSchemeIcon(value)}
                    {getColorSchemeLabel(value, t)}
                  </Group>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<GlobeIcon />}>{t('language')}</Menu.Sub.Item>
          </Menu.Sub.Target>

          <Menu.Sub.Dropdown>
            <Menu.RadioGroup value={i18n.language}>
              {Object.values(LANGUAGE).map((value) => (
                <Menu.RadioItem
                  key={value}
                  value={value}
                  onChange={() => i18n.changeLanguage(value)}
                >
                  {getLanguageLabel(value)}
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Sub.Dropdown>
        </Menu.Sub>

        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<SignOutIcon />}
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {t('logOut')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default Avatar;
