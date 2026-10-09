import { Button } from '@mantine/core';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';

/** «Повторить» — перезапрашивает всю выдачу; ответившие вернутся из кеша. */
function RetryButton() {
  return (
    <Button variant="default" size="xs" leftSection={<ArrowClockwiseIcon />} flex="none">
      Повторить
    </Button>
  );
}

export default RetryButton;
