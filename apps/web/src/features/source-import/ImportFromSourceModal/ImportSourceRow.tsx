import { Group, Radio, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import { isImportableSource } from './lib';

type Props = {
  source: Source;
  isSelected: boolean;
};

/**
 * Источник внутри рамки сети: откуда можно импортировать — радио во всю ширину строки; без входа
 * или без поддержки импорта — приглушён, второе объясняется под названием.
 */
function ImportSourceRow({ source, isSelected }: Props) {
  const { t } = useTranslation();
  const isImportable = isImportableSource(source);
  const content = (
    <Group gap="md" wrap="nowrap" flex={1} miw={0}>
      <SourceIcon id={source.id} title={source.title} size={28} opacity={isImportable ? 1 : 0.5} />
      <Stack gap={2} miw={0}>
        <Text fz="sm" lh="tight" c={isImportable ? undefined : 'dimmed'} truncate>
          {source.title}
        </Text>
        {source.isLoggedIn && !source.isBookmarksImportSupported && (
          <Text fz="xs" lh="tight" c="dimmed">
            {t('importNotSupportedYet')}
          </Text>
        )}
      </Stack>
    </Group>
  );

  if (!isImportable) {
    return (
      <Group px="md" py="xs" wrap="nowrap">
        {content}
      </Group>
    );
  }

  return (
    <Radio.Card
      value={source.id}
      withBorder={false}
      radius={0}
      px="md"
      py="xs"
      bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
    >
      <Group justify="space-between" wrap="nowrap">
        {content}
        <Radio.Indicator variant="outline" />
      </Group>
    </Radio.Card>
  );
}

export default ImportSourceRow;
