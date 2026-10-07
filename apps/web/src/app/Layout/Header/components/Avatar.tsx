import { Avatar as MantineAvatar, Box, Menu } from '@mantine/core';
import { SignOutIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useLogout from '@/entities/user/hooks/useLogout';
import AccountHeading from '../../components/AccountHeading';
import {
  getAccountMenuItemIcon,
  getAccountMenuItemLabel,
  getAccountMenuItemPath,
  getAccountMenuSectionLabel,
  getAccountMenuSections,
} from '../../lib';
import styles from './../Header.module.scss';

function Avatar() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <Menu width={260}>
      <Menu.Target>
        <MantineAvatar
          color={PRIMARY_COLOR}
          className={styles.avatar}
          variant="outline"
          visibleFrom="md"
          src={user?.avatarUrl}
          name={user?.username}
          size={34}
        />
      </Menu.Target>
      <Menu.Dropdown>
        {user && (
          <Box px="sm" py="xs">
            <AccountHeading user={user} />
          </Box>
        )}
        {getAccountMenuSections(user?.role).map(({ section, items }) => (
          <Box key={section}>
            <Menu.Divider />
            <Menu.Label>{getAccountMenuSectionLabel(section, t)}</Menu.Label>
            {items.map((item) => (
              <Menu.Item
                key={item}
                component={Link}
                to={getAccountMenuItemPath(item)}
                leftSection={getAccountMenuItemIcon(item)}
              >
                {getAccountMenuItemLabel(item, t)}
              </Menu.Item>
            ))}
          </Box>
        ))}
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
