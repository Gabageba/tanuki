import { Box } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import GroupedList from '@/shared/ui/GroupedList';
import GroupedListRowSkeleton from '@/shared/ui/GroupedList/GroupedListRowSkeleton';
import ReaderSliderRowSkeleton from './ReaderSliderRowSkeleton';
import styles from './SettingsReader.module.scss';

/** Пока режим неизвестен, резервируем раскладку настроек вертикального чтения. */
function SettingsReaderSkeleton() {
  const { t } = useTranslation();

  return (
    <Box className={styles.grid}>
      <GroupedList label={t('display')}>
        <GroupedListRowSkeleton />
        <GroupedListRowSkeleton />
        <ReaderSliderRowSkeleton />
        <ReaderSliderRowSkeleton />
      </GroupedList>

      <Box className={styles.mainColumn}>
        <GroupedList label={t('gapsAndClickZone')}>
          <ReaderSliderRowSkeleton />
          <ReaderSliderRowSkeleton />
        </GroupedList>
      </Box>

      <Box className={styles.behavior}>
        <GroupedList label={t('behavior')}>
          <GroupedListRowSkeleton />
          <GroupedListRowSkeleton />
          <ReaderSliderRowSkeleton />
          <GroupedListRowSkeleton />
        </GroupedList>
      </Box>
    </Box>
  );
}

export default SettingsReaderSkeleton;
