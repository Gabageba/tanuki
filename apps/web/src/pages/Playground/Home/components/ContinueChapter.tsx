import { Box } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';
import type { ContinueItem } from '../models';

type Props = {
  item: ContinueItem;
};

/** Где остановился: «Гл. 12» моноширинным; без номера — название главы; нет и его — прочерк. */
function ContinueChapter({ item: { chapterNumber, chapterTitle } }: Props) {
  if (chapterNumber) {
    return (
      <Box component="span" ff="monospace">
        Гл.&nbsp;{chapterNumber}
      </Box>
    );
  }

  if (chapterTitle) {
    return chapterTitle;
  }

  return <Mdash />;
}

export default ContinueChapter;
