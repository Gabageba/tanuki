import { Box } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ContinueReadingItem } from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  chapter: ContinueReadingItem['chapter'];
};

/** Где остановился: «Гл. 12» моноширинным; без номера — название главы; нет и его — прочерк. */
function ContinueChapter({ chapter }: Props) {
  const { t } = useTranslation();

  if (chapter.number !== null) {
    return (
      <Box component="span" ff="monospace" lh="tight">
        {t('chapterNumberAbbrev', { number: chapter.number })}
      </Box>
    );
  }

  if (chapter.title) {
    return chapter.title;
  }

  return <Mdash />;
}

export default ContinueChapter;
