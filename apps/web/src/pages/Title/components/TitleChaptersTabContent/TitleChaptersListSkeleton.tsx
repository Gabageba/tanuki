import { Card, Divider } from '@mantine/core';
import { Fragment } from 'react';
import ChapterItemSkeleton from '@/shared/ui/ChaptersList/ChapterItemSkeleton';
import TitleChaptersSettings from './TitleChaptersSettings';

const SKELETON_ROWS = 8;

/**
 * Загрузка глав ветки: та же рамка с настройками (они от ответа не зависят и рисуются как есть),
 * строки — заглушки ChapterItem.
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
          <ChapterItemSkeleton />
        </Fragment>
      ))}
    </Card>
  );
}

export default TitleChaptersListSkeleton;
