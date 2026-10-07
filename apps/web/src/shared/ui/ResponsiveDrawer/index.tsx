import type { ReactNode } from 'react';
import { Box, Drawer, useMatches, type DrawerRootProps } from '@mantine/core';
import useSwipeToClose from './hooks/useSwipeToClose';
import {
  DRAWER_POSITION,
  getSheetHeight,
  SHEET_MAX_HEIGHT,
  SHEET_HEIGHT,
  type DrawerSide,
  type ResponsiveDrawerPosition,
  type SheetHeight,
} from './models';
import styles from './ResponsiveDrawer.module.scss';

type Props = Omit<DrawerRootProps, 'position' | 'size' | 'title' | 'children'> & {
  title: ReactNode;
  /** Сторона с `sm`; без неё drawer снизу на любой ширине. */
  side?: DrawerSide;
  /** Высота снизу. */
  height?: SheetHeight;
  /** Ширина сбоку; по умолчанию — `md` Mantine, 440px. */
  sideSize?: number;
  children: ReactNode;
};

/** Drawer приложения: на телефоне снизу, над нижней панелью, с ручкой и закрытием свайпом вниз;
 *  с `sm` — сбоку по смыслу. */
function ResponsiveDrawer({
  title,
  side,
  height = SHEET_HEIGHT.AUTO,
  sideSize,
  opened,
  onClose,
  children,
  ...others
}: Props) {
  const position = useMatches<ResponsiveDrawerPosition>({
    base: DRAWER_POSITION.BOTTOM,
    sm: side ?? DRAWER_POSITION.BOTTOM,
  });
  const isBottom = position === DRAWER_POSITION.BOTTOM;
  const [contentRef, swipeHandlers] = useSwipeToClose({ opened, isEnabled: isBottom, onClose });

  return (
    <Drawer.Root
      opened={opened}
      onClose={onClose}
      position={position}
      size={isBottom ? undefined : sideSize}
      vars={() => ({ root: { '--drawer-height': isBottom ? getSheetHeight(height) : undefined } })}
      {...others}
    >
      <Drawer.Overlay />
      <Drawer.Content
        ref={contentRef}
        className={styles.content}
        mah={isBottom ? SHEET_MAX_HEIGHT : undefined}
      >
        <Drawer.Header
          pt={isBottom ? 'lg' : undefined}
          className={isBottom ? styles.swipeArea : undefined}
          {...swipeHandlers}
        >
          {isBottom && (
            <Box
              pos="absolute"
              top={8}
              left={0}
              right={0}
              mx="auto"
              w={36}
              h={4}
              bdrs="xl"
              bg="var(--mantine-color-default-border)"
            />
          )}
          <Drawer.Title>{title}</Drawer.Title>
          <Drawer.CloseButton />
        </Drawer.Header>
        <Drawer.Body>{children}</Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}

export default ResponsiveDrawer;
