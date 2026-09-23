import { Center, Flex, Paper, Text } from '@mantine/core';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  tapZoneWidth: number;
};

const PREVIEW_HEIGHT = 52;

/**
 * Схема экрана в тех же пропорциях, что и настоящие зоны. По одному проценту не понять ни куда
 * придётся тап, ни что середина вообще что-то делает, а по картинке видно сразу — и на мобилке
 * тоже, в отличие от подсветки поверх читалки, которую там закрывает сам drawer.
 */
function ReaderTapZonePreview({ tapZoneWidth }: Props) {
  const { t } = useTranslation();

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
          <Text fz={10} c="dimmed" truncate>
            {t('menu')}
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

export default ReaderTapZonePreview;
