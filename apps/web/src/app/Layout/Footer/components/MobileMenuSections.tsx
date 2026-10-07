import { Box, ScrollArea, Text } from '@mantine/core';
import { SignOutIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useLogout from '@/entities/user/hooks/useLogout';
import MobileMenuRow from './MobileMenuRow';
import MobileMenuDivider from './MobileMenuDivider';
import {
  getAccountMenuItemIcon,
  getAccountMenuItemLabel,
  getAccountMenuItemPath,
  getAccountMenuSectionLabel,
  getAccountMenuSections,
} from '../../lib';

type Props = {
  onNavigate: () => void;
};

/** Разделы меню аккаунта строками в размер Menu.Item — тот же список, что в меню аватара.
 *  Drawer после перехода на другую страницу закрывает Footer — по смене pathname; клик по
 *  пункту текущей страницы адрес не меняет, и drawer закрывается здесь, через `onNavigate`. */
function MobileMenuSections({ onNavigate }: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <>
      {/* Тело drawer — колонка, ограниченная по высоте (тема): длинный список прокручивается, а
        «Выйти» остаётся под ним на виду — сбоку, на планшете, он прижат к низу. У drawer снизу
        высота по содержимому, только с пределом, — от неё не считается `height: 100%` вьюпорта,
        поэтому он сжимается как flex-элемент. */}
      <ScrollArea
        type="auto"
        flex={1}
        mih={0}
        display="flex"
        styles={{ root: { flexDirection: 'column' }, viewport: { flex: 1, minHeight: 0 } }}
      >
        {getAccountMenuSections(user?.role).map(({ section, items }, index) => (
          <Box key={section}>
            {index > 0 && <MobileMenuDivider />}
            {/* Подпись раздела — как Menu.Label. */}
            <Text fz="xs" fw={500} c="dimmed" px="sm" py="calc(var(--mantine-spacing-xs) / 2)">
              {getAccountMenuSectionLabel(section, t)}
            </Text>
            {items.map((item) => (
              <MobileMenuRow
                key={item}
                to={getAccountMenuItemPath(item)}
                onClick={getAccountMenuItemPath(item) === pathname ? onNavigate : undefined}
                leftSection={getAccountMenuItemIcon(item)}
              >
                {getAccountMenuItemLabel(item, t)}
              </MobileMenuRow>
            ))}
          </Box>
        ))}
      </ScrollArea>
      <MobileMenuDivider />
      <MobileMenuRow
        isDanger
        leftSection={<SignOutIcon />}
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        {t('logOut')}
      </MobileMenuRow>
    </>
  );
}

export default MobileMenuSections;
