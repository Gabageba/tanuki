import { Box } from '@mantine/core';
import styles from './SheetRow.module.scss';

/** Линия между группами мобильного меню — как Menu.Divider. */
function SheetDivider() {
  return <Box className={styles.divider} my={4} />;
}

export default SheetDivider;
