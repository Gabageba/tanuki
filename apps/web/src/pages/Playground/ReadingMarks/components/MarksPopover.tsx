import type { ReactElement } from 'react';
import { Button, Popover, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { DemoMark, DemoState } from '../models';
import MarkLine from './MarkLine';

type Props = {
  demo: DemoState;
  marks: DemoMark[];
  /** Поповер строки главы: «Продолжить отсюда» переносит свою отметку на эту главу. */
  withContinue?: boolean;
  /** Поповер сводки: у каждой отметки кнопка «к главе». */
  withGoTo?: boolean;
  children: ReactElement;
};

function MarksPopover({ demo, marks, withContinue = false, withGoTo = false, children }: Props) {
  const { t } = useTranslation();

  return (
    <Popover position="bottom-start" shadow="md" withinPortal>
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown maw={340}>
        <Stack gap="sm">
          {marks.map((mark) => (
            <MarkLine key={mark.source.id} demo={demo} mark={mark} withGoTo={withGoTo} />
          ))}
          {withContinue && (
            <Button size="xs" variant="light">
              {t('continueFromHere')}
            </Button>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export default MarksPopover;
