import { Paper, Stack, Text } from '@mantine/core';
import useComparison from '../hooks/useComparison';
import ComparisonContent from './ComparisonContent';

type Props = { initialIndex: number; forcePending?: boolean };

function ComparisonState({ initialIndex, forcePending }: Props) {
  const review = useComparison(initialIndex, true);

  return (
    <Paper withBorder radius="md" p="md" w={375} maw="100%">
      <Stack gap="md">
        <Text fw={600}>Сравнение тайтлов</Text>
        <ComparisonContent review={review} isPhone forcePending={forcePending} />
      </Stack>
    </Paper>
  );
}

export default ComparisonState;
