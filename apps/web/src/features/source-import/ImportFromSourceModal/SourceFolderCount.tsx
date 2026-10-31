import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SourceImportFolder } from '@tanuki/contracts';

type Props = {
  folder: SourceImportFolder;
};

/**
 * Новые тайтлы, расхождения папок и отметок показываются отдельно: существующий тайтл в другой
 * папке — повод для выбора, но не новая закладка.
 */
function SourceFolderCount({ folder }: Props) {
  const { t } = useTranslation();
  const { fresh, total, otherFolder, progressDiffers } = folder;
  const newTitles = fresh - otherFolder;
  const counts = [
    newTitles > 0 &&
      (newTitles === total
        ? t('countTitles', { count: total })
        : t('countNewOfTotal', { count: newTitles, total })),
    otherFolder > 0 && t('countInOtherFolder', { count: otherFolder }),
    progressDiffers > 0 && t('countMarks', { count: progressDiffers }),
  ].filter(Boolean);

  if (counts.length === 0) {
    return (
      <Text fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {t('nothingNew')}
      </Text>
    );
  }

  return (
    <Stack gap={2} align="flex-end">
      {counts.map((count) => (
        <Text
          key={String(count)}
          ff="monospace"
          fz="xs"
          c="dimmed"
          style={{ whiteSpace: 'nowrap' }}
        >
          {count}
        </Text>
      ))}
    </Stack>
  );
}

export default SourceFolderCount;
