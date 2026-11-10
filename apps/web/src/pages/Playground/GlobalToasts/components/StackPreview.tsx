import { useState } from 'react';
import { Button, Group, Stack } from '@mantine/core';
import { ArrowCounterClockwiseIcon, CopyIcon } from '@phosphor-icons/react';
import SandboxOnly from '../../components/SandboxOnly';
import { VIEWPORT_CONTEXT, type ViewportContext } from '../models';
import StackCards from './StackCards';
import ToastViewport from './ToastViewport';

type Props = { width: number; gap: number; context?: ViewportContext };

function StackPreview({ width, gap, context = VIEWPORT_CONTEXT.APP }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [fourth, setFourth] = useState(false);
  const close = (id: string) => setHidden((items) => [...items, id]);
  return (
    <Stack gap="md">
      <SandboxOnly>
        <Group gap="xs">
          <Button size="compact-sm" leftSection={<CopyIcon />} onClick={() => setFourth(true)}>
            Прислать четвёртый тост
          </Button>
          <Button
            size="compact-sm"
            variant="default"
            leftSection={<ArrowCounterClockwiseIcon />}
            onClick={() => {
              setFourth(false);
              setHidden([]);
            }}
          >
            Вернуть исходный стек
          </Button>
        </Group>
      </SandboxOnly>
      <Group gap="lg" align="flex-start">
        <ToastViewport
          label={`Десктоп · ${width} px · интервал ${gap} px`}
          toastWidth={width}
          context={context}
          gap={gap}
        >
          <StackCards hidden={hidden} fourth={fourth} context={context} onDismiss={close} />
        </ToastViewport>
        <ToastViewport label="Телефон · 375 px · тот же стек" mobile context={context} gap={gap}>
          <StackCards hidden={hidden} fourth={fourth} context={context} onDismiss={close} />
        </ToastViewport>
      </Group>
    </Stack>
  );
}

export default StackPreview;
