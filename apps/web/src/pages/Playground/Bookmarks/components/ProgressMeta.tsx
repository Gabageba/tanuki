import { Box, Text } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';
import type { MockBookmark } from '../models';

type Props = {
  bookmark: Pick<MockBookmark, 'progress' | 'chaptersCount'>;
};

/** «Гл. 1090 из 1093» — фраза Golos Text, номера в ней моноширинные. Без отметки — число глав,
 *  без него — прочерк. */
function ProgressMeta({ bookmark }: Props) {
  const { progress, chaptersCount } = bookmark;

  if (progress) {
    return (
      <Text component="span" inherit>
        Гл.&nbsp;
        <Box component="span" ff="monospace">
          {progress.chapter}
        </Box>{' '}
        из&nbsp;
        <Box component="span" ff="monospace">
          {progress.total}
        </Box>
      </Text>
    );
  }

  if (chaptersCount) {
    return (
      <Box component="span" ff="monospace">
        {chaptersCount}&nbsp;гл.
      </Box>
    );
  }

  return <Mdash />;
}

export default ProgressMeta;
