import { Paper, Stack } from '@mantine/core';
import type { ActionsPlacement, BuiltInStyle, TabCounter } from '../models';
import BookmarksPageMock from './BookmarksPageMock';
import PhoneFrame from './PhoneFrame';

type Props = {
  tabCounter: TabCounter;
  actionsPlacement: ActionsPlacement;
  builtInStyle?: BuiltInStyle;
};

/** Страница /bookmarks на десктопе и в рамке телефона. */
function PageDemo({ tabCounter, actionsPlacement, builtInStyle }: Props) {
  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <BookmarksPageMock
          tabCounter={tabCounter}
          actionsPlacement={actionsPlacement}
          builtInStyle={builtInStyle}
        />
      </Paper>
      <PhoneFrame>
        <BookmarksPageMock
          tabCounter={tabCounter}
          actionsPlacement={actionsPlacement}
          builtInStyle={builtInStyle}
          compact
        />
      </PhoneFrame>
    </Stack>
  );
}

export default PageDemo;
