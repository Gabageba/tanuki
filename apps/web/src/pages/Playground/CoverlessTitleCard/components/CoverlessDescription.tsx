import { Text } from '@mantine/core';
import type { CardDensity } from '../models';

type Props = { description: string | null; lines: CardDensity };

function CoverlessDescription({ description, lines }: Props) {
  if (!description || lines === 0) return null;
  return (
    <Text lh="tight" lineClamp={lines} c="dimmed">
      {description}
    </Text>
  );
}

export default CoverlessDescription;
