import { Button, Center, Loader, Text } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import useChapterPages from './hooks/useChapterPages';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import styles from './ReaderPage.module.scss';

function ReaderPage() {
  const { t } = useTranslation();
  const { titleId = '', chapterId = '' } = useParams<{ titleId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { data, error, isPending, isError } = useChapterPages({ titleId, chapterId });

  if (isPending) {
    return (
      <Center className={styles.reader} mih="100vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Center className={styles.reader} mih="100vh">
        <ApiErrorText error={error} />
      </Center>
    );
  }

  const nextChapterId = data.nextChapterId;

  return (
    <div className={styles.reader}>
      {data.items.map((page) => (
        <img
          key={page.index}
          src={page.url}
          alt={t('pageOfTotal', { page: page.index + 1, total: data.items.length })}
          loading="lazy"
          decoding="async"
          className={styles.page}
        />
      ))}

      <Center py="xl">
        {nextChapterId ? (
          <Button onClick={() => void navigate(`/title/${titleId}/read/${nextChapterId}`)}>
            {t('nextChapter')}
          </Button>
        ) : (
          <Text className={styles.hint}>{t('thisIsLastChapter')}</Text>
        )}
      </Center>
    </div>
  );
}

export default ReaderPage;
