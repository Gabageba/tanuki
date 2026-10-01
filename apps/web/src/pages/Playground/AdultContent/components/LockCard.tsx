import { Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { CaretLeftIcon, EyeIcon } from '@phosphor-icons/react';
import { isBlurActive } from '../lib';
import { LOCKED_TITLE } from '../mocks';
import type { AdultSettings, LockTexts } from '../models';
import MockCover from './MockCover';
import SandboxOnly from '../../components/SandboxOnly';

type Props = {
  settings: AdultSettings;
  texts: LockTexts;
  onReveal: (patch: Partial<AdultSettings>, reveals: string) => void;
};

/** Заглушка S1 в уменьшенном виде — чтобы читать её текст рядом с настройками той же подачи. */
function LockCard({ settings, texts, onReveal }: Props) {
  if (!isBlurActive(settings)) {
    return (
      <SandboxOnly>
        <Text fz="sm" c="dimmed">
          Тайтл больше не скрыт — здесь открылась бы его страница.
        </Text>
      </SandboxOnly>
    );
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Group gap="md" wrap="nowrap" align="flex-start">
        <Box w={72} flex="none">
          <MockCover title={LOCKED_TITLE} blurred />
        </Box>
        <Stack gap="xs" miw={0}>
          <Text fw={600} lh={1.2}>
            {LOCKED_TITLE.name}
          </Text>
          <Text fz="sm" c="dimmed" lh={1.3}>
            {texts.description}
          </Text>
          <Group gap="xs">
            <Button size="xs" variant="default" leftSection={<CaretLeftIcon />}>
              Назад
            </Button>
            <Button
              size="xs"
              leftSection={<EyeIcon />}
              onClick={() => onReveal(texts.patch, texts.reveals)}
            >
              {texts.buttonLabel}
            </Button>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}

export default LockCard;
