import { SimpleGrid, Stack, Text } from '@mantine/core';
import SettingsMock from './SettingsMock';
import DrawerMock from './DrawerMock';
import type { SettingsLayout } from '../models';

type Props = { layout: SettingsLayout; swatches?: boolean };
const STATES = [
  { title: 'Вертикальный · по ширине', vertical: true, whole: false },
  { title: 'Вертикальный · целиком', vertical: true, whole: true },
  { title: 'Постраничный · по ширине', vertical: false, whole: false },
  { title: 'Постраничный · целиком', vertical: false, whole: true },
];
function SettingsFrames({ layout, swatches = false }: Props) {
  return (
    <Stack gap="xl">
      <Text fw={600}>Вкладка настроек</Text>
      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
        {STATES.map((state) => (
          <Stack key={state.title} gap="xs">
            <Text fz="sm" c="dimmed">
              {state.title}
            </Text>
            <SettingsMock
              layout={layout}
              swatches={swatches}
              initialVertical={state.vertical}
              initialFitWhole={state.whole}
            />
          </Stack>
        ))}
      </SimpleGrid>
      <Text fw={600}>Панель читалки · телефон 375 px</Text>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {STATES.map((state) => (
          <Stack key={state.title} gap="xs" w="100%" maw={375}>
            <Text fz="sm" c="dimmed">
              {state.title}
            </Text>
            <DrawerMock
              layout={layout}
              swatches={swatches}
              initialVertical={state.vertical}
              initialFitWhole={state.whole}
            />
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
export default SettingsFrames;
