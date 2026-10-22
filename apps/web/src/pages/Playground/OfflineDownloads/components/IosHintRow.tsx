import { Button, Collapse, Group, List, Paper, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ClockIcon, DeviceMobileIcon, QuestionIcon } from '@phosphor-icons/react';

/** H8 — одна строка; «Как?» раскрывает шаги. */
function IosHintRow() {
  const [isOpened, { toggle }] = useDisclosure(false);

  return (
    <Paper withBorder radius="md" px="sm" py={6}>
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <DeviceMobileIcon
            size={18}
            color="var(--mantine-color-dimmed)"
            style={{ flex: 'none' }}
          />
          <Text fz="sm" flex={1} miw={0}>
            Установите Tanuki, чтобы скачанное не пропало
          </Text>
          <Button size="xs" variant="subtle" leftSection={<QuestionIcon />} onClick={toggle}>
            Как?
          </Button>
          <Button size="xs" variant="subtle" color="gray" leftSection={<ClockIcon />}>
            Не сейчас
          </Button>
        </Group>
        <Collapse expanded={isOpened}>
          <Stack gap={6} pl={26} pb={4}>
            <List type="ordered" fz="sm" spacing={2}>
              <List.Item>Нажмите «Поделиться» в панели Safari</List.Item>
              <List.Item>Выберите «На экран Домой»</List.Item>
            </List>
            <Text fz={12} c="dimmed">
              Без установки Safari удаляет скачанное, если не открывать сайт 7 дней
            </Text>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

export default IosHintRow;
