import { Group, UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import { getSummaryStackItems } from '../lib';
import MarksPopover from './MarksPopover';
import OwnContinue from './OwnContinue';
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

/** S1: под «Продолжить» — только стопка иконок, всё остальное — в поповере по тапу. */
function SummaryStackPopover({ demo }: Props) {
  return (
    <OwnContinue demo={demo}>
      <Group>
        <MarksPopover demo={demo} marks={demo.marks} withGoTo>
          <UnstyledButton>
            <SourceStack
              items={getSummaryStackItems(demo)}
              approximateStyle={demo.approximateStyle}
              size={24}
              max={4}
            />
          </UnstyledButton>
        </MarksPopover>
      </Group>
    </OwnContinue>
  );
}

export default SummaryStackPopover;
