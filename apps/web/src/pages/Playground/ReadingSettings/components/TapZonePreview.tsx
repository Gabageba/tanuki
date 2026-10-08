import { Center, Flex, Paper, Text } from '@mantine/core';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

type Props = {
  tapZoneWidth: number;
};

const PREVIEW_HEIGHT = 52;

/**
 * Копия ReaderTapZonePreview из читалки (импорт из pages разрешён только в app).
 *
 * Схема экрана в тех же пропорциях, что и настоящие зоны. По одному проценту не понять ни куда
 * придётся тап, ни что середина вообще что-то делает, а по картинке видно сразу — и на мобилке
 * тоже, в отличие от подсветки поверх читалки, которую там закрывает сам drawer.
 */
function TapZonePreview({ tapZoneWidth }: Props) {
  return (
    <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
      <Flex h={PREVIEW_HEIGHT}>
        <Center
          w={`${tapZoneWidth}%`}
          bg="var(--mantine-primary-color-light)"
          c="var(--mantine-primary-color-filled)"
        >
          <CaretLeftIcon />
        </Center>
        <Center flex={1} bg="var(--mantine-color-default-hover)" miw={0}>
          <Text fz="xs" c="dimmed" truncate>
            Меню
          </Text>
        </Center>
        <Center
          w={`${tapZoneWidth}%`}
          bg="var(--mantine-primary-color-light)"
          c="var(--mantine-primary-color-filled)"
        >
          <CaretRightIcon />
        </Center>
      </Flex>
    </Paper>
  );
}

export default TapZonePreview;
