import { useState } from 'react';
import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  DeviceMobileIcon,
} from '@phosphor-icons/react';
import SandboxOnly from '../../components/SandboxOnly';
import { TEXT_SAMPLES, EVENT_TARGETS, INSTALL, RESTORE, RESTORE_TITLE, UPDATE } from '../mocks';
import type { ToastAppearance, ToastSample } from '../models';
import ToastCard from './ToastCard';
import { getActionButtonProps } from '../lib';

type Props = {
  appearance?: Partial<ToastAppearance>;
  width?: number;
  singleColumn?: boolean;
  samples?: ToastSample[];
};

function ToastGallery({
  appearance,
  width = 360,
  singleColumn = false,
  samples = TEXT_SAMPLES,
}: Props) {
  const actionButtonProps = getActionButtonProps(appearance);
  const [hidden, setHidden] = useState<string[]>([]);
  const [result, setResult] = useState(
    'Карточки не исчезают по таймеру: здесь сравниваем внешний вид.',
  );
  const close = (id: string) => setHidden((current) => [...current, id]);
  const act = (id: string, message: string) => {
    close(id);
    setResult(message);
  };

  return (
    <Stack gap="md">
      <SimpleGrid
        cols={singleColumn ? 1 : { base: 1, xl: 2 }}
        spacing="md"
        style={{ alignItems: 'start' }}
      >
        <Stack gap="sm" w={width} maw="100%">
          {samples
            .filter((item) => !hidden.includes(item.id))
            .map((item) => (
              <ToastCard
                key={item.id}
                item={item}
                appearance={appearance}
                onDismiss={() => close(item.id)}
                onOpen={
                  EVENT_TARGETS.has(item.id)
                    ? () => act(item.id, EVENT_TARGETS.get(item.id) ?? '')
                    : undefined
                }
              />
            ))}
        </Stack>
        <Stack gap="sm" w={width} maw="100%">
          {!hidden.includes(RESTORE.id) && (
            <ToastCard
              item={RESTORE}
              appearance={appearance}
              onDismiss={() => close(RESTORE.id)}
              actions={
                <Button
                  {...actionButtonProps}
                  leftSection={<ArrowCounterClockwiseIcon />}
                  onClick={() =>
                    act(RESTORE.id, 'Закладка возвращена; дополнительного тоста успеха нет.')
                  }
                >
                  Вернуть закладку
                </Button>
              }
            />
          )}
          {!hidden.includes(RESTORE_TITLE.id) && (
            <ToastCard
              item={RESTORE_TITLE}
              appearance={appearance}
              onDismiss={() => close(RESTORE_TITLE.id)}
              actions={
                <Button
                  {...actionButtonProps}
                  leftSection={<ArrowCounterClockwiseIcon />}
                  onClick={() =>
                    act(
                      RESTORE_TITLE.id,
                      'Тайтл возвращён в «Продолжить чтение». Прогресс сохранён.',
                    )
                  }
                >
                  Вернуть тайтл
                </Button>
              }
            />
          )}
          {!hidden.includes(UPDATE.id) && (
            <ToastCard
              item={UPDATE}
              appearance={appearance}
              onDismiss={() => close(UPDATE.id)}
              actions={
                <Button
                  {...actionButtonProps}
                  leftSection={<ArrowsClockwiseIcon />}
                  onClick={() => act(UPDATE.id, 'Запущено обновление приложения (демонстрация).')}
                >
                  Обновить приложение
                </Button>
              }
            />
          )}
          {!hidden.includes(INSTALL.id) && (
            <ToastCard
              item={INSTALL}
              appearance={appearance}
              onDismiss={() => close(INSTALL.id)}
              actions={
                <Button
                  {...actionButtonProps}
                  leftSection={<DeviceMobileIcon />}
                  onClick={() => act(INSTALL.id, 'Открыта установка приложения (демонстрация).')}
                >
                  Установить приложение
                </Button>
              }
            />
          )}
        </Stack>
      </SimpleGrid>
      <SandboxOnly>
        <Stack gap="xs">
          <Text fz="xs" c="dimmed" aria-live="polite">
            {result}
          </Text>
          <Group>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<ArrowCounterClockwiseIcon />}
              onClick={() => {
                setHidden([]);
                setResult('Все примеры возвращены.');
              }}
            >
              Вернуть все примеры
            </Button>
          </Group>
        </Stack>
      </SandboxOnly>
    </Stack>
  );
}

export default ToastGallery;
