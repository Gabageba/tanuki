import { useState, type ReactNode } from 'react';
import { Button } from '@mantine/core';
import SandboxOnly from '../../components/SandboxOnly';

type Props = {
  label: string;
  icon: ReactNode;
  /** Модалка по флагу: рисуется только открытой, чтобы форма каждый раз начиналась заново. */
  renderModal: (onClose: () => void) => ReactNode;
};

/** Кнопка-триггер модалки — обвязка песочницы. */
function ModalTrigger({ label, icon, renderModal }: Props) {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <SandboxOnly>
      <Button variant="default" leftSection={icon} onClick={() => setIsOpened(true)}>
        {label}
      </Button>
      {isOpened && renderModal(() => setIsOpened(false))}
    </SandboxOnly>
  );
}

export default ModalTrigger;
