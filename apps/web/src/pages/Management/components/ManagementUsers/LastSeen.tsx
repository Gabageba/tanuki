import { Text, type TextProps } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  lastSeenAt: string | null;
  fz?: TextProps['fz'];
};

/** Давность последнего входа — словами, как везде; ни разу не входил — прочерк. */
function LastSeen({ lastSeenAt, fz = 'sm' }: Props) {
  const { formatRelative } = useDateFormat();

  if (!lastSeenAt) {
    return <Mdash lh="tight" fz={fz} c="dimmed" />;
  }

  return (
    <Text lh="tight" fz={fz}>
      {formatRelative(lastSeenAt)}
    </Text>
  );
}

export default LastSeen;
