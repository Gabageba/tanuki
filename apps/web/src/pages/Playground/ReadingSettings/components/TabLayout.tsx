import { SimpleGrid, Stack } from '@mantine/core';
import {
  CHOICE_CONTROL,
  DISABLED_HINT,
  NUMBER_CONTROL,
  SETTINGS_COLUMN_WIDTH,
  TAB_LAYOUT,
  type DemoRenderProps,
  type ReaderConfig,
  type TabLayout as TabLayoutValue,
} from '../models';
import BookmarksPlaceholder from './BookmarksPlaceholder';
import ReaderGroups from './ReaderGroups';

type Props = DemoRenderProps & {
  layout: TabLayoutValue;
};

/** Для раскладки берём рекомендованные C1 + S1 + D1 — оси сравниваются по отдельности. */
const CONFIG: ReaderConfig = {
  choice: CHOICE_CONTROL.SEGMENTED,
  number: NUMBER_CONTROL.SLIDER,
  hint: DISABLED_HINT.DESCRIPTION,
};

/** Содержимое вкладки целиком: место под категории закладок и настройки читалки. */
function TabLayout({ layout, ...demoProps }: Props) {
  switch (layout) {
    case TAB_LAYOUT.ONE_BLOCK:
      return (
        <SimpleGrid cols={demoProps.narrow ? 1 : 2} style={{ alignItems: 'start' }}>
          <BookmarksPlaceholder />
          <ReaderGroups {...demoProps} config={CONFIG} isSingleBlock />
        </SimpleGrid>
      );
    case TAB_LAYOUT.SPLIT_BLOCKS:
      return (
        <SimpleGrid cols={demoProps.narrow ? 1 : 2} style={{ alignItems: 'start' }}>
          <BookmarksPlaceholder />
          <ReaderGroups {...demoProps} config={CONFIG} />
        </SimpleGrid>
      );
    case TAB_LAYOUT.ONE_COLUMN:
      return (
        <Stack maw={SETTINGS_COLUMN_WIDTH}>
          <BookmarksPlaceholder />
          <ReaderGroups {...demoProps} config={CONFIG} />
        </Stack>
      );
  }
}

export default TabLayout;
