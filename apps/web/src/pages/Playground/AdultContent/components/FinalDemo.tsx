import { useState } from 'react';
import { Box, Button, Center, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { CaretLeftIcon, GearIcon } from '@phosphor-icons/react';
import StatusScreen from '@/shared/ui/StatusScreen';
import { DEFAULT_SETTINGS, EXAMPLE_TITLES } from '../mocks';
import {
  BLUR_STYLE,
  FRAME_HEIGHT_STYLE,
  SETTINGS_COLUMN_WIDTH,
  type AdultSettings,
} from '../models';
import AgeConfirmModal from './AgeConfirmModal';
import DeviceFrames from './DeviceFrames';
import FinalSettingsBlock from './FinalSettingsBlock';
import MockGridCard from './MockGridCard';
import SandboxOnly from '../../components/SandboxOnly';

type PendingReveal = {
  patch: Partial<AdultSettings>;
  reveals: string;
};

/** Выбранная комбинация целиком: настройки, каталог и страница тайтла 18+ на общем состоянии. */
function FinalDemo() {
  const [settings, setSettings] = useState<AdultSettings>(DEFAULT_SETTINGS);
  const [pending, setPending] = useState<PendingReveal | null>(null);

  const handleChange = (patch: Partial<AdultSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  const settingsBlock = (
    <FinalSettingsBlock
      settings={settings}
      onChange={handleChange}
      onReveal={(patch, reveals) => setPending({ patch, reveals })}
    />
  );

  const lockScreen = settings.hideAdultTitles ? (
    <Box style={FRAME_HEIGHT_STYLE}>
      <StatusScreen
        code="403"
        title="Контент 18+ скрыт"
        description="Тайтлы 18+ на обычных источниках скрыты в настройках"
      >
        <Group gap="sm">
          <Button variant="default" leftSection={<CaretLeftIcon />}>
            Назад
          </Button>
          <Button leftSection={<GearIcon />}>Настройки</Button>
        </Group>
      </StatusScreen>
    </Box>
  ) : (
    <Center py="xl">
      <SandboxOnly>
        <Text fz="sm" c="dimmed">
          Тайтлы 18+ не размыты — здесь открылась бы страница тайтла.
        </Text>
      </SandboxOnly>
    </Center>
  );

  return (
    <Stack gap="xl">
      <Stack gap={6}>
        <Text fw={600}>Настройки → Общие</Text>
        <DeviceFrames desktopWidth={SETTINGS_COLUMN_WIDTH} render={() => settingsBlock} />
      </Stack>

      <Stack gap={6}>
        <Text fw={600}>Каталог</Text>
        <SimpleGrid cols={3} spacing="sm" w={480} maw="100%">
          {EXAMPLE_TITLES.map((title) => (
            <MockGridCard
              key={title.id}
              title={title}
              blurred={title.isAdult && settings.hideAdultTitles}
              blurStyle={BLUR_STYLE.ICON}
            />
          ))}
        </SimpleGrid>
      </Stack>

      <Stack gap={6}>
        <Text fw={600}>Клик по тайтлу 18+ с обычного источника</Text>
        <DeviceFrames desktopWidth={760} render={() => lockScreen} />
      </Stack>

      <AgeConfirmModal
        opened={!!pending}
        reveals={pending?.reveals}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) handleChange(pending.patch);
          setPending(null);
        }}
      />
    </Stack>
  );
}

export default FinalDemo;
