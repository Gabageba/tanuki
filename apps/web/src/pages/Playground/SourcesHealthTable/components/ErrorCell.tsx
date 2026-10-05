import { Text } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  error: string | null;
};

/** Две строки ошибки серым; полный текст и копирование — в карточке. */
function ErrorCell({ error }: Props) {
  if (!error) return <Mdash c="dimmed" fz="sm" />;

  return (
    <Text fz="xs" c="dimmed" ff="monospace" lineClamp={2} style={{ wordBreak: 'break-all' }}>
      {error}
    </Text>
  );
}

export default ErrorCell;
