import { Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  lastSeenAt: string | null;
};

/** Давность последнего входа — словами, как везде; ни разу не входил — прочерк. */
function LastSeen({ lastSeenAt }: Props) {
  const { formatRelative } = useDateFormat();

  if (!lastSeenAt) {
    return <Mdash c="dimmed" />;
  }

  return <Text fz="sm">{formatRelative(lastSeenAt)}</Text>;
}

export default LastSeen;
