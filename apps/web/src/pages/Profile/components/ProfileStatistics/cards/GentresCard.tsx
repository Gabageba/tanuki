import { useTranslation } from 'react-i18next';
import ProfileStatisticCard from './ProfileStatisticCard';
import { GENRES_MOCK } from './mocks';
import ProgressList from '@/shared/ui/ProgressList';

function GenresCard() {
  const { t } = useTranslation();

  return (
    <ProfileStatisticCard label={t('genres')} extra={t('byChaptersRead')}>
      <ProgressList
        gap="sm"
        items={GENRES_MOCK.map(({ name, chapters }) => ({
          key: name,
          label: name,
          value: chapters,
          text: t('countChaptersAbbrev', { count: chapters }),
        }))}
        highlightedIndex={0}
      />
    </ProfileStatisticCard>
  );
}

export default GenresCard;
