import { Box, Group } from '@mantine/core';
import type { TitleCardViewSlots } from '../models';
import styles from '../TitleCard.module.scss';

type Props = Pick<TitleCardViewSlots, 'meta' | 'actions'>;

function TitleCardMetaRow({ meta, actions }: Props) {
  return (
    <Group data-card-meta className={styles.metaRow} gap={6} wrap="nowrap" align="center">
      <Box data-card-meta-content className={styles.meta} miw={0} flex="1 1 auto">
        {meta === 0 ? null : meta}
      </Box>
      <Group
        className={styles.actions}
        pos="relative"
        ml="auto"
        flex="none"
        gap={0}
        wrap="nowrap"
        fz="sm"
        lh="tight"
      >
        {actions}
      </Group>
    </Group>
  );
}

export default TitleCardMetaRow;
