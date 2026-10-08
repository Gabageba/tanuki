import { Divider, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import GroupedListRowSkeleton from '@/shared/ui/GroupedList/GroupedListRowSkeleton';
import TextSkeleton from '@/shared/ui/TextSkeleton';

/** Семейств с входом и источников в них обычно столько — заглушки повторяют этот расклад. */
const SKELETON_FAMILIES = 2;
const SKELETON_ROWS = 3;

/** Загрузка вкладки «Аккаунты источников»: пояснение и блоки семейств, названия — плашками. */
function ProfileSourceAccountsSkeleton() {
  const { t } = useTranslation();

  return (
    <Stack mt="lg" gap="lg">
      <Text c="dimmed">{t('sourcesWithLoginOpenViaYourAccount')}</Text>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {Array.from({ length: SKELETON_FAMILIES }, (_, family) => (
          <Stack key={family} gap="xs">
            <TextSkeleton fz={12} lh="tight" w={120} />
            <Paper withBorder radius="md">
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <Fragment key={index}>
                  {index > 0 && <Divider />}
                  <GroupedListRowSkeleton />
                </Fragment>
              ))}
            </Paper>
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default ProfileSourceAccountsSkeleton;
