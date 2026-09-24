import { Group, Text, UnstyledButton } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoState } from '../models';
import { getChapterMarks, hasApproximateSymbol, isDimmedApproximate } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * G: под названием главы — вторая строка мелким текстом: иконка и название каждого источника,
 * «≈» перед примерным. Строка выше только там, где отметки есть; иконки не надо угадывать.
 */
function RowsSubline({ demo }: Props) {
  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const marks = getChapterMarks(demo, chapter.id);
        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            below={
              marks.length > 0 && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <UnstyledButton>
                    <Group gap={10} style={{ rowGap: 2 }}>
                      {marks.map((item) => (
                        <Group key={item.mark.source.id} gap={4} wrap="nowrap">
                          <SourceIcon
                            id={item.mark.source.id}
                            title={item.mark.source.title}
                            size={14}
                            className={
                              isDimmedApproximate(demo.approximateStyle, item.confidence)
                                ? styles.approximate
                                : undefined
                            }
                          />
                          <Text fz={12} c="dimmed">
                            {hasApproximateSymbol(demo.approximateStyle, item.confidence) && '≈ '}
                            {item.mark.source.title}
                          </Text>
                        </Group>
                      ))}
                    </Group>
                  </UnstyledButton>
                </MarksPopover>
              )
            }
          />
        );
      }}
    />
  );
}

export default RowsSubline;
