import type { MouseEvent } from 'react';
import { UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import { getSummaryStackItems } from '../lib';
import MarksPopover from './MarksPopover';
import OwnContinue from './OwnContinue';
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

/** Тап по иконкам не должен нажать саму «Продолжить». */
const stopButtonClick = (event: MouseEvent) => event.stopPropagation();

/** S3: иконки прямо в кнопке «Продолжить», отдельной строки под ней нет. */
function SummaryButtonStack({ demo }: Props) {
  return (
    <OwnContinue
      demo={demo}
      rightSection={
        <MarksPopover demo={demo} marks={demo.marks} withGoTo>
          <UnstyledButton onClick={stopButtonClick}>
            <SourceStack
              items={getSummaryStackItems(demo)}
              approximateStyle={demo.approximateStyle}
              size={22}
              max={3}
            />
          </UnstyledButton>
        </MarksPopover>
      }
    />
  );
}

export default SummaryButtonStack;
