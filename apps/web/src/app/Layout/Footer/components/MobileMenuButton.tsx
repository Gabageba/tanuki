import type { Dispatch, SetStateAction } from 'react';
import { Button, Divider, Drawer, Stack, Text } from '@mantine/core';
import { FlaskIcon, GearSixIcon, ListIcon, SignOutIcon, UserGearIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { isStaffRole } from '@tanuki/contracts';
import MobileNavigationButton from './MobileNavigationButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useLogout from '@/entities/user/hooks/useLogout';
import styles from './../../Layout.module.scss';

type Props = {
  isActive: boolean;
  isOpened: boolean;
  setIsOpened: Dispatch<SetStateAction<boolean>>;
};

function MobileMenuButton({ isOpened, isActive, setIsOpened }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <>
      <MobileNavigationButton
        onClick={() => setIsOpened((prev) => !prev)}
        title={t('menu')}
        leftSection={<ListIcon size={20} />}
        isActive={isActive}
      />
      <Drawer
        opened={isOpened}
        onClose={() => setIsOpened(false)}
        title={t('menu')}
        position="right"
      >
        <Stack gap={4}>
          {user && (
            <Text size="sm" c="dimmed" px="sm" py={4}>
              {user.username}
            </Text>
          )}
          <Button
            className={styles.switcherOption}
            onClick={() => {
              setIsOpened(false);
              navigate(ROUTE_PATHS.SETTINGS);
            }}
            variant="tile"
            justify="flex-start"
            size="md"
            leftSection={<GearSixIcon />}
          >
            {t('settings')}
          </Button>
          {isStaffRole(user?.role) && (
            <>
              <Divider />
              <Button
                className={styles.switcherOption}
                onClick={() => {
                  setIsOpened(false);
                  navigate(ROUTE_PATHS.MANAGEMENT);
                }}
                variant="tile"
                justify="flex-start"
                size="md"
                leftSection={<UserGearIcon />}
              >
                {t('management')}
              </Button>
            </>
          )}
          {import.meta.env.DEV && (
            <>
              <Divider />
              <Button
                className={styles.switcherOption}
                onClick={() => {
                  setIsOpened(false);
                  navigate(ROUTE_PATHS.PLAYGROUND);
                }}
                variant="tile"
                justify="flex-start"
                size="md"
                leftSection={<FlaskIcon />}
              >
                {t('playground')}
              </Button>
            </>
          )}
          <Divider />
          <Button
            className={styles.switcherOption}
            c="red"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            variant="tile"
            justify="flex-start"
            size="md"
            leftSection={<SignOutIcon />}
          >
            {t('logOut')}
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}

export default MobileMenuButton;
