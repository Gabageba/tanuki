import { Card, Group, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import SourceTitleSkeleton from '../SourceTitle/SourceTitleSkeleton';

/** Заглушка SourceCard: заголовок источника, локаль и статус — плашками. */
function SourceCardSkeleton() {
  return (
    <Card withBorder py={6}>
      <Group gap="xs" wrap="nowrap">
        <SourceTitleSkeleton />
        <Stack gap={8} align="flex-end" flex="none">
          {/* Высоту строки локали задаёт флаг — fz 20 при lh tight. */}
          <TextSkeleton fz={20} lh="tight" w={48} />
          {/* Как текст StatusIndicator — fz 14 при lh tight. */}
          <TextSkeleton fz="sm" lh="tight" w={64} visibleFrom="xxs" />
        </Stack>
      </Group>
    </Card>
  );
}

export default SourceCardSkeleton;
