import { Box, Tooltip, UnstyledButton } from '@mantine/core';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoState } from '../models';
import { getChapterLabel, getChapterMarks, getTimelineZone, hasApproximateMarks } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * P: таймлайн как корешок книги. Кругов нет — у левого края толстая полоса: залита до своей
 * главы, светлее — до самой дальней чужой. Из края торчат закладки-ленточки цвета источника:
 * своя — акцентная, чужие — с иконкой. Примерное место — ленточка полупрозрачная, с пунктиром.
 */
function RowsRibbons({ demo }: Props) {
  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const marks = getChapterMarks(demo, chapter.id);
        const [freshest] = marks;
        const isOwn = demo.own?.chapter.id === chapter.id;

        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            timeline={
              <Box pos="relative" w={34} flex="none">
                <Box
                  className={styles.spine}
                  data-zone={getTimelineZone(demo, index)}
                  data-first={index === 0 || undefined}
                  data-last={index === demo.chapters.length - 1 || undefined}
                />
                {isOwn && (
                  <Tooltip label={`Вы: ${getChapterLabel(chapter)}`} withinPortal>
                    <Box className={styles.ribbon} data-own>
                      <BookmarkSimpleIcon size={12} weight="fill" />
                    </Box>
                  </Tooltip>
                )}
                {freshest && (
                  <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                    <UnstyledButton
                      className={styles.ribbon}
                      data-shifted={isOwn || undefined}
                      data-approximate={hasApproximateMarks(marks) || undefined}
                      style={{ '--ribbon-color': freshest.mark.source.color }}
                    >
                      <SourceIcon
                        id={freshest.mark.source.id}
                        title={freshest.mark.source.title}
                        size={14}
                      />
                      {marks.length > 1 && (
                        <Box component="span" ff="monospace" className={styles.ribbonCount}>
                          +{marks.length - 1}
                        </Box>
                      )}
                    </UnstyledButton>
                  </MarksPopover>
                )}
              </Box>
            }
          />
        );
      }}
    />
  );
}

export default RowsRibbons;
