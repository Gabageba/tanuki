import { Badge, Text } from '@mantine/core';
import type { DemoState } from '../models';
import { getChapterMarks, hasApproximateSymbol, isDimmedApproximate } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/** D: чип только с названиями источников — без иконок, всё читается без поповера. */
function RowsTextChip({ demo }: Props) {
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
            trailing={
              marks.length > 0 && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <Badge
                    component="button"
                    variant="light"
                    color="gray"
                    tt="none"
                    maw={{ base: 120, xs: 220 }}
                    flex="none"
                    style={{ cursor: 'pointer' }}
                  >
                    {marks.map((item, markIndex) => (
                      <Text
                        key={item.mark.source.id}
                        span
                        inherit
                        className={
                          isDimmedApproximate(demo.approximateStyle, item.confidence)
                            ? styles.dimmedText
                            : undefined
                        }
                      >
                        {markIndex > 0 && ' · '}
                        {hasApproximateSymbol(demo.approximateStyle, item.confidence) && '≈ '}
                        {item.mark.source.title}
                      </Text>
                    ))}
                  </Badge>
                </MarksPopover>
              )
            }
          />
        );
      }}
    />
  );
}

export default RowsTextChip;
