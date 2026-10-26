import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SourceImportFolder } from '@tanuki/contracts';

type Props = {
  folder: SourceImportFolder;
};

/**
 * Сколько тайтлов ляжет из папки: число — колонкой моноширинным, «Нового нет» — словами. Тайтлы
 * все уже в закладках, но отметки расходятся — их число.
 */
function SourceFolderCount({ folder }: Props) {
  const { t } = useTranslation();
  const { fresh, total, progressDiffers } = folder;

  if (fresh === 0 && progressDiffers > 0) {
    return (
      <Text ff="monospace" fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {t('countMarks', { count: progressDiffers })}
      </Text>
    );
  }

  if (fresh === 0) {
    return (
      <Text fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {t('nothingNew')}
      </Text>
    );
  }

  return (
    <Text ff="monospace" fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
      {fresh === total
        ? t('countTitles', { count: total })
        : t('countNewOfTotal', { count: fresh, total })}
    </Text>
  );
}

export default SourceFolderCount;
