import { Box } from '@mantine/core';
import styles from './MobileMenu.module.scss';

/** Линия между разделами мобильного меню — как Menu.Divider. */
function MobileMenuDivider() {
  return <Box className={styles.divider} my={4} />;
}

export default MobileMenuDivider;
