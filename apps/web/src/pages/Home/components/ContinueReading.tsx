import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import type useHomeQueries from '../hooks/useHomeQueries';
import QueryBlock from '@/shared/ui/QueryBlock';
import ContinueReadingEmpty from './ContinueReadingEmpty';
import ContinueReadingList from './ContinueReadingList';
import ContinueReadingSkeleton from './ContinueReadingSkeleton';
import HomeBlock from './HomeBlock';

/** «Продолжить чтение» — лента карточек C1a. Заголовок есть всегда, под ним — скелетон ленты,
 *  затем лента или пустое состояние: ничего не читали или всё убрали. */
function ContinueReading() {
  const { t } = useTranslation();
  const { continueReading } = PageLayout.useQueries<typeof useHomeQueries>();

  return (
    <HomeBlock title={t('continueReading')}>
      <QueryBlock
        query={continueReading}
        skeleton={<ContinueReadingSkeleton />}
        empty={<ContinueReadingEmpty />}
      >
        {(data) => <ContinueReadingList items={data.items} />}
      </QueryBlock>
    </HomeBlock>
  );
}

export default ContinueReading;
