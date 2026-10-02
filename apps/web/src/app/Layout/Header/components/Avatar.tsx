import { Avatar as MantineAvatar, Menu } from '@mantine/core';
import { FlaskIcon, GearSixIcon, SignOutIcon, UserGearIcon, UserIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { isStaffRole } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useLogout from '@/entities/user/hooks/useLogout';
import styles from './../Header.module.scss';

function Avatar() {
  const { t } = useTranslation();
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
          src={user?.avatarUrl}
          name={user?.username}
          size={34}
        />
      </Menu.Target>
      <Menu.Dropdown>
        {user && <Menu.Label>{user.username}</Menu.Label>}
        <Menu.Item leftSection={<UserIcon />} component={Link} to={ROUTE_PATHS.PROFILE}>
          {t('profile')}
        </Menu.Item>
        {isStaffRole(user?.role) && (
          <Menu.Item component={Link} to={ROUTE_PATHS.MANAGEMENT} leftSection={<UserGearIcon />}>
            {t('management')}
          </Menu.Item>
        )}
        {import.meta.env.DEV && (
          <Menu.Item component={Link} to={ROUTE_PATHS.PLAYGROUND} leftSection={<FlaskIcon />}>
            {t('playground')}
          </Menu.Item>
        )}
        <Menu.Item leftSection={<GearSixIcon />} component={Link} to={ROUTE_PATHS.SETTINGS}>
          {t('settings')}
        </Menu.Item>

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
