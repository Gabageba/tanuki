import { Text } from '@mantine/core';
import type { TitleCardData } from '../../models';

type Props = Pick<TitleCardData, 'description'> & { lines?: number };

function TitleCardDescription({ description, lines = 4 }: Props) {
  if (!description) return null;
  return (
    <Text lh="tight" lineClamp={lines} c="dimmed">
      {description}
    </Text>
  );
}

export default TitleCardDescription;
