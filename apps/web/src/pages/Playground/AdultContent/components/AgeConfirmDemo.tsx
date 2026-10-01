import { useState } from 'react';
import { Button } from '@mantine/core';
import { EyeIcon } from '@phosphor-icons/react';
import AgeConfirmModal from './AgeConfirmModal';
import SandboxOnly from '../../components/SandboxOnly';

/** Модалка подтверждения возраста сама по себе. */
function AgeConfirmDemo() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <SandboxOnly>
        <Button leftSection={<EyeIcon />} onClick={() => setOpened(true)}>
          Открыть подтверждение
        </Button>
      </SandboxOnly>
      <AgeConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        onConfirm={() => setOpened(false)}
      />
    </>
  );
}

export default AgeConfirmDemo;
