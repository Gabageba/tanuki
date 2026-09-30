import { Button, Paper } from '@mantine/core';
import { CaretLeftIcon, SignInIcon } from '@phosphor-icons/react';
import StatusScreen from '@/shared/ui/StatusScreen';
import { getLockReasonAction, getLockReasonDescription, getLockReasonTitle } from '../lib';
import type { LockReason } from '../models';

type Props = {
  reason: LockReason;
};

/** Экран вместо страницы источника или тайтла, которые без входа не открыть. */
function SourceLockedDemo({ reason }: Props) {
  return (
    <Paper withBorder radius="md" px="md">
      <StatusScreen
        code="403"
        title={getLockReasonTitle(reason)}
        description={getLockReasonDescription(reason)}
      >
        <Button variant="default" leftSection={<CaretLeftIcon />}>
          Назад
        </Button>
        <Button leftSection={<SignInIcon />}>{getLockReasonAction(reason)}</Button>
      </StatusScreen>
    </Paper>
  );
}

export default SourceLockedDemo;
