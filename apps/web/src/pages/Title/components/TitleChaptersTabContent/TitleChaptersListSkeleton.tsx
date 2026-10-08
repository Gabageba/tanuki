import { Card, Divider, Group, Skeleton } from '@mantine/core';
import { Fragment } from 'react';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleChaptersSettings from './TitleChaptersSettings';

const SKELETON_ROWS = 8;

/**
 * Загрузка глав ветки: та же рамка с настройками (они от ответа не зависят и рисуются как есть),
 * строки — узел линии прочитанного, номер с названием, дата и кнопка скачивания плашками.
 */
function TitleChaptersListSkeleton() {
  return (
    <Card withBorder padding={0} bg="transparent">
      <Card.Section withBorder px="sm" py="xs">
        <TitleChaptersSettings />
      </Card.Section>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <Fragment key={index}>
          {index > 0 && <Divider />}
          <Group gap="md" wrap="nowrap" pl="md" pr="md" py="xs">
            <Skeleton w={18} h={18} circle flex="none" />
            <TextSkeleton flex={1} w="auto" />
            <TextSkeleton fz={12} w={72} />
            <Skeleton w={28} h={28} flex="none" />
          </Group>
        </Fragment>
      ))}
    </Card>
  );
}

export default TitleChaptersListSkeleton;
