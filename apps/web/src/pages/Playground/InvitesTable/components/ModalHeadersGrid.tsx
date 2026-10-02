import { CloseButton, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  getAppModalTitle,
  getAppModalTone,
  getMessageToneCssColor,
  getMessageToneLabel,
} from '../lib';
import { APP_MODAL, type NeutralColor } from '../models';
import AppModalIcon from './AppModalIcon';

type Props = {
  neutral: NeutralColor;
};

/** Шапки всех модалок по карте M9 — так, как они выглядят в модалке: иконка тона, заголовок,
 *  крестик. Под шапкой — тон. */
function ModalHeadersGrid({ neutral }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm" maw={1100}>
      {Object.values(APP_MODAL).map((modal) => {
        const tone = getAppModalTone(modal);
        return (
          <Stack key={modal} gap={4}>
            <Paper
              withBorder
              radius="md"
              px="md"
              mih={60}
              display="flex"
              bg="var(--tanuki-color-surface)"
              style={{ alignItems: 'center' }}
            >
              <Group justify="space-between" wrap="nowrap" gap="sm" w="100%">
                <Group gap="xs" wrap="nowrap" miw={0}>
                  <AppModalIcon
                    modal={modal}
                    size={20}
                    color={getMessageToneCssColor(tone, neutral)}
                  />
                  <Text fz="md" truncate>
                    {getAppModalTitle(modal)}
                  </Text>
                </Group>
                <CloseButton aria-label="Закрыть" />
              </Group>
            </Paper>
            <Text fz="xs" c="dimmed" ff="monospace" tt="uppercase" pl="md">
              {getMessageToneLabel(tone)}
            </Text>
          </Stack>
        );
      })}
    </SimpleGrid>
  );
}

export default ModalHeadersGrid;
