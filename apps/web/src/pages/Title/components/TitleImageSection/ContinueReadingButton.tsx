import { Button } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { ChapterNumbering } from '@tanuki/contracts';
import type { ReadingMark } from '@/entities/title/models';
import { getChapterLabel, getReaderPath } from '@/entities/title/readingProgress';

type Props = {
  titleId: string;
  mark: ReadingMark;
  numbering: ChapterNumbering;
};

function ContinueReadingButton({ titleId, mark, numbering }: Props) {
  const { t } = useTranslation();

  return (
    <Button component={Link} to={getReaderPath(titleId, mark.chapter.id, mark.pageIndex)} fullWidth>
      {t('continueFrom', { chapter: getChapterLabel(mark.chapter, numbering, t) })}
    </Button>
  );
}

export default ContinueReadingButton;
