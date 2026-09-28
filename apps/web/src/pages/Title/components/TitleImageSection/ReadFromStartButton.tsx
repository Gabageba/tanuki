import { Button } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Chapter } from '@tanuki/contracts';
import { getReaderPath } from '@/entities/title/readingProgress';

type Props = {
  titleId: string;
  /** Первая глава ветки; пока её нет, кнопка неактивна. */
  firstChapter: Chapter | undefined;
};

function ReadFromStartButton({ titleId, firstChapter }: Props) {
  const { t } = useTranslation();

  if (!firstChapter) {
    return (
      <Button disabled fullWidth>
        {t('readFromStart')}
      </Button>
    );
  }

  return (
    <Button component={Link} to={getReaderPath(titleId, firstChapter.id)} fullWidth>
      {t('readFromStart')}
    </Button>
  );
}

export default ReadFromStartButton;
