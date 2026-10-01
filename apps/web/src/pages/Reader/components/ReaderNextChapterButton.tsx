import { Button } from '@mantine/core';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  titleId: string;
  chapterId: string;
};

/** Настоящий переход пересоберёт ленту с этой главы и запросит её заново. Клик не должен заодно
 *  считаться тапом по странице или по зоне листания. */
function ReaderNextChapterButton({ titleId, chapterId }: Props) {
  const { t } = useTranslation();

  return (
    <Button
      component={Link}
      to={generatePath(ROUTE_PATHS.READER, { titleId, chapterId })}
      onClick={(event: MouseEvent) => event.stopPropagation()}
      leftSection={<ArrowRightIcon />}
    >
      {t('nextChapter')}
    </Button>
  );
}

export default ReaderNextChapterButton;
