import { Button } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BookOpenIcon } from '@phosphor-icons/react';
import type { Chapter, ChapterNumbering } from '@tanuki/contracts';
import { getChapterLabel, getReaderPath } from '@/entities/title/readingProgress';

type Props = {
  titleId: string;
  chapter: Chapter;
  pageIndex: number;
  numbering: ChapterNumbering;
};

function ContinueReadingButton({ titleId, chapter, pageIndex, numbering }: Props) {
  const { t } = useTranslation();

  return (
    <Button
      component={Link}
      to={getReaderPath(titleId, chapter.id, pageIndex)}
      fullWidth
      leftSection={<BookOpenIcon />}
    >
      {t('continueFrom', { chapter: getChapterLabel(chapter, numbering, t) })}
    </Button>
  );
}

export default ContinueReadingButton;
