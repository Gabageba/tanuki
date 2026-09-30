import { useState, type ReactNode } from 'react';
import { Button, Paper, Stack, Text } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { SourceId } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { AVAILABLE_SOURCES } from '../lib';
import { DEMO_IMPORT_SOURCES, MODAL_WIDTH, type VariantProps } from '../models';

type Props = {
  /** Клик по источнику сам запускает поиск: кнопки «Найти закладки» нет, заранее ничего не выбрано. */
  isInstant?: boolean;
  children: (props: VariantProps) => ReactNode;
};

/** Рамка шириной с модалку: заголовок, пояснение, сам выбор и кнопки — как на первом шаге импорта. */
function PickerDemo({ isInstant = false, children }: Props) {
  const [sourceId, setSourceId] = useState<SourceId | null>(
    isInstant ? null : (AVAILABLE_SOURCES[0]?.id ?? null),
  );
  const source = DEMO_IMPORT_SOURCES.find(({ id }) => id === sourceId);

  return (
    <Stack gap="xs" maw={MODAL_WIDTH}>
      <Paper withBorder radius="md" p="md" shadow="md">
        <Stack>
          <Text fw={600}>Импорт из источника</Text>
          <Text fz={13} c="dimmed">
            Импорт доступен там, где выполнен вход. Дальше можно будет выбрать, какие тайтлы
            забрать.
          </Text>
          {children({ sourceId, onChange: setSourceId })}
          <ModalButtonsLayout>
            <Button variant="default">Отмена</Button>
            {!isInstant && (
              <Button leftSection={<MagnifyingGlassIcon />} disabled={!source}>
                Найти закладки
              </Button>
            )}
          </ModalButtonsLayout>
        </Stack>
      </Paper>
      {isInstant && source && (
        <Text fz={12} c="dimmed">
          Клик сразу запустил чтение закладок на {source.title}.
        </Text>
      )}
    </Stack>
  );
}

export default PickerDemo;
