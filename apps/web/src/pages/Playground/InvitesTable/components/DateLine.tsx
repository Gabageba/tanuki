import { Group, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  label: string;
  date: string;
};

/** «Создано 02.10.2026» — подпись словом, дата моноширинно, как «Даты» у пользователей. */
function DateLine({ label, date }: Props) {
  const { formatDateNumeric } = useDateFormat();

  return (
    <Group gap={4} wrap="nowrap">
      <Text fz="xs" c="dimmed">
        {label}
      </Text>
      <Text fz="xs" ff="monospace">
        {formatDateNumeric(date)}
      </Text>
    </Group>
  );
}

export default DateLine;
