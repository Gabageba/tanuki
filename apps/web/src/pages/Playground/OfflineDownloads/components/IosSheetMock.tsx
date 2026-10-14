import { Box, Button, Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import {
  BookOpenIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  ExportIcon,
  PlusSquareIcon,
} from '@phosphor-icons/react';
import styles from '../OfflineDownloads.module.scss';

/** H4 — нижний лист над панелью Safari, стрелка указывает на «Поделиться». Панель Safari —
 *  нарисована для контекста. */
function IosSheetMock() {
  return (
    <Stack gap={0} h={520} justify="space-between">
      <Stack gap="sm" p="md">
        <Skeleton h={18} w="60%" animate={false} />
        <Skeleton h={180} animate={false} radius="md" />
      </Stack>
      <Box px="sm" pb={18}>
        <Paper withBorder shadow="md" radius="lg" p="md" pos="relative">
          <Stack gap="sm">
            <Text fw={600}>Установите Tanuki на экран Домой</Text>
            <Text fz={13} c="dimmed">
              Без установки Safari удаляет скачанное, если не открывать сайт 7 дней. Нажмите
              «Поделиться» внизу, затем «На экран Домой» <PlusSquareIcon size={13} />.
            </Text>
            <Button size="xs" leftSection={<CheckIcon />}>
              Понятно
            </Button>
          </Stack>
          <Box className={styles.sheetArrow} />
        </Paper>
      </Box>
      <Group
        justify="space-around"
        py="sm"
        bg="var(--mantine-color-default)"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        c="var(--mantine-color-blue-filled)"
      >
        <CaretLeftIcon size={20} />
        <CaretRightIcon size={20} />
        <ExportIcon size={20} />
        <BookOpenIcon size={20} />
        <CopyIcon size={20} />
      </Group>
    </Stack>
  );
}

export default IosSheetMock;
