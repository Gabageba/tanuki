import { useState } from 'react';
import { Box, Button, Center, Group, Stack, Text, Title } from '@mantine/core';
import { CaretLeftIcon, EyeIcon, GearIcon } from '@phosphor-icons/react';
import StatusScreen from '@/shared/ui/StatusScreen';
import { LOCKED_TITLE } from '../mocks';
import { FRAME_HEIGHT_STYLE, LOCK_SCREEN, type LockScreen } from '../models';
import AgeConfirmModal from './AgeConfirmModal';
import MockCover from './MockCover';
import SandboxOnly from '../../components/SandboxOnly';

type Props = {
  screen: LockScreen;
};

/** Что открывается по клику на размытую карточку. */
function LockScreenDemo({ screen }: Props) {
  const [isConfirmOpened, setIsConfirmOpened] = useState(false);
  const [isShown, setIsShown] = useState(false);

  if (isShown) {
    return (
      <Center py="xl">
        <SandboxOnly>
          <Stack gap="xs" align="center">
            <Text c="dimmed" fz="sm" ta="center">
              18+ включён — здесь открылась бы страница тайтла.
            </Text>
            <Button
              variant="default"
              leftSection={<CaretLeftIcon />}
              onClick={() => setIsShown(false)}
            >
              Вернуть заглушку
            </Button>
          </Stack>
        </SandboxOnly>
      </Center>
    );
  }

  switch (screen) {
    case LOCK_SCREEN.CURRENT:
      return (
        <Box style={FRAME_HEIGHT_STYLE}>
          <StatusScreen
            code="403"
            title="Контент 18+ скрыт"
            description="Тайтлы 18+ скрыты в настройках"
          >
            <Group gap="sm">
              <Button variant="default" leftSection={<CaretLeftIcon />}>
                Назад
              </Button>
              <Button leftSection={<GearIcon />}>Настройки</Button>
            </Group>
          </StatusScreen>
        </Box>
      );
    case LOCK_SCREEN.WITH_COVER:
      return (
        <Center py="xl">
          <Stack gap="md" align="center" maw={420}>
            <Box w={140}>
              <MockCover title={LOCKED_TITLE} blurred />
            </Box>
            <Stack gap={8} align="center">
              <Title order={3} ta="center" lh={1.1}>
                {LOCKED_TITLE.name}
              </Title>
              <Text c="dimmed" fz="sm" ta="center">
                Это тайтл 18+, а показ такого контента выключен в настройках.
              </Text>
            </Stack>
            <Group gap="sm" justify="center">
              <Button variant="default" leftSection={<CaretLeftIcon />}>
                Назад
              </Button>
              <Button leftSection={<EyeIcon />} onClick={() => setIsConfirmOpened(true)}>
                Показать 18+
              </Button>
            </Group>
          </Stack>
          <AgeConfirmModal
            opened={isConfirmOpened}
            onClose={() => setIsConfirmOpened(false)}
            onConfirm={() => {
              setIsConfirmOpened(false);
              setIsShown(true);
            }}
          />
        </Center>
      );
  }
}

export default LockScreenDemo;
