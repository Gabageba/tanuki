import { Box, Flex, UnstyledButton } from '@mantine/core';
import { CircleIcon } from '@phosphor-icons/react';
import type { DemoState } from '../models';
import {
  getChapterMarks,
  getCompactApproximateStyle,
  getMaxChapterMarkCount,
  toStackItems,
} from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksBranch from './MarksBranch';
import MarksPopover from './MarksPopover';
import SourceCounterIcon from './SourceCounterIcon';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

const ROW_GAP = 12;
const ICON_SIZE = 20;
const NODE_SIZE = 18;

/**
 * A2e: A2a с короткой веткой — только через отступ строки, как в A2b, — и своей отметкой в кольце,
 * как узел в R: круг выбранной главы обведён цветом акцента.
 */
function RowsBranchFinal({ demo }: Props) {
  const hasSlot = getMaxChapterMarkCount(demo) > 0;
  const approximateStyle = getCompactApproximateStyle(demo.approximateStyle);

  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const marks = getChapterMarks(demo, chapter.id);
        const isOwn = demo.own?.chapter.id === chapter.id;
        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            node={
              isOwn ? (
                <Box w={NODE_SIZE} h={NODE_SIZE} className={styles.ownNodeRing}>
                  <CircleIcon
                    size={NODE_SIZE}
                    weight="fill"
                    color="var(--mantine-primary-color-filled)"
                  />
                </Box>
              ) : undefined
            }
            leading={
              hasSlot && (
                <Flex w={ICON_SIZE} flex="none" align="center">
                  {marks.length > 0 && (
                    <>
                      <MarksBranch marks={marks} width={ROW_GAP} ml={-ROW_GAP} />
                      <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                        <UnstyledButton>
                          <SourceCounterIcon
                            items={toStackItems(marks)}
                            approximateStyle={approximateStyle}
                            size={ICON_SIZE}
                          />
                        </UnstyledButton>
                      </MarksPopover>
                    </>
                  )}
                </Flex>
              )
            }
          />
        );
      }}
    />
  );
}

export default RowsBranchFinal;
