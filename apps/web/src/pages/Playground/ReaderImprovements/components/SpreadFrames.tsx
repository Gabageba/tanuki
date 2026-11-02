import { SimpleGrid, Stack, Text } from '@mantine/core';
import SpreadMock from './SpreadMock';
import type { SpreadAlign } from '../models';

type Props = { align: SpreadAlign };
function SpreadFrames({ align }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }}>
      <Stack gap="xs">
        <Text fz="sm" c="dimmed">
          Компьютер · слева направо · разные высоты
        </Text>
        <SpreadMock align={align} />
        <Text fz="sm" c="dimmed">
          Справа налево · одинаковые высоты
        </Text>
        <SpreadMock align={align} rtl equal />
      </Stack>
      <Stack gap="xs" w="100%" maw={375}>
        <Text fz="sm" c="dimmed">
          Телефон · справа налево · разные высоты
        </Text>
        <SpreadMock align={align} rtl mobile />
        <Text fz="sm" c="dimmed">
          Слева направо · одинаковые высоты
        </Text>
        <SpreadMock align={align} equal mobile />
        <Text fz="sm" c="dimmed">
          Последняя непарная страница
        </Text>
        <SpreadMock align={align} single mobile />
      </Stack>
    </SimpleGrid>
  );
}
export default SpreadFrames;
