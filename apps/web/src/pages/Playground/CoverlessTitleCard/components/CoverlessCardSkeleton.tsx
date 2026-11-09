import { Card, Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { CARD_DENSITY, type CardDensity } from '../models';

type Props = { density: CardDensity };

function CoverlessCardSkeleton({ density }: Props) {
  return (
    <Card p="sm" withBorder>
      <Stack gap={8}>
        <Group gap={8} wrap="nowrap" align="flex-start">
          <Skeleton h={20} w={38} />
          <TextSkeleton lh="tight" flex={1} lines={2} />
          <Skeleton h={26} w={70} />
        </Group>
        {density !== CARD_DENSITY.COMPACT && <TextSkeleton lh="tight" lines={density} />}
        <Group justify="space-between" wrap="nowrap" gap={8}>
          <Group gap={6} wrap="nowrap">
            <Skeleton h={20} w={76} />
            <Skeleton h={20} w={58} />
          </Group>
          <TextSkeleton lh="tight" w={52} />
        </Group>
      </Stack>
    </Card>
  );
}

export default CoverlessCardSkeleton;
