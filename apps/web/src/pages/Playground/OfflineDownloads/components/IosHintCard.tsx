import { Badge, Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  ArrowRightIcon,
  ClockIcon,
  DeviceMobileIcon,
  ExportIcon,
  PlusSquareIcon,
} from '@phosphor-icons/react';

type Props = {
  /** H7 — шаги чипами со значками кнопок Safari вместо фразы. */
  withChips?: boolean;
};

/** H6/H7 — подсказка iOS карточкой, как строка уведомления: серый квадрат с иконкой, текст,
 *  «Не сейчас» в углу. */
function IosHintCard({ withChips = false }: Props) {
  return (
    <Paper withBorder radius="md" p="sm">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon variant="muted" color="gray" size={32} radius="md" flex="none">
          <DeviceMobileIcon size={18} />
        </ThemeIcon>
        <Stack gap={6} flex={1} miw={0}>
          <Text fz="sm" fw={500}>
            Установите Tanuki на экран Домой
          </Text>
          {withChips ? (
            <>
              <Group gap={6}>
                <Badge
                  variant="muted"
                  color="gray"
                  tt="none"
                  fw={500}
                  leftSection={<ExportIcon size={12} />}
                >
                  Поделиться
                </Badge>
                <ArrowRightIcon size={12} color="var(--mantine-color-dimmed)" />
                <Badge
                  variant="muted"
                  color="gray"
                  tt="none"
                  fw={500}
                  leftSection={<PlusSquareIcon size={12} />}
                >
                  На экран Домой
                </Badge>
              </Group>
              <Text fz={12} c="dimmed">
                Без установки Safari удаляет скачанное, если не открывать сайт 7 дней
              </Text>
            </>
          ) : (
            <Text fz={12} c="dimmed">
              Без установки Safari удаляет скачанное, если не открывать сайт 7 дней. «Поделиться» →
              «На экран Домой».
            </Text>
          )}
        </Stack>
        <Button size="xs" variant="subtle" color="gray" leftSection={<ClockIcon />} flex="none">
          Не сейчас
        </Button>
      </Group>
    </Paper>
  );
}

export default IosHintCard;
