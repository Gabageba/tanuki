import { SimpleGrid, Stack, Text } from '@mantine/core';
import { DEFAULT_MOCK_MODE, getMockSettings } from '../mocks';
import {
  CHOICE_CONTROL,
  DISABLED_HINT,
  MOBILE_FRAME_WIDTH,
  NUMBER_CONTROL,
  TAB_NAMING,
  TAB_WIDTH,
  type ReaderConfig,
} from '../models';
import ReaderDemo from './ReaderDemo';
import ReaderGroups from './ReaderGroups';
import TabsStrip from './TabsStrip';

const CONFIG: ReaderConfig = {
  choice: CHOICE_CONTROL.SELECT,
  number: NUMBER_CONTROL.DRAWER_DESCRIBED,
  hint: DISABLED_HINT.DESCRIPTION,
};

/**
 * Итог: вкладка «Читалка» (N4 — «Библиотека» появится вместе с категориями закладок) с тремя
 * блоками в сетке (L2), выбор режима и масштаба Select'ом (C2), числа как в drawer (S0) с
 * описанием, неактивные строки с причиной в описании (D1).
 */
function FinalDemo() {
  return (
    <Stack gap="lg">
      <ReaderDemo
        initialSettings={getMockSettings(DEFAULT_MOCK_MODE)}
        desktopWidth={TAB_WIDTH}
        render={(props) => (
          <Stack gap="lg">
            <TabsStrip naming={TAB_NAMING.READER} isScrollable />
            <SimpleGrid cols={props.narrow ? 1 : 2} style={{ alignItems: 'start' }}>
              <ReaderGroups {...props} config={CONFIG} />
            </SimpleGrid>
          </Stack>
        )}
      />
      <Stack gap={6} w={MOBILE_FRAME_WIDTH} maw="100%">
        <Text fz={12} c="dimmed">
          Позже, вместе с «Библиотекой», — телефон: вкладки в одну строку, прокрутка вбок
        </Text>
        <TabsStrip naming={TAB_NAMING.TWO_TABS} isScrollable />
      </Stack>
    </Stack>
  );
}

export default FinalDemo;
