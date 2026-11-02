import { Center, Group, Paper, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import LogoHorizontal from '../Layout/Header/LogoHorizontal';
import StatusIndicator from '@/shared/ui/StatusIndicator';
import { STATUS_OK_COLOR } from '@/shared/lib/palette';
import ColorSchemeToggle from '@/shared/ui/ColorSchemeToggle';
import useSourcesCount from './hooks/useSourcesCount';
import styles from './AuthLayout.module.scss';

function AuthLayout() {
  const { t } = useTranslation();
  const { data: sourcesCount } = useSourcesCount();

  return (
    <Center className={styles.root} mih="100vh" px="xl" py="lg">
      <div className={styles.backdrop} aria-hidden>
        <div className={`${styles.glow} ${styles.glowWarm}`} />
        <div className={`${styles.glow} ${styles.glowCool}`} />
        <div className={styles.halftone} />
        <div className={styles.vignette} />
      </div>

      <Group pos="fixed" top={20} px="xl" justify="space-between" w="100%">
        <LogoHorizontal />

        <Group>
          <StatusIndicator
            label={
              <Text span c="dimmed">
                {t('countSources', { count: sourcesCount?.count ?? 0 })}
              </Text>
            }
            gap={8}
            color={STATUS_OK_COLOR}
          />
          <ColorSchemeToggle />
        </Group>
      </Group>

      <Paper
        className={styles.card}
        withBorder
        px={{ base: 'lg', xs: 'xl' }}
        py="xl"
        radius="md"
        maw={380}
        w="100%"
        bg="var(--mantine-color-body)"
      >
        <Outlet />
      </Paper>
    </Center>
  );
}

export default AuthLayout;
