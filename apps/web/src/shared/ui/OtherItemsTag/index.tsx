import { Box } from '@mantine/core';
import styles from './OtherItemsTag.module.scss';

type Props = {
  count: number | null;
};

function OtherItemsTag({ count }: Props) {
  if (!count) {
    return null;
  }

  return (
    <Box bdrs="sm" p={4} ml={6} className={styles.tag} fz={12} ff="monospace">
      +{count}
    </Box>
  );
}

export default OtherItemsTag;
