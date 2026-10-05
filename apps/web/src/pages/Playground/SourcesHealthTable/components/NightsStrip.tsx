import { Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { NIGHT_RESULT, type Night, type NightResult } from '../models';

type Props = {
  nights: Night[];
};

const getNightColor = (result: NightResult) => {
  switch (result) {
    case NIGHT_RESULT.PASSED:
      return `${STATUS_OK_COLOR}.6`;
    case NIGHT_RESULT.FAILED:
      return `${STATUS_DOWN_COLOR}.6`;
    case NIGHT_RESULT.NONE:
      return 'var(--mantine-color-default-border)';
  }
};

const getNightLabel = (result: NightResult) => {
  switch (result) {
    case NIGHT_RESULT.PASSED:
      return 'Проверка прошла';
    case NIGHT_RESULT.FAILED:
      return 'Проверка упала';
    case NIGHT_RESULT.NONE:
      return 'Не проверялся';
  }
};

/** Полоска последних 30 ночей, как на status-page: столбик на ночь, старые слева. Под ней —
 *  сколько упало. */
function NightsStrip({ nights }: Props) {
  const { formatDate } = useDateFormat();
  const failedCount = nights.filter((night) => night.result === NIGHT_RESULT.FAILED).length;
  const checkedCount = nights.filter((night) => night.result !== NIGHT_RESULT.NONE).length;

  return (
    <Stack gap={4}>
      <Group gap={2} wrap="nowrap">
        {nights.map((night) => (
          <Tooltip
            key={night.date}
            label={`${formatDate(night.date)}: ${getNightLabel(night.result)}`}
          >
            <Box flex={1} h={18} miw={2} bg={getNightColor(night.result)} bdrs={2} />
          </Tooltip>
        ))}
      </Group>
      <Text fz="xs" c="dimmed">
        {checkedCount === 0
          ? 'Нет данных'
          : failedCount === 0
            ? 'Падений нет'
            : `Падений: ${failedCount} из ${checkedCount}`}
      </Text>
    </Stack>
  );
}

export default NightsStrip;
