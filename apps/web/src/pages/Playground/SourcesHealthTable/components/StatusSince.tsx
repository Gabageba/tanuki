import { Text, type TextProps } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  statusChangedAt: string | null;
  fz?: TextProps['fz'];
};

/** «С 01.10.2026» под бейджем — слово обычным шрифтом, дата моноширинным, как «До …» у
 *  заблокированных. Статус ещё ни разу не менялся — строки нет. */
function StatusSince({ statusChangedAt, fz = 'xs' }: Props) {
  const { formatDateNumeric } = useDateFormat();

  if (!statusChangedAt) return null;

  return (
    <Text fz={fz} c="dimmed">
      С{' '}
      <Text span inherit ff="monospace">
        {formatDateNumeric(statusChangedAt)}
      </Text>
    </Text>
  );
}

export default StatusSince;
