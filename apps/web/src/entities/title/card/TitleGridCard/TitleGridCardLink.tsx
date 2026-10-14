import { Group, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import { VIEW_MODE } from '@tanuki/contracts';
import NavigateToTitleCard from '../../NavigateToTitleCard';

type Props = {
  titleId: string;
  cover: ReactNode;
  meta: ReactNode;
  name: ReactNode;
  /** Поверх карточки лежат `actions` — мета-строке нужно место под кнопку справа. */
  withActions: boolean;
};

/** Отступ справа в мета-строке под кнопку `actions`. */
const ACTIONS_WIDTH = 28;

function TitleGridCardLink({ titleId, cover, meta, name, withActions }: Props) {
  return (
    <NavigateToTitleCard titleId={titleId} viewMode={VIEW_MODE.GRID}>
      <Stack gap={8}>
        {cover}
        <Stack gap={4}>
          {withActions ? (
            <Group pr={ACTIONS_WIDTH} wrap="nowrap">
              {meta}
            </Group>
          ) : (
            meta
          )}
          {name}
        </Stack>
      </Stack>
    </NavigateToTitleCard>
  );
}

export default TitleGridCardLink;
