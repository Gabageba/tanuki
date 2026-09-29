import { Box, SimpleGrid } from '@mantine/core';
import DeleteAccountSection from './DeleteAccountSection';
import SessionsSection from './SessionsSection';
import AccountSection from './AccountSection';
import styles from './ProfileSignInAndSecurity.module.scss';

function ProfileSignInAndSecurity() {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} mt="lg" spacing="md" className={styles.grid}>
      <AccountSection />
      <Box className={styles.sessions}>
        <SessionsSection />
      </Box>
      <DeleteAccountSection />
    </SimpleGrid>
  );
}

export default ProfileSignInAndSecurity;
