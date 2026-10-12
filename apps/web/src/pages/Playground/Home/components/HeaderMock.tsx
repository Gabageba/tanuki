import { Avatar, Box, Button, Group, Text } from '@mantine/core';
import { Link } from 'react-router';
import { BellIcon, BookmarkSimpleIcon, HouseIcon, PawPrintIcon } from '@phosphor-icons/react';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SearchInput from '@/shared/ui/SearchInput';
import {
  HEADER_HIGHLIGHT,
  HEADER_HOME,
  MOCK_PAGE,
  type HeaderHighlight,
  type HeaderHome,
  type MockPage,
} from '../models';
import HeaderIconButton from './HeaderIconButton';
import HeaderNavItem from './HeaderNavItem';
import HeaderSourceSelectMock from './HeaderSourceSelectMock';

type Props = {
  variant: HeaderHome;
  page: MockPage;
  /** Как выделена иконка своей страницы — подварианты H3. */
  highlight?: HeaderHighlight;
};

/** Шапка на десктопе в варианте оси H — повторяет app/Layout/Header: полоса во всю ширину с линией
 *  снизу, логотип, наклонный разделитель, выбор источника, поиск на всё свободное место, иконки и
 *  аватар 34 px. Логотип и разделитель — копии: импортировать из app нельзя. */
function HeaderMock({ variant, page, highlight = HEADER_HIGHLIGHT.LIGHT }: Props) {
  const isHome = page === MOCK_PAGE.HOME;

  return (
    <Box
      h={HEADER_HEIGHT}
      px="md"
      bg="var(--mantine-color-body)"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
    >
      <Group h="100%" justify="space-between" wrap="nowrap" gap="sm">
        <Group h="100%" gap="sm" wrap="nowrap">
          {/* Как LogoHorizontal: лапка акцентного цвета и название фирменным шрифтом. */}
          <Group gap="xs" wrap="nowrap">
            <PawPrintIcon size={24} weight="fill" color="var(--mantine-primary-color-filled)" />
            <Text
              lh={1}
              ff="var(--tanuki-font-brand)"
              fw={600}
              fz={16}
              style={{ letterSpacing: '-0.01em' }}
            >
              Tanuki
            </Text>
          </Group>
          <Box
            w={1}
            h={16}
            bg="var(--mantine-color-default-border)"
            style={{ transform: 'rotate(15deg)' }}
          />
          {variant === HEADER_HOME.BUTTON_LEFT && (
            <Button
              component={Link}
              to="/"
              variant={isHome ? 'light' : 'subtle'}
              color={isHome ? undefined : 'gray'}
              leftSection={<HouseIcon weight={isHome ? 'fill' : 'regular'} />}
            >
              Главная
            </Button>
          )}
          {variant === HEADER_HOME.ICON_LEFT && (
            <HeaderIconButton
              icon={HouseIcon}
              label="Главная"
              to="/"
              isActive={isHome}
              highlight={highlight}
            />
          )}
          {variant === HEADER_HOME.TABS ? (
            <Group h="100%" gap="xs" wrap="nowrap">
              <HeaderNavItem isActive={isHome}>
                <Button
                  component={Link}
                  to="/"
                  variant="subtle"
                  color={isHome ? undefined : 'gray'}
                  leftSection={<HouseIcon />}
                >
                  Главная
                </Button>
              </HeaderNavItem>
              <HeaderNavItem isActive={page === MOCK_PAGE.CATALOG}>
                <HeaderSourceSelectMock page={page} isSubtle />
              </HeaderNavItem>
            </Group>
          ) : (
            <HeaderSourceSelectMock page={page} />
          )}
        </Group>
        <Group h="100%" gap="sm" wrap="nowrap" flex={1} justify="end">
          <Box flex={1}>
            <SearchInput placeholder="Искать по всем источникам…" allowClear />
          </Box>
          <Group h="100%" gap={4} wrap="nowrap">
            {variant === HEADER_HOME.ICON_RIGHT && (
              <HeaderIconButton
                icon={HouseIcon}
                label="Главная"
                to="/"
                isActive={isHome}
                highlight={highlight}
              />
            )}
            <HeaderIconButton
              icon={BookmarkSimpleIcon}
              label="Закладки"
              to={ROUTE_PATHS.BOOKMARKS}
              isActive={page === MOCK_PAGE.BOOKMARKS}
              highlight={highlight}
              withDot
            />
            <HeaderIconButton
              icon={BellIcon}
              label="Уведомления"
              to={ROUTE_PATHS.NOTIFICATIONS}
              isActive={page === MOCK_PAGE.NOTIFICATIONS}
              highlight={highlight}
              withDot
            />
          </Group>
          <Avatar color={PRIMARY_COLOR} variant="outline" name="gabageba" size={34} />
        </Group>
      </Group>
    </Box>
  );
}

export default HeaderMock;
