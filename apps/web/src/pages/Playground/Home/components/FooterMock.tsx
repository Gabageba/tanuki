import { Group, Paper, ThemeIcon } from '@mantine/core';
import {
  BellIcon,
  BookmarkSimpleIcon,
  HouseIcon,
  ListIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react';
import { SOURCE_ID } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import FooterActiveButton from '../../AccountMenu/components/FooterActiveButton';
import FooterIdleButton from '../../AccountMenu/components/FooterIdleButton';
import { MOCK_PAGE, type MockPage } from '../models';

type Props = {
  /** B1 — «Главная» первой; B0 — как сейчас. */
  withHome: boolean;
  page: MockPage;
};

/** Нижняя панель на телефоне: подписана только активная кнопка. Без «Главной» на `/` не горит
 *  ничего — источники на главной не активны. */
function FooterMock({ withHome, page }: Props) {
  const isHome = page === MOCK_PAGE.HOME;
  const sourcesIcon = isHome ? (
    <ThemeIcon size={20} bdrs="sm">
      <SquaresFourIcon />
    </ThemeIcon>
  ) : (
    <SourceIcon id={SOURCE_ID.REMANGA} title="Реманга" size={20} />
  );

  return (
    <Paper withBorder radius="md" px="xs" h={HEADER_HEIGHT} w={375} maw="100%">
      <Group h="100%" gap={4} wrap="nowrap">
        {withHome &&
          (isHome ? (
            <FooterActiveButton icon={<HouseIcon size={20} weight="fill" />} title="Главная" />
          ) : (
            <FooterIdleButton icon={<HouseIcon size={20} />} />
          ))}
        {isHome ? (
          <FooterIdleButton icon={sourcesIcon} />
        ) : (
          <FooterActiveButton icon={sourcesIcon} title="Реманга" />
        )}
        <FooterIdleButton icon={<BookmarkSimpleIcon size={20} />} />
        <FooterIdleButton icon={<BellIcon size={20} />} />
        <FooterIdleButton icon={<ListIcon size={20} />} />
      </Group>
    </Paper>
  );
}

export default FooterMock;
