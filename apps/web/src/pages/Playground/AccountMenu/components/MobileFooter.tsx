import type { ReactNode } from 'react';
import { Group, ThemeIcon } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import UserAvatar from './UserAvatar';
import FooterActiveButton from './FooterActiveButton';
import FooterIdleButton from './FooterIdleButton';
import { MENU_TRIGGER, type MenuTrigger, type MockUser } from '../models';

type Props = {
  user: MockUser;
  trigger: MenuTrigger;
};

/** Нижняя панель на узком экране: подпись только у активной кнопки — той, что открыла drawer. */
function MobileFooter({ user, trigger }: Props) {
  // Как AllElementsIcon из app/Layout — импортировать из app нельзя.
  const sourcesIcon = (
    <ThemeIcon size={20} bdrs="sm">
      <SquaresFourIcon />
    </ThemeIcon>
  );

  let menuIcon: ReactNode;
  let menuTitle: string;
  switch (trigger) {
    case MENU_TRIGGER.MENU:
    case MENU_TRIGGER.SOURCES:
      menuIcon = <ListIcon size={20} />;
      menuTitle = 'Меню';
      break;
    case MENU_TRIGGER.AVATAR_PROFILE:
      menuIcon = <UserAvatar user={user} size={22} />;
      menuTitle = 'Профиль';
      break;
    case MENU_TRIGGER.AVATAR_NAME:
      menuIcon = <UserAvatar user={user} size={22} />;
      menuTitle = user.username;
      break;
  }
  const isSourcesActive = trigger === MENU_TRIGGER.SOURCES;

  return (
    <Group
      h={HEADER_HEIGHT}
      px="xs"
      gap={4}
      wrap="nowrap"
      pos="absolute"
      bottom={0}
      left={0}
      right={0}
      bg="var(--mantine-color-body)"
      style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      {isSourcesActive ? (
        <FooterActiveButton icon={sourcesIcon} title="Все источники" />
      ) : (
        <FooterIdleButton icon={sourcesIcon} />
      )}
      <FooterIdleButton icon={<BookmarkSimpleIcon size={20} />} />
      <FooterIdleButton icon={<BellIcon size={20} />} />
      {isSourcesActive ? (
        <FooterIdleButton icon={menuIcon} />
      ) : (
        <FooterActiveButton icon={menuIcon} title={menuTitle} />
      )}
    </Group>
  );
}

export default MobileFooter;
