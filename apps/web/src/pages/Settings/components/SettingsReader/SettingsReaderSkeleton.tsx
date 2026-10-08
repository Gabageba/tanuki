import { Box } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import GroupedList from '@/shared/ui/GroupedList';
import GroupedListRowSkeleton from '@/shared/ui/GroupedList/GroupedListRowSkeleton';
import ReaderSliderRowSkeleton from './ReaderSliderRowSkeleton';
import styles from './SettingsReader.module.scss';

/** Загрузка вкладки «Читалка»: те же три блока в той же сетке, строки — заглушками. */
function SettingsReaderSkeleton() {
  const { t } = useTranslation();

  return (
    <Box className={styles.grid}>
      <GroupedList label={t('display')}>
        <GroupedListRowSkeleton />
        <GroupedListRowSkeleton />
        <ReaderSliderRowSkeleton />
      </GroupedList>

      <Box className={styles.spacing}>
        <GroupedList label={t('gapsAndClickZone')}>
          <ReaderSliderRowSkeleton />
          <ReaderSliderRowSkeleton />
          <ReaderSliderRowSkeleton />
        </GroupedList>
      </Box>

      <Box className={styles.behavior}>
        <GroupedList label={t('behavior')} loading skeletonRows={2} />
      </Box>
    </Box>
  );
}

export default SettingsReaderSkeleton;
