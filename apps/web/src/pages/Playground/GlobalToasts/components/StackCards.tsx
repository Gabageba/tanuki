import { Button } from '@mantine/core';
import { ArrowCounterClockwiseIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { COPIED, ERROR, RESTORE, SECURITY, UPDATE } from '../mocks';
import { VIEWPORT_CONTEXT, type ViewportContext } from '../models';
import ToastCard from './ToastCard';

type Props = {
  hidden: string[];
  fourth: boolean;
  context: ViewportContext;
  onDismiss: (id: string) => void;
};

function StackCards({ hidden, fourth, context, onDismiss }: Props) {
  const getFirst = () => {
    switch (context) {
      case VIEWPORT_CONTEXT.APP:
      case VIEWPORT_CONTEXT.AUTH:
        return ERROR;
      case VIEWPORT_CONTEXT.READER:
        return fourth ? COPIED : ERROR;
    }
  };
  const first = getFirst();
  const getThird = () => {
    switch (context) {
      case VIEWPORT_CONTEXT.APP:
      case VIEWPORT_CONTEXT.AUTH:
        return fourth ? COPIED : UPDATE;
      case VIEWPORT_CONTEXT.READER:
        return SECURITY;
    }
  };
  const third = getThird();
  return (
    <>
      {!hidden.includes(first.id) && (
        <ToastCard item={first} onDismiss={() => onDismiss(first.id)} animate={fourth} />
      )}
      {!hidden.includes(RESTORE.id) && (
        <ToastCard
          item={RESTORE}
          onDismiss={() => onDismiss(RESTORE.id)}
          actions={
            <Button
              size="compact-sm"
              variant="subtle"
              leftSection={<ArrowCounterClockwiseIcon />}
              onClick={() => onDismiss(RESTORE.id)}
            >
              Вернуть закладку
            </Button>
          }
        />
      )}
      {!hidden.includes(third.id) && (
        <ToastCard
          item={third}
          onDismiss={() => onDismiss(third.id)}
          onOpen={third.id === SECURITY.id ? () => onDismiss(third.id) : undefined}
          animate={fourth}
          actions={
            third.id === UPDATE.id ? (
              <Button
                size="compact-sm"
                variant="subtle"
                leftSection={<ArrowsClockwiseIcon />}
                onClick={() => onDismiss(third.id)}
              >
                Обновить приложение
              </Button>
            ) : undefined
          }
        />
      )}
    </>
  );
}

export default StackCards;
