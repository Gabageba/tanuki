import { useState } from 'react';
import { Button, Stack } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import SandboxOnly from '../../components/SandboxOnly';
import { ERROR } from '../mocks';
import { VIEWPORT_CONTEXT } from '../models';
import LoginPreview from './LoginPreview';
import ToastCard from './ToastCard';
import ToastViewport from './ToastViewport';

type Props = { height: number; width?: number; label: string };

function AuthViewport({ height, width, label }: Props) {
  const [shown, setShown] = useState(true);
  return (
    <Stack gap="sm" w={width ?? 375} maw="100%">
      <ToastViewport
        mobile
        width={width}
        height={height}
        label={label}
        context={VIEWPORT_CONTEXT.AUTH}
        content={<LoginPreview onSubmit={() => setShown(true)} />}
      >
        {shown && (
          <ToastCard
            item={{ ...ERROR, title: 'Не удалось войти' }}
            onDismiss={() => setShown(false)}
          />
        )}
      </ToastViewport>
      <SandboxOnly>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<ArrowCounterClockwiseIcon />}
          onClick={() => setShown(true)}
        >
          Вернуть ошибку входа
        </Button>
      </SandboxOnly>
    </Stack>
  );
}

export default AuthViewport;
