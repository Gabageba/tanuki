import type { ReactNode } from 'react';
import { Button, Group, Progress, Stack, Text } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import MidDot from '@/shared/ui/MidDot';
import type { DemoState } from '../models';
import { getChapterIndex, getChapterLabel } from '../lib';

type Props = {
  demo: DemoState;
  rightSection?: ReactNode;
  /** Кнопка целиком, если вариант строит её сам (split-кнопка S5). */
  button?: ReactNode;
  children?: ReactNode;
};

/** «Продолжить» по своей отметке и полоса прогресса — как в шапке тайтла. children — сводка. */
function OwnContinue({ demo, rightSection, button, children }: Props) {
  const { own, chapters } = demo;
  const ownIndex = getChapterIndex(demo, own?.chapter);
  const readCount =
    ownIndex === -1
      ? 0
      : demo.direction === SORT_DIRECTION.DESC
        ? chapters.length - ownIndex
        : ownIndex + 1;

  return (
    <Stack gap={8} maw={320}>
      {button ?? (
        <Button component="div" rightSection={rightSection} justify="space-between" fullWidth>
          <span>
            Продолжить <MidDot /> {own ? getChapterLabel(own.chapter) : null}
          </span>
        </Button>
      )}
      {children}
      <Group gap={8}>
        <Progress value={(readCount / chapters.length) * 100} size="sm" flex={1} />
        <Text fz={12} c="terracotta" ff="monospace">
          {readCount} / {chapters.length}
        </Text>
      </Group>
    </Stack>
  );
}

export default OwnContinue;
