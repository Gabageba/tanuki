import { Text } from '@mantine/core';
import type { TitleCardData } from '../../models';

type Props = Pick<TitleCardData, 'description'>;

function TitleCardDescription({ description }: Props) {
  if (!description) return null;
  return (
    <Text lh="tight" lineClamp={4} c="dimmed">
      {description}
    </Text>
  );
}

export default TitleCardDescription;
