import { useState } from 'react';
import {
  Button,
  Collapse,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  ArrowClockwiseIcon,
  CaretDownIcon,
  CaretUpIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { MissedGroup } from '../models';
import NotRespondedRow from './NotRespondedRow';

type Props = {
  missed: MissedGroup[];
  isRetrying: boolean;
  onRetry: () => void;
};

/**
 * Под выдачей — свёрнутый блок «Не ответили N источников» с «Повторить»; раскрытый — строка на
 * источник с причиной. Повтор перезапрашивает только не ответившие: их места снова скелетоном,
 * найденное у остальных остаётся.
 */
function NotRespondedBlock({ missed, isRetrying, onRetry }: Props) {
  const { t } = useTranslation();
  const [isOpened, setIsOpened] = useState(false);

  if (missed.length === 0) {
    return null;
  }

  return (
    <Paper withBorder radius="md">
      <Group justify="space-between" wrap="nowrap" gap="sm" px="md" py="xs">
        <UnstyledButton onClick={() => setIsOpened((prev) => !prev)} miw={0}>
          <Group gap="xs" wrap="nowrap">
            <WarningCircleIcon size={18} color="var(--mantine-color-dimmed)" />
            <Text fz="sm">{t('sourcesDidNotRespond', { count: missed.length })}</Text>
            {isOpened ? <CaretUpIcon /> : <CaretDownIcon />}
          </Group>
        </UnstyledButton>
        <Button
          variant="default"
          size="xs"
          flex="none"
          leftSection={<ArrowClockwiseIcon />}
          loading={isRetrying}
          onClick={onRetry}
        >
          {t('retry')}
        </Button>
      </Group>
      <Collapse expanded={isOpened}>
        <Stack gap={0}>
          {missed.map((group) => (
            <Stack key={group.source.id} gap={0}>
              <Divider />
              <NotRespondedRow group={group} />
            </Stack>
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
}

export default NotRespondedBlock;
