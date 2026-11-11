import { useState } from 'react';
import { Button, Group, Notification, SimpleGrid, Stack, Text } from '@mantine/core';
import { ArrowCounterClockwiseIcon, ArrowsClockwiseIcon, DevicesIcon } from '@phosphor-icons/react';
import UndoToastMessage from '@/shared/ui/UndoToastMessage';
import { STATUS_DOWN_COLOR } from '@/shared/lib/palette';
import SandboxOnly from '../../components/SandboxOnly';

type Props = { singleColumn?: boolean };

function CurrentToastGallery({ singleColumn = false }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);
  const close = (id: string) => setHidden((current) => [...current, id]);
  return (
    <Stack gap="md">
      <SimpleGrid
        cols={singleColumn ? 1 : { base: 1, xl: 2 }}
        spacing="md"
        style={{ alignItems: 'start' }}
      >
        <Stack gap="sm" w={440} maw="100%">
          {!hidden.includes('result') && (
            <Notification
              onClose={() => close('result')}
              role="presentation"
              closeButtonProps={{ 'aria-label': 'Закрыть' }}
            >
              Ссылка скопирована
            </Notification>
          )}
          {!hidden.includes('error') && (
            <Notification
              onClose={() => close('error')}
              role="presentation"
              color="red"
              title="Ошибка"
              closeButtonProps={{ 'aria-label': 'Закрыть' }}
            >
              Нет соединения с сервером. Попробуйте позже.
            </Notification>
          )}
          {!hidden.includes('event') && (
            <Notification
              onClose={() => close('event')}
              role="presentation"
              color={STATUS_DOWN_COLOR}
              icon={<DevicesIcon size={18} />}
              title="Вход с нового устройства"
              style={{ cursor: 'pointer' }}
              closeButtonProps={{ 'aria-label': 'Закрыть' }}
              onClick={(event) => {
                if (event.target instanceof Element && !event.target.closest('button'))
                  close('event');
              }}
            >
              Chrome · macOS · Новосибирск
            </Notification>
          )}
        </Stack>
        <Stack gap="sm" w={440} maw="100%">
          {!hidden.includes('undo') && (
            <Notification
              onClose={() => close('undo')}
              role="presentation"
              closeButtonProps={{ 'aria-label': 'Закрыть' }}
            >
              <UndoToastMessage
                message="Убрано из закладок"
                actionLabel="Вернуть"
                onAction={() => close('undo')}
              />
            </Notification>
          )}
          {!hidden.includes('pwa') && (
            <Notification
              onClose={() => close('pwa')}
              role="presentation"
              color="gray"
              icon={<ArrowsClockwiseIcon size={18} />}
              title="Доступно обновление"
              closeButtonProps={{ 'aria-label': 'Закрыть' }}
            >
              <Stack gap="xs">
                <Text fz="sm">
                  Приложение перезагрузится. Скачивание глав продолжится автоматически.
                </Text>
                <Group justify="flex-end">
                  <Button
                    size="compact-sm"
                    variant="subtle"
                    leftSection={<ArrowsClockwiseIcon size={18} />}
                    onClick={() => close('pwa')}
                  >
                    Обновить приложение
                  </Button>
                </Group>
              </Stack>
            </Notification>
          )}
        </Stack>
      </SimpleGrid>
      <SandboxOnly>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<ArrowCounterClockwiseIcon />}
          onClick={() => setHidden([])}
        >
          Вернуть текущие тосты
        </Button>
      </SandboxOnly>
    </Stack>
  );
}

export default CurrentToastGallery;
