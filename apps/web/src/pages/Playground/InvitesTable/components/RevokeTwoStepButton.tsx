import { useState } from 'react';
import { Button } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { WarningIcon, XIcon } from '@phosphor-icons/react';
import { REVOKE_CONFIRM_TIMEOUT_MS } from '../models';

type Props = {
  onConfirm: () => void;
};

/** R2: первое нажатие взводит кнопку, второе в течение трёх секунд — отзывает. */
function RevokeTwoStepButton({ onConfirm }: Props) {
  const [isArmed, setIsArmed] = useState(false);
  const { start, clear } = useTimeout(() => setIsArmed(false), REVOKE_CONFIRM_TIMEOUT_MS);

  const handleClick = () => {
    if (isArmed) {
      clear();
      onConfirm();
      return;
    }
    setIsArmed(true);
    start();
  };

  return (
    <Button
      variant={isArmed ? 'filled' : 'muted'}
      color="red"
      leftSection={isArmed ? <WarningIcon /> : <XIcon />}
      onClick={handleClick}
    >
      {isArmed ? 'Точно отозвать?' : 'Отозвать'}
    </Button>
  );
}

export default RevokeTwoStepButton;
