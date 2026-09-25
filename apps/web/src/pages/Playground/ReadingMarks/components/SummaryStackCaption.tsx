import { Group, Text, UnstyledButton } from '@mantine/core';
import MidDot from '@/shared/ui/MidDot';
import type { DemoState } from '../models';
import {
  getChapterLabel,
  getFurthestPlacedMark,
  getSummaryStackItems,
  hasApproximateSymbol,
} from '../lib';
import MarksPopover from './MarksPopover';
import OwnContinue from './OwnContinue';
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

/** S2: стопка и подпись о главном — какой источник ушёл дальше своей отметки. */
function SummaryStackCaption({ demo }: Props) {
  const furthest = getFurthestPlacedMark(demo);

  return (
    <OwnContinue demo={demo}>
      <MarksPopover demo={demo} marks={demo.marks} withGoTo>
        <UnstyledButton>
          <Group gap={8} wrap="nowrap">
            <SourceStack
              items={getSummaryStackItems(demo)}
              approximateStyle={demo.approximateStyle}
              size={22}
              max={3}
            />
            <Text fz={12} c="dimmed" truncate="end">
              {furthest ? (
                <>
                  Дальше всех: {furthest.mark.source.title} <MidDot />{' '}
                  <Text span inherit ff="monospace">
                    {hasApproximateSymbol(demo.approximateStyle, furthest.confidence) && '≈ '}
                    {getChapterLabel(furthest.chapter)}
                  </Text>
                </>
              ) : (
                'Здесь вы дальше всех'
              )}
            </Text>
          </Group>
        </UnstyledButton>
      </MarksPopover>
    </OwnContinue>
  );
}

export default SummaryStackCaption;
