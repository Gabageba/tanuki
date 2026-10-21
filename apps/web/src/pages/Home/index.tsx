import { SimpleGrid, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import ContinueReading from './components/ContinueReading';
import NewChapterBookmarks from './components/NewChapterBookmarks';
import SelectionsTile from './components/SelectionsTile';
import SourcesTile from './components/SourcesTile';
import useHomeQueries from './hooks/useHomeQueries';

/**
 * Главная (P4a + V2a + W2): «моё» — «Продолжить чтение» и «Новые главы в закладках» — и два
 * входа, в подборки и во все источники. Пустой не бывает: плитки есть всегда.
 */
function Home() {
  const { t } = useTranslation();

  return (
    <PageLayout useQueries={useHomeQueries}>
      <PageLayout.Content title={t('home')}>
        <Stack gap="xl">
          <ContinueReading />
          <NewChapterBookmarks />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <SelectionsTile />
            <SourcesTile />
          </SimpleGrid>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Home;
