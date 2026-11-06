import { Group } from '@mantine/core';
import type { ViewMode } from '@tanuki/contracts';
import DemoSection from '../../components/DemoSection';
import {
  DESKTOP_WIDTH,
  MOBILE_WIDTH,
  type BookmarkExample,
  type UpdateVariantDemo,
} from '../models';
import BookmarkUpdatesFrame from './BookmarkUpdatesFrame';

type Props = { variant: UpdateVariantDemo; examples: BookmarkExample[]; viewMode: ViewMode };

function BookmarkUpdatesComparison({ variant, examples, viewMode }: Props) {
  return (
    <DemoSection {...variant}>
      <Group align="flex-start" gap="xl">
        <BookmarkUpdatesFrame
          examples={examples}
          variant={variant.id}
          viewMode={viewMode}
          width={DESKTOP_WIDTH}
          columns={3}
          caption="Десктоп · 560 px"
        />
        <BookmarkUpdatesFrame
          examples={examples}
          variant={variant.id}
          viewMode={viewMode}
          width={MOBILE_WIDTH}
          columns={2}
          caption="Телефон · 320 px"
        />
      </Group>
    </DemoSection>
  );
}

export default BookmarkUpdatesComparison;
