import { useContext, useState } from 'react';
import { ActionIcon, Box, ScrollArea } from '@mantine/core';
import { XIcon } from '@phosphor-icons/react';
import { PANEL_LAYOUT, SETTINGS_LAYOUT, SPREAD_ALIGN } from '../models';
import { RESULT_CONTEXT } from '../resultContext';
import DrawerMock from './DrawerMock';
import PanelMock from './PanelMock';
import SpreadMock from './SpreadMock';

type Props = { mobile?: boolean };
function ResultReader({ mobile = false }: Props) {
  const settings = useContext(RESULT_CONTEXT);
  const [opened, setOpened] = useState(false);
  if (!settings) return null;
  const [mode] = settings.mode;
  const [direction] = settings.direction;
  const [pages] = settings.pages;
  const [background] = settings.background;
  const [brightness] = settings.brightness;
  const single = mode === 'vertical' || pages === 'single';
  return (
    <Box pos="relative" style={{ overflow: 'hidden' }}>
      <PanelMock
        layout={PANEL_LAYOUT.CONTROLS}
        mobile={mobile}
        single={single}
        page={3}
        onSettings={() => setOpened(true)}
      >
        <SpreadMock
          align={SPREAD_ALIGN.TOP}
          mobile={mobile}
          height={mobile ? 320 : 400}
          rtl={direction === 'rtl'}
          single={single}
          vertical={mode === 'vertical'}
          background={background}
          brightness={brightness}
        />
      </PanelMock>
      {opened && (
        <Box
          pos="absolute"
          top={0}
          right={0}
          bottom={0}
          w={mobile ? '100%' : 375}
          maw="100%"
          bg="var(--mantine-color-body)"
          style={{ zIndex: 1, boxShadow: 'var(--mantine-shadow-lg)' }}
        >
          <ActionIcon
            pos="absolute"
            top="md"
            right="md"
            variant="subtle"
            color="gray"
            aria-label="Закрыть настройки читалки"
            onClick={() => setOpened(false)}
            style={{ zIndex: 1 }}
          >
            <XIcon />
          </ActionIcon>
          <ScrollArea h="100%">
            <DrawerMock layout={SETTINGS_LAYOUT.GROUP} initialVertical={false} />
          </ScrollArea>
        </Box>
      )}
    </Box>
  );
}
export default ResultReader;
