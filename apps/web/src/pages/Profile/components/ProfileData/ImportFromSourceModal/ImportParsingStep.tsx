import { Button, Loader, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  sourceTitle: string;
  onCancel: () => void;
};

/** Шаг импорта между выбором источника и выбором тайтлов: закладки читаются с источника. */
function ImportParsingStep({ sourceTitle, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <Stack align="center" gap="sm" mt="lg">
      <Loader />
      <Stack gap={4}>
        <Text fw={500} fz={16}>
          {t('readingBookmarksOn', { source: sourceTitle })}
        </Text>
        <Text fz={13} c="dimmed" ta="center">
          {t('mayTakeUpToMinute')}
        </Text>
      </Stack>

      <Button variant="default" onClick={onCancel}>
        {t('cancel')}
      </Button>
    </Stack>
  );
}

export default ImportParsingStep;
