import { Text, type TextProps } from '@mantine/core';
import { Trans } from 'react-i18next';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  statusChangedAt: string | null;
  fz?: TextProps['fz'];
};

const MONO = { mono: <Text span inherit ff="monospace" /> };

/** «С 01.10.2026» под бейджем — слово обычным шрифтом, дата моноширинным, как «До …» у
 *  заблокированных. Статус ещё ни разу не менялся — строки нет. */
function StatusSince({ statusChangedAt, fz = 'xs' }: Props) {
  const { formatDateNumeric } = useDateFormat();

  if (!statusChangedAt) return null;

  return (
    <Text lh="tight" fz={fz} c="dimmed">
      <Trans
        i18nKey="sinceDateCapitalized"
        values={{ date: formatDateNumeric(statusChangedAt) }}
        components={MONO}
      />
    </Text>
  );
}

export default StatusSince;
