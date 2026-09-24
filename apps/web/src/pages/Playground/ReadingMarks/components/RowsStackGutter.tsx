import { Box, Flex, UnstyledButton } from '@mantine/core';
import { APPROXIMATE_STYLE, type DemoState } from '../models';
import { getChapterIndex, getChapterMarks, isApproximate, toStackItems } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/** Стопка из трёх иконок по 20px и скобка диапазона слева от неё. */
const GUTTER_WIDTH = 60;

/** На сколько глав в обе стороны может ошибиться примерное место — столько охватывает скобка. */
const RANGE_RADIUS = 1;

/**
 * A4: чужие места — в своей колонке слева от линии, главы — справа, таймлайн между ними как ось.
 * В стиле «Диапазон» примерное место охватывает скобкой соседние главы: «где-то здесь».
 */
function RowsStackGutter({ demo }: Props) {
  const isRange = demo.approximateStyle === APPROXIMATE_STYLE.RANGE;
  const rangeCenters = isRange
    ? demo.placed
        .filter((item) => isApproximate(item.confidence))
        .map((item) => getChapterIndex(demo, item.chapter))
    : [];
  const lastIndex = demo.chapters.length - 1;

  const isInRange = (index: number) =>
    rangeCenters.some((center) => Math.abs(index - center) <= RANGE_RADIUS);

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
            gutter={
              <Flex pos="relative" w={GUTTER_WIDTH} flex="none" align="center" justify="flex-end">
                {isInRange(index) && (
                  <Box
                    className={styles.rangeBracket}
                    data-start={index === 0 || !isInRange(index - 1) || undefined}
                    data-end={index === lastIndex || !isInRange(index + 1) || undefined}
                  />
                )}
                {marks.length > 0 && (
                  <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                    <UnstyledButton>
                      <SourceStack
                        items={toStackItems(marks)}
                        approximateStyle={isRange ? undefined : demo.approximateStyle}
                        size={20}
                        max={3}
                      />
                    </UnstyledButton>
                  </MarksPopover>
                )}
              </Flex>
            }
          />
        );
      }}
    />
  );
}

export default RowsStackGutter;
