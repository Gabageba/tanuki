import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Button } from '@mantine/core';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';

type Stage = {
  opened: boolean;
  close: () => void;
  /** Для оверлеев, которыми управляет сам компонент через `setIsOpened`. */
  setOpened: Dispatch<SetStateAction<boolean>>;
};

type Props = {
  children: (stage: Stage) => ReactNode;
};

/** Сцена истории для модалки или drawer: открыта сразу, закрывается как в приложении, кнопка
 *  открывает снова. Пропсы у оверлеев разные (`opened`, `user | null`, …) — их собирает история. */
function ModalStage({ children }: Props) {
  const [opened, setOpened] = useState(true);

  return (
    <>
      <Button
        m="md"
        variant="default"
        leftSection={<ArrowSquareOutIcon />}
        onClick={() => setOpened(true)}
      >
        Открыть
      </Button>
      {children({ opened, close: () => setOpened(false), setOpened })}
    </>
  );
}

export default ModalStage;
