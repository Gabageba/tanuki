import { useState } from 'react';
import { Collapse, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import type { DemoState } from '../models';
import { getSummaryStackItems } from '../lib';
import MarkLine from './MarkLine';
import OwnContinue from './OwnContinue';
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

/** S4: стопка со стрелкой раскрывает список прямо в шапке — без поповера. */
function SummaryCollapse({ demo }: Props) {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <OwnContinue demo={demo}>
      <UnstyledButton onClick={() => setIsOpened((opened) => !opened)}>
        <Group gap={8} wrap="nowrap">
          <SourceStack
            items={getSummaryStackItems(demo)}
            approximateStyle={demo.approximateStyle}
            size={22}
            max={4}
          />
          <Text fz={12} c="dimmed">
            Другие источники
          </Text>
          {isOpened ? <CaretUpIcon size={12} /> : <CaretDownIcon size={12} />}
        </Group>
      </UnstyledButton>
      <Collapse expanded={isOpened}>
        <Paper withBorder p="sm">
          <Stack gap="sm">
            {demo.marks.map((mark) => (
              <MarkLine key={mark.source.id} demo={demo} mark={mark} withGoTo />
            ))}
          </Stack>
        </Paper>
      </Collapse>
    </OwnContinue>
  );
}

export default SummaryCollapse;
