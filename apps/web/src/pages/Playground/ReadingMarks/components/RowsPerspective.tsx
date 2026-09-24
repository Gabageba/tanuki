import { useState } from 'react';
import { Box, Chip, Group, Stack, Text } from '@mantine/core';
import { UserIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoState } from '../models';
import { findPlacedMark, hasApproximateSymbol, hasQuestionBadge } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

const OWN_PERSPECTIVE = 'own';

/**
 * I: в строках нет ничего чужого. Над списком — чипы «Я» и источники; выбранный источник
 * становится точкой зрения: таймлайн показывает прогресс так, будто читали там, а узел на его
 * главе — его иконка. Сравнивать — переключая, а не разглядывая иконки.
 */
function RowsPerspective({ demo }: Props) {
  const [perspective, setPerspective] = useState<string>(OWN_PERSPECTIVE);
  const selected = demo.placed.find((item) => item.mark.source.id === perspective);
  const viewDemo = selected ? { ...demo, own: selected } : demo;

  return (
    <Stack gap="xs">
      <Chip.Group
        value={perspective}
        onChange={(value) => setPerspective(Array.isArray(value) ? OWN_PERSPECTIVE : value)}
      >
        <Group gap={6}>
          <Chip value={OWN_PERSPECTIVE} size="xs" icon={<UserIcon size={12} />}>
            Я
          </Chip>
          {demo.marks.map((mark) => {
            const placed = findPlacedMark(demo, mark);
            return (
              <Chip
                key={mark.source.id}
                value={mark.source.id}
                size="xs"
                disabled={!placed}
                icon={<SourceIcon id={mark.source.id} title={mark.source.title} size={12} />}
              >
                {placed && hasApproximateSymbol(demo.approximateStyle, placed.confidence) && '≈ '}
                {mark.source.title}
              </Chip>
            );
          })}
        </Group>
      </Chip.Group>
      {selected && (
        <Text fz={12} c="dimmed">
          Так выглядит прогресс на {selected.mark.source.title}. Своя отметка — пунктирным кругом.
        </Text>
      )}
      <DemoChaptersCard
        demo={demo}
        renderRow={(chapter, index) => {
          const isOwnChapter = selected && demo.own?.chapter.id === chapter.id;
          const isSelectedChapter = selected?.chapter.id === chapter.id;

          return (
            <DemoChapterRow
              demo={viewDemo}
              chapter={chapter}
              index={index}
              node={
                isSelectedChapter ? (
                  <Box pos="relative" h={18} className={styles.stackItem}>
                    <SourceIcon
                      id={selected.mark.source.id}
                      title={selected.mark.source.title}
                      size={18}
                    />
                    {hasQuestionBadge(demo.approximateStyle, selected.confidence) && (
                      <span className={styles.questionBadge}>?</span>
                    )}
                  </Box>
                ) : isOwnChapter ? (
                  <Box className={styles.ownGhostNode} />
                ) : undefined
              }
            />
          );
        }}
      />
    </Stack>
  );
}

export default RowsPerspective;
