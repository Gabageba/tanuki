import { Box, Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import TitleGridCardSkeleton from '@/entities/title/card/TitleGridCard/TitleGridCardSkeleton';
import HomeBlockHeading from './HomeBlockHeading';

/** Карточек в скелетоне — с запасом на широкий экран, лишние обрезаются. */
const CARDS_COUNT = 8;

function ContinueReadingSkeleton() {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <HomeBlockHeading title={t('continueReading')} />
      <Group gap="md" wrap="nowrap" align="flex-start" style={{ overflow: 'hidden' }}>
        {Array.from({ length: CARDS_COUNT }).map((_, index) => (
          <Box key={index} w={{ base: 128, sm: 168 }} flex="none">
            <TitleGridCardSkeleton />
          </Box>
        ))}
      </Group>
    </Stack>
  );
}

export default ContinueReadingSkeleton;
