import { Button, Center, Loader, Text } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import { useChapterPages } from '@/shared/api/manga';
import styles from './ReaderPage.module.scss';

export default function ReaderPage() {
  const {
    sourceId = '',
    mangaId = '',
    chapterId = '',
  } = useParams<{
    sourceId: string;
    mangaId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useChapterPages(sourceId, mangaId, chapterId);

  if (isLoading) {
    return (
      <Center className={styles.reader} mih="100vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Center className={styles.reader} mih="100vh">
        <Text c="red">Не удалось загрузить главу. Источник может быть недоступен.</Text>
      </Center>
    );
  }

  const nextChapterId = data.nextChapterId?.slice(sourceId.length + 1);

  return (
    <div className={styles.reader}>
      {data.items.map((page) => (
        <img
          key={page.index}
          src={page.url}
          alt={`Страница ${page.index + 1} из ${data.items.length}`}
          loading="lazy"
          decoding="async"
          className={styles.page}
        />
      ))}

      <Center py="xl">
        {nextChapterId ? (
          <Button
            onClick={() => void navigate(`/manga/${sourceId}/${mangaId}/read/${nextChapterId}`)}
          >
            Следующая глава
          </Button>
        ) : (
          <Text c="dimmed">Это последняя глава</Text>
        )}
      </Center>
    </div>
  );
}
